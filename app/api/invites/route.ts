import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_TIER, type Role } from "@/lib/roles";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "THE";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getActorRole(userId: string): Promise<Role | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", userId).single();
  return (data?.role as Role) ?? null;
}

// GET — list invite codes (role-scoped)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = await getActorRole(user.id);
  if (!actorRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const self = req.nextUrl.searchParams.get("self") === "1";

  if (self) {
    // Any authenticated user can view their own code(s)
    const { data } = await admin
      .from("invite_codes")
      .select("id,code,status,generated_at,used_at")
      .eq("generated_by", user.id)
      .order("generated_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  // Admin list — watcher+ only
  if (ROLE_TIER[actorRole] < ROLE_TIER.watcher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Chaos sees all; watcher sees their own + wanderer codes
  let query = admin
    .from("invite_codes")
    .select(`
      id, code, status, generated_at, used_at,
      generated_by, used_by,
      generator:profiles!invite_codes_generated_by_fkey(display_name, username, role),
      user:profiles!invite_codes_used_by_fkey(display_name, username)
    `)
    .order("generated_at", { ascending: false });

  if (actorRole !== "chaos") {
    // Watcher: own codes + wanderer codes only
    const { data: wanderers } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "wanderer");
    const wandererIds = (wanderers ?? []).map(w => w.id);
    const generatorIds = [user.id, ...wandererIds];
    query = query.in("generated_by", generatorIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — generate a new invite code
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = await getActorRole(user.id);
  if (!actorRole || ROLE_TIER[actorRole] < ROLE_TIER.watcher) {
    return NextResponse.json({ error: "Forbidden: only watcher+ can generate codes manually" }, { status: 403 });
  }

  const admin = createAdminClient();

  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await admin.from("invite_codes").select("id").eq("code", code).single();
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const { data, error } = await admin
    .from("invite_codes")
    .insert({ code, generated_by: user.id, status: "active" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — revoke a code
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = await getActorRole(user.id);
  if (!actorRole || ROLE_TIER[actorRole] < ROLE_TIER.watcher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { data: code } = await admin.from("invite_codes").select("generated_by, status").eq("id", id).single();
  if (!code) return NextResponse.json({ error: "Code not found" }, { status: 404 });
  if (code.status !== "active") return NextResponse.json({ error: "Code is not active" }, { status: 400 });

  // Get generator's role
  const { data: generator } = await admin.from("profiles").select("role").eq("id", code.generated_by).single();
  const generatorRole = (generator?.role as Role) ?? "unnamed";

  // Chaos can revoke any; watcher can only revoke wanderer codes + own codes
  if (actorRole !== "chaos") {
    const isOwn = code.generated_by === user.id;
    const isWandererCode = ROLE_TIER[generatorRole] === ROLE_TIER.wanderer;
    if (!isOwn && !isWandererCode) {
      return NextResponse.json({ error: "Forbidden: watcher can only revoke wanderer codes or own codes" }, { status: 403 });
    }
  }

  const { error } = await admin.from("invite_codes").update({ status: "revoked" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
