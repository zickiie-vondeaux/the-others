import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
