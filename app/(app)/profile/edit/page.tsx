"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";
import { PLATFORMS } from "@/lib/supabase/types";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export default function EditProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    display_name: "", username: "", ign: "", real_name: "",
    avatar_url: "", bio: "", birthday: "", city: "",
    favorite_game: "", favorite_movie: "", favorite_food: "",
    favorite_color: "#7c3aed", favorite_music: "", platforms: [] as string[],
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setForm({
        display_name: data.display_name ?? "",
        username: data.username ?? "",
        ign: data.ign ?? "",
        real_name: data.real_name ?? "",
        avatar_url: data.avatar_url ?? "",
        bio: data.bio ?? "",
        birthday: data.birthday ?? "",
        city: data.city ?? "",
        favorite_game: data.favorite_game ?? "",
        favorite_movie: data.favorite_movie ?? "",
        favorite_food: data.favorite_food ?? "",
        favorite_color: data.favorite_color ?? "#7c3aed",
        favorite_music: data.favorite_music ?? "",
        platforms: data.platforms ?? [],
      });
    });
  }, []);

  function update(field: string, value: string | string[]) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function togglePlatform(p: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("profiles").update(form).eq("id", user.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); router.push("/profile"); }, 1200);
  }

  return (
    <>
      <TopBar title="Edit Profile" />
      <div className="flex-1 py-6 px-[8%]">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/profile" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-text-muted)" }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Edit Profile</h1>
          </div>

          <div className="space-y-6">
            <Card title="Identity">
              <Field label="Display Name *">
                <Input value={form.display_name} onChange={v => update("display_name", v)} placeholder="e.g. Zickiie" />
              </Field>
              <Field label="Username *">
                <div className="flex items-center rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                  <span className="px-3 text-sm" style={{ color: "var(--color-text-muted)" }}>@</span>
                  <input value={form.username}
                    onChange={e => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="flex-1 bg-transparent py-3 pr-3 text-sm outline-none"
                    style={{ color: "var(--color-text-primary)" }} />
                </div>
              </Field>
              <Field label="IGN">
                <Input value={form.ign} onChange={v => update("ign", v)} placeholder="In-game name" />
              </Field>
              <Field label="Real Name">
                <Input value={form.real_name} onChange={v => update("real_name", v)} placeholder="Optional" />
              </Field>
              <Field label="Avatar URL">
                <Input value={form.avatar_url} onChange={v => update("avatar_url", v)} placeholder="https://..." />
              </Field>
              <Field label={`Bio (${form.bio.length}/280)`}>
                <textarea value={form.bio} onChange={e => update("bio", e.target.value)} maxLength={280} rows={2}
                  placeholder="A sentence about you..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border focus:border-purple-500/60"
                  style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }} />
              </Field>
            </Card>

            <Card title="Birthday & Location">
              <Field label="Birthday">
                <input type="date" value={form.birthday} onChange={e => update("birthday", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border focus:border-purple-500/60"
                  style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)", colorScheme: "dark" }} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={v => update("city", v)} placeholder="e.g. Manila" />
              </Field>
            </Card>

            <Card title="Gaming Platforms">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PLATFORMS.map(p => {
                  const selected = form.platforms.includes(p);
                  return (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className="flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        borderColor: selected ? "var(--color-cyan)" : "var(--color-border)",
                        backgroundColor: selected ? "color-mix(in srgb, var(--color-cyan) 12%, transparent)" : "transparent",
                        color: selected ? "var(--color-cyan)" : "var(--color-text-secondary)",
                      }}>
                      <div className="w-4 h-4 rounded border flex items-center justify-center"
                        style={{ borderColor: selected ? "var(--color-cyan)" : "var(--color-border)", backgroundColor: selected ? "var(--color-cyan)" : "transparent" }}>
                        {selected && <Check size={10} color="black" strokeWidth={3} />}
                      </div>
                      {p}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card title="Favorites">
              <Field label="Game"><Input value={form.favorite_game} onChange={v => update("favorite_game", v)} placeholder="e.g. Valorant" /></Field>
              <Field label="Movie"><Input value={form.favorite_movie} onChange={v => update("favorite_movie", v)} placeholder="e.g. Interstellar" /></Field>
              <Field label="Food"><Input value={form.favorite_food} onChange={v => update("favorite_food", v)} placeholder="e.g. Ramen" /></Field>
              <Field label="Music / Artist"><Input value={form.favorite_music} onChange={v => update("favorite_music", v)} placeholder="e.g. Hozier" /></Field>
              <Field label="Favorite Color">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.favorite_color} onChange={e => update("favorite_color", e.target.value)}
                    className="w-12 h-10 rounded-lg border cursor-pointer"
                    style={{ borderColor: "var(--color-border)" }} />
                  <span className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>{form.favorite_color}</span>
                </div>
              </Field>
            </Card>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2"
                style={{ color: "var(--color-red)", backgroundColor: "color-mix(in srgb, var(--color-red) 10%, transparent)" }}>
                {error}
              </p>
            )}

            <button onClick={save} disabled={saving || saved}
              className={cn("w-full py-3 rounded-xl font-bold text-sm transition-all", saved ? "opacity-80" : "hover:brightness-110")}
              style={{ backgroundColor: saved ? "var(--color-green)" : "var(--color-purple)", color: "white" }}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 space-y-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.45)" }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none border focus:border-purple-500/60"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }} />
  );
}
