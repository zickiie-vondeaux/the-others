import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchGames } from "@/lib/igdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) {
    return NextResponse.json([]);
  }

  try {
    const games = await searchGames(q);
    return NextResponse.json(games);
  } catch (e) {
    console.error("IGDB search error:", e);
    return NextResponse.json({ error: "IGDB search failed" }, { status: 500 });
  }
}
