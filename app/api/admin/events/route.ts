import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_TIER, type Role } from "@/lib/roles";

async function requireWatcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null };
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const actorRole = (data?.role as Role) ?? "unnamed";
  if (ROLE_TIER[actorRole] < ROLE_TIER.watcher) {
    return { error: "Forbidden", status: 403, user: null };
  }
  return { error: null, status: 200, user };
}

// GET — list all events
export async function GET() {
  const { error, status } = await requireWatcher();
  if (error) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data, error: e } = await admin
    .from("events")
    .select("id,title,type,description,location,start_at,end_at,created_by,created_at,profiles(display_name,username)")
    .order("start_at", { ascending: false })
    .limit(100);

  if (e) return NextResponse.json({ error: e.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — create event
export async function POST(req: NextRequest) {
  const { error, status, user } = await requireWatcher();
  if (error || !user) return NextResponse.json({ error }, { status });

  const body = await req.json() as {
    title: string;
    type: string;
    description?: string;
    location?: string;
    start_at: string;
    end_at?: string;
  };

  if (!body.title || !body.type || !body.start_at) {
    return NextResponse.json({ error: "title, type, and start_at required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: e } = await admin
    .from("events")
    .insert({ ...body, created_by: user.id })
    .select()
    .single();

  if (e) return NextResponse.json({ error: e.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update event
export async function PATCH(req: NextRequest) {
  const { error, status } = await requireWatcher();
  if (error) return NextResponse.json({ error }, { status });

  const { id, ...updates } = await req.json() as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ALLOWED = ["title", "type", "description", "location", "start_at", "end_at"];
  const safe: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in updates) safe[k] = updates[k];

  const admin = createAdminClient();
  const { error: e } = await admin.from("events").update(safe).eq("id", id);
  if (e) return NextResponse.json({ error: e.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — delete event
export async function DELETE(req: NextRequest) {
  const { error, status } = await requireWatcher();
  if (error) return NextResponse.json({ error }, { status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error: e } = await admin.from("events").delete().eq("id", id);
  if (e) return NextResponse.json({ error: e.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
