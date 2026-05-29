"use client";

import { useState } from "react";
import { Search, Loader2, Save, X } from "lucide-react";

interface TargetProfile {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  favorite_game: string | null;
  favorite_movie: string | null;
  favorite_food: string | null;
  favorite_music: string | null;
  favorite_color: string | null;
  steam_id: string | null;
  avatar_url: string | null;
  role: string;
}

const EDITABLE: { key: keyof TargetProfile; label: string; multiline?: boolean }[] = [
  { key: "display_name",  label: "Display Name" },
  { key: "bio",           label: "Bio", multiline: true },
  { key: "favorite_game",  label: "Favorite Game" },
  { key: "favorite_movie", label: "Favorite Movie" },
  { key: "favorite_food",  label: "Favorite Food" },
  { key: "favorite_music", label: "Favorite Music" },
  { key: "favorite_color", label: "Favorite Color" },
  { key: "steam_id",      label: "Steam ID / URL" },
];

export function ProfileOverrideSection() {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<{ id: string; display_name: string; username: string; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget]       = useState<TargetProfile | null>(null);
  const [edits, setEdits]         = useState<Record<string, string | null>>({});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/admin/members`);
    const json = await res.json();
    const q = query.toLowerCase();
    const filtered = (json.members ?? []).filter((m: { display_name: string; username: string }) =>
      m.display_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q)
    ).slice(0, 8);
    setResults(filtered);
    setSearching(false);
  }

  async function selectMember(id: string) {
    setResults([]);
    setEdits({});
    setSaved(false);
    const res = await fetch(`/api/admin/profile-override?id=${id}`);
    const data = await res.json();
    setTarget(data);
  }

  async function save() {
    if (!target || Object.keys(edits).length === 0) return;
    setSaving(true);
    await fetch("/api/admin/profile-override", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: target.id, changes: edits }),
    });
    setTarget(prev => prev ? { ...prev, ...edits as Partial<TargetProfile> } : null);
    setEdits({});
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Search Member</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg border"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <Search size={13} style={{ color: "var(--color-text-muted)" }} />
            <input type="text" value={query}
              onChange={e => { setQuery(e.target.value); setResults([]); }}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Name or @handle…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
              style={{ color: "var(--color-text-primary)" }} />
          </div>
          <button onClick={search} disabled={searching || !query.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
            {searching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {results.map(m => (
              <button key={m.id} onClick={() => selectMember(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-gray-700 shrink-0">
                  {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{m.display_name}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>@{m.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {target && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {target.avatar_url && (
                <img src={target.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
              )}
              <div>
                <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{target.display_name}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>@{target.username} · {target.role}</p>
              </div>
            </div>
            <button onClick={() => { setTarget(null); setEdits({}); }}>
              <X size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {EDITABLE.map(({ key, label, multiline }) => {
              const current = (key in edits ? edits[key as string] : target[key]) as string | null;
              return (
                <div key={key} className={multiline ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                    {label}
                  </label>
                  {multiline ? (
                    <textarea
                      value={current ?? ""}
                      onChange={e => setEdits(prev => ({ ...prev, [key]: e.target.value || null }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none resize-none"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={current ?? ""}
                      onChange={e => setEdits(prev => ({ ...prev, [key]: e.target.value || null }))}
                      className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || Object.keys(edits).length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
            {Object.keys(edits).length > 0 && (
              <button onClick={() => setEdits({})} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Discard
              </button>
            )}
            {saved && (
              <span className="text-xs font-medium" style={{ color: "#1D9E75" }}>
                ✓ Changes saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
