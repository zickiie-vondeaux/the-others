import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchGames, getGame } from "@/lib/rawg";

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

  // Use admin client for all DB ops to bypass RLS
  const admin = createAdminClient();

  const [{ data: game }, { data: profile }] = await Promise.all([
    admin.from("games").select("added_by").eq("id", gameId).single(),
    admin.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const canDelete =
    profile?.role === "super_admin" ||
    profile?.role === "moderator" ||
    game.added_by === user.id;

  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await admin.from("game_reviews").delete().eq("game_id", gameId);
  const { error } = await admin.from("games").delete().eq("id", gameId);

  if (error) {
    console.error("Game delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
