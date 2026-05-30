import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code    = searchParams.get("code");
  const codeId  = searchParams.get("codeId");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const admin = createAdminClient();

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .single();

        const isExistingMember = !!profile;
        const hasInvite = !!codeId;

        // Block users who are neither existing members nor arriving with an invite code
        if (!isExistingMember && !hasInvite) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=no_invite`);
        }

        // Mark invite code as used
        if (codeId) {
          await admin
            .from("invite_codes")
            .update({ status: "used", used_by: user.id, used_at: new Date().toISOString() })
            .eq("id", codeId)
            .eq("status", "active");
        }

        if (!profile || !profile.onboarding_complete) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/group`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
