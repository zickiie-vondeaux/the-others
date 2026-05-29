import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST — validate an invite code and mark it as claimed (pending use)
export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code?: string };
  if (!code?.trim()) return NextResponse.json({ valid: false, error: "No code provided" });

  const admin = createAdminClient();
  const { data } = await admin
    .from("invite_codes")
    .select("id, status")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!data || data.status !== "active") {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, codeId: data.id });
}
