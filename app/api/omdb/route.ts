import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchMovies, getMovie } from "@/lib/omdb";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OMDB_API_KEY) return NextResponse.json([]);

  const s = req.nextUrl.searchParams.get("s")?.trim();
  const i = req.nextUrl.searchParams.get("i")?.trim();

  try {
    if (i) {
      const movie = await getMovie(i);
      return NextResponse.json(movie ?? null);
    }
    if (s && s.length >= 2) {
      const results = await searchMovies(s);
      return NextResponse.json(results);
    }
    return NextResponse.json({ error: "Provide ?s= or ?i=" }, { status: 400 });
  } catch (e) {
    console.error("OMDb error:", e);
    return NextResponse.json({ error: "OMDb request failed" }, { status: 500 });
  }
}
