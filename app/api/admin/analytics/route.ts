import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_TIER, type Role } from "@/lib/roles";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const actorRole = (profile?.role as Role) ?? "unnamed";
  if (ROLE_TIER[actorRole] < ROLE_TIER.watcher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeMembers,
    totalMembers,
    upcomingEvents,
    pastEvents,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true })
      .gte("last_active_at", thirtyDaysAgo.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true })
      .neq("role", "unnamed"),
    admin.from("events").select("id,title,start_at")
      .gte("start_at", new Date().toISOString())
      .order("start_at")
      .limit(10),
    admin.from("events").select("id,title,start_at")
      .lt("start_at", new Date().toISOString())
      .order("start_at", { ascending: false })
      .limit(10),
  ]);

  const stats: Record<string, unknown> = {
    activeMembers: activeMembers.count ?? 0,
    totalMembers:  totalMembers.count ?? 0,
    upcomingEvents: upcomingEvents.data ?? [],
    pastEvents:     pastEvents.data ?? [],
  };

  // Chaos-only stats
  if (actorRole === "chaos") {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [
      gamesAdded,
      moviesAdded,
      inviteStats,
      signupsThisMonth,
    ] = await Promise.all([
      admin.from("games").select("id", { count: "exact", head: true }),
      admin.from("movies").select("id", { count: "exact", head: true }),
      admin.from("invite_codes").select("status"),
      admin.from("profiles").select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
    ]);

    const inviteCounts = (inviteStats.data ?? []).reduce((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    stats.gamesAdded     = gamesAdded.count ?? 0;
    stats.moviesAdded    = moviesAdded.count ?? 0;
    stats.invitesActive  = inviteCounts.active  ?? 0;
    stats.invitesUsed    = inviteCounts.used    ?? 0;
    stats.invitesRevoked = inviteCounts.revoked ?? 0;
    stats.signupsThisMonth = signupsThisMonth.count ?? 0;
  }

  return NextResponse.json(stats);
}
