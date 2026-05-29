import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canPromote, canRevoke,
  ROLE_DISPLAY, ROLE_TIER,
  type Role,
} from "@/lib/roles";

const VALID_ROLES = new Set<Role>(["chaos", "watcher", "ascended", "wanderer", "unnamed"]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const role = profile.role as Role;
  return NextResponse.json({ role, display: ROLE_DISPLAY[role], tier: ROLE_TIER[role] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    target_user_id?: string;
    new_role?: string;
    action?: "promote" | "revoke";
  };

  const { target_user_id, new_role, action } = body;

  if (!target_user_id || !action) {
    return NextResponse.json({ error: "target_user_id and action are required" }, { status: 400 });
  }
  if (new_role && !VALID_ROLES.has(new_role as Role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (action === "promote" && !new_role) {
    return NextResponse.json({ error: "new_role is required for promote" }, { status: 400 });
  }
  if (action !== "promote" && action !== "revoke") {
    return NextResponse.json({ error: "action must be promote or revoke" }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: actorProfile }, { data: targetProfile }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).single(),
    admin.from("profiles").select("role").eq("id", target_user_id).single(),
  ]);

  if (!actorProfile) return NextResponse.json({ error: "Actor profile not found" }, { status: 404 });
  if (!targetProfile) return NextResponse.json({ error: "Target profile not found" }, { status: 404 });

  const actorRole = actorProfile.role as Role;
  const targetCurrentRole = targetProfile.role as Role;

  if (action === "promote") {
    const targetNewRole = new_role as Role;

    if (!canPromote(actorRole, targetCurrentRole, targetNewRole)) {
      return NextResponse.json({ error: "Forbidden: cannot perform this promotion" }, { status: 403 });
    }

    const { error } = await admin
      .from("profiles")
      .update({ role: targetNewRole })
      .eq("id", target_user_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      previous_role: targetCurrentRole,
      new_role: targetNewRole,
      display: ROLE_DISPLAY[targetNewRole],
    });
  }

  // revoke
  if (!new_role) {
    return NextResponse.json({ error: "new_role is required for revoke" }, { status: 400 });
  }

  const targetNewRole = new_role as Role;

  if (!canRevoke(actorRole, targetCurrentRole)) {
    return NextResponse.json({ error: "Forbidden: cannot revoke this role" }, { status: 403 });
  }
  if (ROLE_TIER[targetNewRole] >= ROLE_TIER[targetCurrentRole]) {
    return NextResponse.json({ error: "new_role must be lower than current role for revoke" }, { status: 400 });
  }
  // Actor must also outrank the destination role
  if (!canRevoke(actorRole, targetNewRole)) {
    return NextResponse.json({ error: "Forbidden: actor tier too low for target role" }, { status: 403 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: targetNewRole })
    .eq("id", target_user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    previous_role: targetCurrentRole,
    new_role: targetNewRole,
    display: ROLE_DISPLAY[targetNewRole],
  });
}
