import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_TIER, canPromote, canRevoke, type Role } from "@/lib/roles";

async function requireAdmin(minRole: "watcher" | "chaos" = "watcher") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null, actorRole: null as Role | null };
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const actorRole = (data?.role as Role) ?? "unnamed";
  if (ROLE_TIER[actorRole] < ROLE_TIER[minRole]) {
    return { error: "Forbidden", status: 403, user: null, actorRole: null as Role | null };
  }
  return { error: null, status: 200, user, actorRole };
}

// GET — list all members with extended details
export async function GET() {
  const { error, status, actorRole } = await requireAdmin("watcher");
  if (error) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("profiles")
    .select("id, display_name, username, avatar_url, role, created_at, last_active_at, is_banned, muted_until")
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Attach badges
  const { data: badges } = await admin
    .from("member_badges")
    .select("user_id, badge_slug, badge_label");

  const badgesByUser: Record<string, { badge_slug: string; badge_label: string }[]> = {};
  for (const b of badges ?? []) {
    if (!badgesByUser[b.user_id]) badgesByUser[b.user_id] = [];
    badgesByUser[b.user_id].push({ badge_slug: b.badge_slug, badge_label: b.badge_label });
  }

  const members = (data ?? []).map(m => ({ ...m, badges: badgesByUser[m.id] ?? [] }));
  return NextResponse.json({ members, actorRole });
}

// PATCH — role assignment, badge management, ban/mute/kick
export async function PATCH(req: NextRequest) {
  const { error, status, user, actorRole } = await requireAdmin("watcher");
  if (error || !user || !actorRole) return NextResponse.json({ error }, { status });

  const body = await req.json() as {
    target_id: string;
    action: "set_role" | "ban" | "unban" | "mute" | "unmute" | "add_badge" | "remove_badge";
    new_role?: string;
    muted_until?: string;
    badge_slug?: string;
    badge_label?: string;
  };

  if (!body.target_id || !body.action) {
    return NextResponse.json({ error: "target_id and action required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", body.target_id).single();
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const targetRole = target.role as Role;

  if (body.action === "set_role") {
    const newRole = body.new_role as Role;
    if (!newRole) return NextResponse.json({ error: "new_role required" }, { status: 400 });

    const isPromotion = ROLE_TIER[newRole] > ROLE_TIER[targetRole];
    if (isPromotion) {
      if (!canPromote(actorRole, targetRole, newRole)) {
        return NextResponse.json({ error: "Forbidden: cannot perform this promotion" }, { status: 403 });
      }
    } else {
      if (!canRevoke(actorRole, targetRole)) {
        return NextResponse.json({ error: "Forbidden: cannot revoke this role" }, { status: 403 });
      }
    }
    const { error: e } = await admin.from("profiles").update({ role: newRole }).eq("id", body.target_id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "ban" || body.action === "unban") {
    if (ROLE_TIER[actorRole] <= ROLE_TIER[targetRole]) {
      return NextResponse.json({ error: "Forbidden: cannot ban member of equal or higher tier" }, { status: 403 });
    }
    const { error: e } = await admin.from("profiles")
      .update({ is_banned: body.action === "ban" })
      .eq("id", body.target_id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "mute") {
    if (ROLE_TIER[actorRole] <= ROLE_TIER[targetRole]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { error: e } = await admin.from("profiles")
      .update({ muted_until: body.muted_until ?? null })
      .eq("id", body.target_id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "unmute") {
    const { error: e } = await admin.from("profiles").update({ muted_until: null }).eq("id", body.target_id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "add_badge") {
    if (!body.badge_slug || !body.badge_label) {
      return NextResponse.json({ error: "badge_slug and badge_label required" }, { status: 400 });
    }
    const { error: e } = await admin.from("member_badges").upsert({
      user_id: body.target_id,
      badge_slug: body.badge_slug,
      badge_label: body.badge_label,
      assigned_by: user.id,
    }, { onConflict: "user_id,badge_slug" });
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "remove_badge") {
    if (!body.badge_slug) return NextResponse.json({ error: "badge_slug required" }, { status: 400 });
    const { error: e } = await admin.from("member_badges")
      .delete()
      .eq("user_id", body.target_id)
      .eq("badge_slug", body.badge_slug);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
