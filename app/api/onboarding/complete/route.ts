import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "THE";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // unnamed → wanderer on onboarding completion; preserve any higher role already set
  const currentRole = existing?.role ?? "unnamed";
  const newRole = currentRole === "unnamed" ? "wanderer" : currentRole;

  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    ...body,
    role: newRole,
    onboarding_complete: true,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-generate 1 invite code for new wanderers (only if they don't already have one)
  if (newRole === "wanderer" && currentRole === "unnamed") {
    const { data: existingCode } = await admin
      .from("invite_codes")
      .select("id")
      .eq("generated_by", user.id)
      .limit(1)
      .single();

    if (!existingCode) {
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: taken } = await admin.from("invite_codes").select("id").eq("code", code).single();
        if (!taken) break;
        code = generateCode();
        attempts++;
      }
      await admin.from("invite_codes").insert({
        code,
        generated_by: user.id,
        status: "active",
      });
    }
  }

  return NextResponse.json({ success: true, role: newRole });
}
