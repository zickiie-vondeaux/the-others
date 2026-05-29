import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchGames, getGame } from "@/lib/rawg";
import { canDeleteCard, type Role } from "@/lib/roles";
import { createCardRemovedNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.RAWG_API_KEY) return NextResponse.json([]);

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const id = req.nextUrl.searchParams.get("id");

  try {
    if (id) {
      const game = await getGame(parseInt(id));
      return NextResponse.json(game ?? null);
    }
    if (q && q.length >= 2) {
      const games = await searchGames(q);
      return NextResponse.json(games);
    }
    return NextResponse.json({ error: "Provide ?q= or ?id=" }, { status: 400 });
  } catch (e) {
    console.error("RAWG error:", e);
    return NextResponse.json({ error: "Game search failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gameId = req.nextUrl.searchParams.get("id");
  if (!gameId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[DELETE /api/games] gameId:", gameId, "userId:", user.id, "hasServiceKey:", !!serviceKey);

  // Use admin client for all DB ops to bypass RLS
  const admin = createAdminClient();

  const [{ data: game, error: gameErr }, { data: profile, error: profileErr }] = await Promise.all([
    admin.from("games").select("added_by").eq("id", gameId).single(),
    admin.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  console.log("[DELETE /api/games] game:", game, "gameErr:", gameErr, "profile:", profile, "profileErr:", profileErr);

  if (!game) return NextResponse.json({ error: "Game not found", detail: gameErr?.message }, { status: 404 });

  const { allowed, isModeratorAction } = canDeleteCard(
    profile?.role as Role,
    user.id,
    game.added_by,
  );

  console.log("[DELETE /api/games] allowed:", allowed, "isModeratorAction:", isModeratorAction, "role:", profile?.role, "added_by:", game.added_by);

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error: reviewsErr } = await admin.from("game_reviews").delete().eq("game_id", gameId);
  const { error: deleteErr } = await admin.from("games").delete().eq("id", gameId);

  console.log("[DELETE /api/games] reviewsErr:", reviewsErr, "deleteErr:", deleteErr);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  if (isModeratorAction && game.added_by) {
    await createCardRemovedNotification(game.added_by, "game");
  }

  return NextResponse.json({ success: true });
}
