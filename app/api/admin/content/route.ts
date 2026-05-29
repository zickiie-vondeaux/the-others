import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_TIER, type Role } from "@/lib/roles";
import { createCardRemovedNotification } from "@/lib/notifications";

async function requireWatcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null, actorRole: null as Role | null };
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const actorRole = (data?.role as Role) ?? "unnamed";
  if (ROLE_TIER[actorRole] < ROLE_TIER.watcher) {
    return { error: "Forbidden", status: 403, user: null, actorRole: null as Role | null };
  }
  return { error: null, status: 200, user, actorRole };
}

// GET — list content (tab: flagged | all)
export async function GET(req: NextRequest) {
  const { error, status } = await requireWatcher();
  if (error) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const tab = req.nextUrl.searchParams.get("tab") ?? "flagged";

  if (tab === "flagged") {
    const { data, error: e } = await admin
      .from("content_flags")
      .select(`
        id, content_type, content_id, reason, status, reported_at,
        reporter:profiles!content_flags_reported_by_fkey(display_name, username)
      `)
      .order("reported_at", { ascending: false });
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // "all" tab — return recent games, movies, game_reviews, movie_reviews
  const [games, movies, gReviews, mReviews] = await Promise.all([
    admin.from("games").select("id,title,created_at,added_by,cover_url,profiles!games_added_by_fkey(display_name,username)").order("created_at", { ascending: false }).limit(50),
    admin.from("movies").select("id,title,created_at,added_by,poster_url,profiles!movies_added_by_fkey(display_name,username)").order("created_at", { ascending: false }).limit(50),
    admin.from("game_reviews").select("id,rating,review_text,created_at,user_id,game_id,games(title),profiles!game_reviews_user_id_fkey(display_name,username)").order("created_at", { ascending: false }).limit(50),
    admin.from("movie_reviews").select("id,rating,review_text,created_at,user_id,movie_id,movies(title),profiles!movie_reviews_user_id_fkey(display_name,username)").order("created_at", { ascending: false }).limit(50),
  ]);

  return NextResponse.json({
    games:    games.data   ?? [],
    movies:   movies.data  ?? [],
    gReviews: gReviews.data ?? [],
    mReviews: mReviews.data ?? [],
  });
}

// DELETE — delete a content item
export async function DELETE(req: NextRequest) {
  const { error, status, user } = await requireWatcher();
  if (error || !user) return NextResponse.json({ error }, { status });

  const type   = req.nextUrl.searchParams.get("type");
  const id     = req.nextUrl.searchParams.get("id");
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  const admin = createAdminClient();

  if (type === "game") {
    const { data: game } = await admin.from("games").select("added_by").eq("id", id).single();
    await admin.from("game_reviews").delete().eq("game_id", id);
    const { error: e } = await admin.from("games").delete().eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    if (game?.added_by && game.added_by !== user.id) {
      await createCardRemovedNotification(game.added_by, "game");
    }
    return NextResponse.json({ success: true });
  }

  if (type === "movie") {
    const { data: movie } = await admin.from("movies").select("added_by").eq("id", id).single();
    await admin.from("movie_reviews").delete().eq("movie_id", id);
    const { error: e } = await admin.from("movies").delete().eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    if (movie?.added_by && movie.added_by !== user.id) {
      await createCardRemovedNotification(movie.added_by, "movie");
    }
    return NextResponse.json({ success: true });
  }

  if (type === "game_review") {
    const { error: e } = await admin.from("game_reviews").delete().eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (type === "movie_review") {
    const { error: e } = await admin.from("movie_reviews").delete().eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// PATCH — update flag status (dismiss / action)
export async function PATCH(req: NextRequest) {
  const { error, status } = await requireWatcher();
  if (error) return NextResponse.json({ error }, { status });

  const { flag_id, new_status } = await req.json() as { flag_id: string; new_status: "dismissed" | "actioned" };
  if (!flag_id || !new_status) return NextResponse.json({ error: "flag_id and new_status required" }, { status: 400 });

  const admin = createAdminClient();
  const { error: e } = await admin.from("content_flags").update({ status: new_status }).eq("id", flag_id);
  if (e) return NextResponse.json({ error: e.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
