"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "discord" | null>(null);

  async function signInWith(provider: "google" | "discord") {
    setLoading(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
    setLoading(null);
  }

  return (
    <div className="neon-card w-full max-w-sm p-8 text-center">
      <h1 className="glitch-text text-4xl font-black mb-1">THE OTHERS</h1>
      <p className="text-sm mb-8" style={{ color: "#00ffea88" }}>
        Apparently we&apos;re just acquaintances. Their loss.
      </p>

      <div className="space-y-3">
        <button
          onClick={() => signInWith("google")}
          disabled={loading !== null}
          className="neon-btn-primary w-full flex items-center justify-center gap-3 py-3 px-4 text-sm disabled:opacity-50"
        >
          {loading === "google" ? (
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <button
          onClick={() => signInWith("discord")}
          disabled={loading !== null}
          className="neon-btn-outline w-full flex items-center justify-center gap-3 py-3 px-4 text-sm disabled:opacity-50"
        >
          {loading === "discord" ? (
            <span className="animate-spin w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
          ) : (
            <DiscordIcon />
          )}
          Continue with Discord
        </button>
      </div>

      <p className="text-xs mt-6" style={{ color: "#00ffea66" }}>
        No invite? You&apos;re probably still an acquaintance.{" "}
        <span style={{ color: "#ec4899" }}>Ask Zickiie.</span>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <path d="M15.247 1.177A14.786 14.786 0 0 0 11.612 0c-.169.302-.366.709-.502 1.032a13.662 13.662 0 0 0-4.218 0A11.26 11.26 0 0 0 6.385 0a14.8 14.8 0 0 0-3.636 1.18C.394 4.607-.241 7.946.076 11.24c1.577 1.17 3.105 1.88 4.608 2.347.372-.508.703-1.049.988-1.62a9.68 9.68 0 0 1-1.555-.754c.13-.096.258-.196.381-.298 3 1.39 6.25 1.39 9.214 0 .124.102.252.202.381.298-.497.296-1.02.549-1.557.755.285.572.616 1.114.988 1.62 1.504-.467 3.034-1.177 4.61-2.349.378-3.984-.648-7.291-2.891-10.062zM6.012 9.211c-.908 0-1.65-.842-1.65-1.873s.726-1.875 1.65-1.875c.924 0 1.664.843 1.65 1.875.001 1.031-.726 1.873-1.65 1.873zm6.098 0c-.908 0-1.65-.842-1.65-1.873s.725-1.875 1.65-1.875c.923 0 1.663.843 1.65 1.875 0 1.031-.727 1.873-1.65 1.873z" fill="currentColor"/>
    </svg>
  );
}
