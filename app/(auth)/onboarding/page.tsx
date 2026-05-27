"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { PLATFORMS } from "@/lib/supabase/types";
import {
  Gamepad2, ChevronRight, ChevronLeft, Check,
  User, Cake, Joystick, Heart, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { label: "Identity", icon: User },
  { label: "Birthday", icon: Cake },
  { label: "Platforms", icon: Joystick },
  { label: "Favorites", icon: Heart },
  { label: "Done", icon: Sparkles },
];

interface FormData {
  display_name: string;
  username: string;
  ign: string;
  real_name: string;
  avatar_url: string;
  bio: string;
  birthday: string;
  city: string;
  platforms: string[];
  favorite_game: string;
  favorite_movie: string;
  favorite_food: string;
  favorite_color: string;
  favorite_music: string;
}

const EMPTY: FormData = {
  display_name: "", username: "", ign: "", real_name: "",
  avatar_url: "", bio: "", birthday: "", city: "",
  platforms: [], favorite_game: "", favorite_movie: "",
  favorite_food: "", favorite_color: "#7c3aed", favorite_music: "",
};

function toUsername(name: string) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login");
      // Pre-fill display name from OAuth provider
      const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
      if (name) setForm(f => ({ ...f, display_name: name, username: toUsername(name) }));
    });
  }, [router]);

  function update(field: keyof FormData, value: string | string[]) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === "display_name" && typeof value === "string" && !f.username) {
        next.username = toUsername(value);
      }
      return next;
    });
  }

  function togglePlatform(p: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }));
  }

  function next() {
    setError("");
    if (step === 0 && !form.display_name.trim()) { setError("Display name is required."); return; }
    if (step === 0 && !form.username.trim()) { setError("Username is required."); return; }
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  }

  async function finish() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { error: err } = await supabase.from("profiles").upsert({
      id: user.id,
      ...form,
      onboarding_complete: true,
    });

    if (err) {
      if (err.message.includes("unique") || err.code === "23505") {
        setError("That username is taken. Go back and pick a different one.");
      } else {
        setError(err.message);
      }
      setSaving(false);
      return;
    }

    router.replace("/group");
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-purple), var(--color-cyan))" }}>
            <Gamepad2 size={24} color="white" />
          </div>
        </div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--color-text-primary)" }}>
          Welcome to The Others
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Let's set up your profile — takes about 2 minutes.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
              )}
                style={{
                  backgroundColor: done ? "var(--color-green)" : active ? "var(--color-purple)" : "var(--color-border)",
                  color: done || active ? "white" : "var(--color-text-muted)",
                }}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px" style={{ backgroundColor: i < step ? "var(--color-green)" : "var(--color-border)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="p-8"
          >
            {/* Step label */}
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--color-purple)" }}>
              Step {step + 1} of {STEPS.length}
            </p>

            {/* STEP 0: Identity */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Who are you in The Others?
                </h2>
                <Field label="Display Name *" hint="What everyone calls you">
                  <input value={form.display_name}
                    onChange={e => update("display_name", e.target.value)}
                    placeholder="e.g. Zickiie" className={inputCls} />
                </Field>
                <Field label="Username *" hint="Used in your profile URL — lowercase, underscores only">
                  <div className="flex items-center rounded-xl border overflow-hidden"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                    <span className="px-3 text-sm" style={{ color: "var(--color-text-muted)" }}>@</span>
                    <input value={form.username}
                      onChange={e => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="zickiie" className="flex-1 bg-transparent py-3 pr-3 text-sm outline-none"
                      style={{ color: "var(--color-text-primary)" }} />
                  </div>
                </Field>
                <Field label="In-Game Name (IGN)" hint="Your gaming alias — might differ from your display name">
                  <input value={form.ign} onChange={e => update("ign", e.target.value)}
                    placeholder="e.g. xX_Zickiie_Xx" className={inputCls} />
                </Field>
                <Field label="Real Name" hint="Optional — only shown if you want">
                  <input value={form.real_name} onChange={e => update("real_name", e.target.value)}
                    placeholder="First name is enough" className={inputCls} />
                </Field>
                <Field label="Avatar URL" hint="Paste any image URL — or leave blank for a letter avatar">
                  <input value={form.avatar_url} onChange={e => update("avatar_url", e.target.value)}
                    placeholder="https://..." className={inputCls} />
                </Field>
                <Field label="Bio" hint={`${form.bio.length}/280`}>
                  <textarea value={form.bio} onChange={e => update("bio", e.target.value)}
                    maxLength={280} rows={2} placeholder="A sentence about you..."
                    className={inputCls + " resize-none"} />
                </Field>
              </div>
            )}

            {/* STEP 1: Birthday */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  When&apos;s your day?
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Your birthday auto-populates the calendar and calculates your Zodiac, Life Path number, and Chinese zodiac — no extra steps needed.
                </p>
                <Field label="Birthday *">
                  <input type="date" value={form.birthday}
                    onChange={e => update("birthday", e.target.value)}
                    className={inputCls}
                    style={{ colorScheme: "dark" }} />
                </Field>
                <Field label="City" hint="City only — no address. Used for event timezone suggestions.">
                  <input value={form.city} onChange={e => update("city", e.target.value)}
                    placeholder="e.g. Manila" className={inputCls} />
                </Field>
              </div>
            )}

            {/* STEP 2: Platforms */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  How do you game?
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Select all platforms you own. This helps filter compatible games in the library.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PLATFORMS.map(p => {
                    const selected = form.platforms.includes(p);
                    return (
                      <button key={p} onClick={() => togglePlatform(p)}
                        className="flex items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all duration-150"
                        style={{
                          borderColor: selected ? "var(--color-cyan)" : "var(--color-border)",
                          backgroundColor: selected ? "color-mix(in srgb, var(--color-cyan) 12%, transparent)" : "transparent",
                          color: selected ? "var(--color-cyan)" : "var(--color-text-secondary)",
                        }}>
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-all",)}
                          style={{
                            borderColor: selected ? "var(--color-cyan)" : "var(--color-border)",
                            backgroundColor: selected ? "var(--color-cyan)" : "transparent",
                          }}>
                          {selected && <Check size={10} color="black" strokeWidth={3} />}
                        </div>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Favorites */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Tell us your favorites
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  These show on your birthday celebration page so The Others know exactly what to get you.
                </p>
                <Field label="Favorite Game">
                  <input value={form.favorite_game} onChange={e => update("favorite_game", e.target.value)}
                    placeholder="e.g. Valorant" className={inputCls} />
                </Field>
                <Field label="Favorite Movie">
                  <input value={form.favorite_movie} onChange={e => update("favorite_movie", e.target.value)}
                    placeholder="e.g. Interstellar" className={inputCls} />
                </Field>
                <Field label="Favorite Food">
                  <input value={form.favorite_food} onChange={e => update("favorite_food", e.target.value)}
                    placeholder="e.g. Ramen" className={inputCls} />
                </Field>
                <Field label="Favorite Music / Artist">
                  <input value={form.favorite_music} onChange={e => update("favorite_music", e.target.value)}
                    placeholder="e.g. Hozier" className={inputCls} />
                </Field>
                <Field label="Favorite Color">
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.favorite_color}
                      onChange={e => update("favorite_color", e.target.value)}
                      className="w-12 h-10 rounded-lg border cursor-pointer"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "transparent" }} />
                    <span className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
                      {form.favorite_color}
                    </span>
                  </div>
                </Field>
              </div>
            )}

            {/* STEP 4: Done */}
            {step === 4 && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: "linear-gradient(135deg, var(--color-purple), var(--color-cyan))" }}>
                    {form.avatar_url
                      ? <img src={form.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      : <span className="text-white font-black text-3xl">
                          {form.display_name?.[0]?.toUpperCase() || "?"}
                        </span>
                    }
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>
                    You&apos;re in, {form.display_name || "friend"}!
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                    @{form.username} · {form.city || "Somewhere in the world"}
                  </p>
                </div>

                {/* Profile preview */}
                <div className="rounded-xl border p-4 text-left space-y-2"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                  {form.ign && <PreviewRow label="IGN" value={form.ign} />}
                  {form.birthday && <PreviewRow label="Birthday" value={form.birthday} />}
                  {form.platforms.length > 0 && <PreviewRow label="Platforms" value={form.platforms.join(", ")} />}
                  {form.favorite_game && <PreviewRow label="Fav Game" value={form.favorite_game} />}
                  {form.favorite_movie && <PreviewRow label="Fav Movie" value={form.favorite_movie} />}
                  {form.favorite_food && <PreviewRow label="Fav Food" value={form.favorite_food} />}
                  {form.favorite_color && (
                    <div className="flex justify-between items-center text-sm">
                      <span style={{ color: "var(--color-text-muted)" }}>Fav Color</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: form.favorite_color }} />
                        <span style={{ color: "var(--color-text-secondary)" }}>{form.favorite_color}</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  You can edit any of this from your profile page anytime.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm rounded-lg px-3 py-2"
                style={{ color: "var(--color-red)", backgroundColor: "color-mix(in srgb, var(--color-red) 10%, transparent)" }}>
                {error}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-8 py-5 border-t"
          style={{ borderColor: "var(--color-border)" }}>
          <button onClick={back} disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-30"
            style={{ color: "var(--color-text-secondary)" }}>
            <ChevronLeft size={16} /> Back
          </button>

          {isLast ? (
            <button onClick={finish} disabled={saving}
              className="flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-60 hover:brightness-110"
              style={{ backgroundColor: "var(--color-purple)", color: "white" }}>
              {saving
                ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                : <><Sparkles size={16} /> Enter The Others</>
              }
            </button>
          ) : (
            <button onClick={next}
              className="flex items-center gap-1.5 text-sm font-bold px-6 py-2.5 rounded-xl transition-all hover:brightness-110"
              style={{ backgroundColor: "var(--color-purple)", color: "white" }}>
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors border focus:border-purple-500/60";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
        {hint && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{hint}</span>}
      </div>
      <style jsx>{`
        input, textarea {
          background-color: var(--color-bg);
          color: var(--color-text-primary);
          border-color: var(--color-border);
        }
        input::placeholder, textarea::placeholder {
          color: var(--color-text-muted);
        }
      `}</style>
      {children}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-secondary)" }}>{value}</span>
    </div>
  );
}
