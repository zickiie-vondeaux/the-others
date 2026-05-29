import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_TIER, type Role } from "@/lib/roles";

async function requireChaos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null };
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const actorRole = (data?.role as Role) ?? "unnamed";
  if (actorRole !== "chaos") {
    return { error: "Forbidden: chaos only", status: 403, user: null };
  }
  return { error: null, status: 200, user };
}

// GET — fetch a member's editable profile fields
export async function GET(req: NextRequest) {
  const { error, status } = await requireChaos();
  if (error) return NextResponse.json({ error }, { status });

  const targetId = req.nextUrl.searchParams.get("id");
  if (!targetId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error: e } = await admin
    .from("profiles")
    .select("id, display_name, bio, favorite_game, favorite_movie, favorite_food, favorite_music, favorite_color, steam_id, username, avatar_url, role")
    .eq("id", targetId)
    .single();

  if (e || !data) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH — edit a member's profile (chaos only, logged)
const EDITABLE_FIELDS = ["display_name", "bio", "favorite_game", "favorite_movie", "favorite_food", "favorite_music", "favorite_color", "steam_id"] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function PATCH(req: NextRequest) {
  const { error, status, user } = await requireChaos();
  if (error || !user) return NextResponse.json({ error }, { status });

  const { target_id, changes } = await req.json() as {
    target_id: string;
    changes: Partial<Record<EditableField, string | null>>;
  };

  if (!target_id || !changes) return NextResponse.json({ error: "target_id and changes required" }, { status: 400 });

  // Strip any fields not in the allowlist
  const safeChanges: Record<string, string | null> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in changes) safeChanges[key] = changes[key] ?? null;
  }

  if (Object.keys(safeChanges).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get current values for audit log
  const { data: current } = await admin
    .from("profiles")
    .select(Object.keys(safeChanges).join(","))
    .eq("id", target_id)
    .single();

  const { error: e } = await admin.from("profiles").update(safeChanges).eq("id", target_id);
  if (e) return NextResponse.json({ error: e.message }, { status: 500 });

  // Log each changed field
  const now = new Date().toISOString();
  const logEntries = Object.entries(safeChanges).map(([field, newVal]) => ({
    target_id,
    edited_by: user.id,
    edited_at: now,
    field_name: field,
    old_value: current ? String((current as unknown as Record<string, unknown>)[field] ?? "") : null,
    new_value: newVal != null ? String(newVal) : null,
  }));

  await admin.from("profile_edit_log").insert(logEntries);

  return NextResponse.json({ success: true });
}
