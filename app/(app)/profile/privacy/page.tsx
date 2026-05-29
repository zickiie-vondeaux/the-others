"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import type { PrivacySettings } from "@/lib/supabase/types";

const TOGGLES: { key: keyof PrivacySettings; label: string; desc: string }[] = [
  { key: "bio",         label: "Bio",               desc: "Your personal bio text." },
  { key: "personality", label: "Personality results", desc: "Your quiz results (MBTI, Big Five, etc.). Only shown if you've completed at least one test." },
  { key: "favorites",  label: "Likes & favorites",  desc: "Your favorite game, movie, food, music, and color." },
  { key: "activity",   label: "Recent activity",    desc: "Games you added, movies you watched, polls you created, and events you joined." },
  { key: "steam",      label: "Steam profile link",  desc: "A link to your Steam profile. Only shown if you've connected a Steam account." },
];

const DEFAULTS: PrivacySettings = {
  bio: true, personality: true, favorites: true, activity: true, steam: true,
};

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULTS);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("privacy_settings")
        .eq("id", user.id)
        .single();
      if (data?.privacy_settings) {
        setSettings({ ...DEFAULTS, ...data.privacy_settings });
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ privacy_settings: settings }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggle(key: keyof PrivacySettings) {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  }

  if (loading) {
    return (
      <>
        <TopBar title="Privacy Settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-purple)" }} />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Privacy Settings" />

      <div className="flex-1 py-6 px-[8%] overflow-y-auto">
        <div className="max-w-lg space-y-6">

          {/* Header */}
          <div>
            <Link href="/profile"
              className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors"
              style={{ color: "var(--color-text-muted)" }}>
              <ArrowLeft size={13} /> Back to profile
            </Link>
            <h1 className="neon-heading text-3xl font-black uppercase tracking-widest">Privacy</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Choose which sections are visible on your public profile. Turning a section off hides it from everyone — but you can still see it on your own profile.
            </p>
          </div>

          {/* Toggles */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {TOGGLES.map(({ key, label, desc }, idx) => (
              <div
                key={key}
                className={idx !== 0 ? "border-t" : ""}
                style={{ borderColor: "var(--color-border)" }}
              >
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      {desc}
                    </p>
                  </div>
                  <Toggle on={settings[key]} />
                </button>
              </div>
            ))}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : saved
                  ? <><Check size={14} /> Saved</>
                  : "Save changes"
              }
            </button>
            <Link href="/profile"
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}>
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
      style={{ backgroundColor: on ? "var(--color-purple)" : "var(--color-border)" }}
    >
      <div
        className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
        style={{
          backgroundColor: on ? "white" : "var(--color-text-muted)",
          left: on ? "calc(100% - 1.25rem)" : "0.25rem",
        }}
      />
    </div>
  );
}
