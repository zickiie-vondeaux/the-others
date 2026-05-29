import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canDeleteCard, type Role } from "@/lib/roles";
import { createCardRemovedNotification } from "@/lib/notifications";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const movieId = req.nextUrl.searchParams.get("id");
  if (!movieId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();

  const [{ data: movie, error: movieErr }, { data: profile, error: profileErr }] = await Promise.all([
    admin.from("movies").select("added_by").eq("id", movieId).single(),
    admin.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (!movie) return NextResponse.json({ error: "Movie not found", detail: movieErr?.message }, { status: 404 });
  if (!profile) return NextResponse.json({ error: "Profile not found", detail: profileErr?.message }, { status: 404 });

  const { allowed, isModeratorAction } = canDeleteCard(
    profile.role as Role,
    user.id,
    movie.added_by,
  );

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error: deleteErr } = await admin.from("movies").delete().eq("id", movieId);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  if (isModeratorAction && movie.added_by) {
    await createCardRemovedNotification(movie.added_by, "movie");
  }

  return NextResponse.json({ success: true });
}
