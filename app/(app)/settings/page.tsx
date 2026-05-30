"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";
import type { PrivacySettings } from "@/lib/supabase/types";

const TOGGLES: { key: keyof PrivacySettings; label: string; desc: string }[] = [
  { key: "bio",         label: "Bio",                 desc: "Your personal bio text." },
  { key: "personality", label: "Personality results", desc: "Your quiz results (MBTI, Big Five, etc.)." },
  { key: "favorites",  label: "Likes & favorites",   desc: "Your favorite game, movie, food, music, and color." },
  { key: "activity",   label: "Recent activity",     desc: "Games added, movies watched, polls created, events joined." },
  { key: "steam",      label: "Steam profile link",  desc: "Only shown if you've connected a Steam account." },
];

const DEFAULTS: PrivacySettings = {
  bio: true, personality: true, favorites: true, activity: true, steam: true,
};

export default function SettingsPage() {
  const [userId, setUserId]     = useState("");
  const [privacy, setPrivacy]   = useState<PrivacySettings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

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
      if (data?.privacy_settings) setPrivacy({ ...DEFAULTS, ...data.privacy_settings });
      setLoading(false);
    });
  }, []);

  async function savePrivacy() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ privacy_settings: privacy }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggle(key: keyof PrivacySettings) {
    setPrivacy(s => ({ ...s, [key]: !s[key] }));
  }

  return (
    <>
      <TopBar title="Settings" />

      <div className="flex-1 py-8 px-[8%] overflow-y-auto">
        <div className="max-w-lg space-y-8">

          <h1
            className="neon-heading text-3xl font-black uppercase tracking-widest hidden lg:block"
          >
            Settings
          </h1>

          {/* Privacy section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#00ffea66" }}>
              Privacy
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              Choose which sections are visible on your public profile.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 py-4" style={{ color: "var(--color-text-muted)" }}>
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : (
              <>
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
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
                        <Toggle on={privacy[key]} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    onClick={savePrivacy}
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
                </div>
              </>
            )}
          </section>

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
