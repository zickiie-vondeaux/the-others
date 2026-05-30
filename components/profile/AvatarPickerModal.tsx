"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mbtiSrc, enneagramSrc, zodiacSrc } from "@/lib/personality/icons";
import { X, Upload, RotateCcw, Loader2 } from "lucide-react";
import type { PersonalityResult } from "@/lib/supabase/types";

interface ZodiacResult { sign: string }

interface Props {
  userId: string;
  displayName: string;
  favoriteColor?: string | null;
  personalityResults: PersonalityResult[];
  zodiac: ZodiacResult | null;
  onClose: () => void;
  onSaved: (url: string | null) => void;
}

export function AvatarPickerModal({ userId, displayName, favoriteColor, personalityResults, zodiac, onClose, onSaved }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const latestBySlug = new Map<string, PersonalityResult>();
  personalityResults.forEach(r => {
    const existing = latestBySlug.get(r.test_slug);
    if (!existing || r.taken_at > existing.taken_at) latestBySlug.set(r.test_slug, r);
  });

  const mbti      = latestBySlug.get("mbti");
  const enneagram = latestBySlug.get("enneagram");

  const iconOptions = [
    mbti && {
      key: "mbti",
      label: mbti.result_code,
      sublabel: mbti.result_label ?? "MBTI",
      src: mbtiSrc(mbti.result_code),
    },
    enneagram && {
      key: "enneagram",
      label: `Type ${enneagram.result_code}`,
      sublabel: enneagram.result_label ?? "Enneagram",
      src: enneagramSrc(enneagram.result_code),
    },
    zodiac && {
      key: "zodiac",
      label: zodiac.sign,
      sublabel: "Zodiac",
      src: zodiacSrc(zodiac.sign),
    },
  ].filter(Boolean) as { key: string; label: string; sublabel: string; src: string | null }[];

  async function selectIcon(src: string) {
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update({ avatar_url: src }).eq("id", userId);
    if (err) { setError(err.message); return; }
    onSaved(src);
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError("");
    const supabase = createClient();
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(userId, file, { upsert: true, contentType: file.type });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(userId);
    // Bust cache so the browser re-fetches the new image
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", userId);
    if (dbErr) { setError(dbErr.message); setUploading(false); return; }
    setUploading(false);
    onSaved(urlWithBust);
  }

  async function resetAvatar() {
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (err) { setError(err.message); return; }
    onSaved(null);
  }

  const initial = displayName[0]?.toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border p-6 w-full max-w-sm space-y-5"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.45)" }}>
            Choose Avatar
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Personality icon options */}
        {iconOptions.length > 0 && (
          <div>
            <p className="text-xs mb-3 font-medium" style={{ color: "var(--color-text-muted)" }}>Your personality icons</p>
            <div className={`grid gap-3 ${iconOptions.length === 1 ? "grid-cols-1" : iconOptions.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {iconOptions.map(opt => opt.src && (
                <button
                  key={opt.key}
                  onClick={() => selectIcon(opt.src!)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:border-purple-500/60 active:scale-95"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                >
                  <img src={opt.src} alt={opt.label} className="w-12 h-12 object-contain"
                    style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }} />
                  <span className="text-xs font-bold leading-tight text-center" style={{ color: "var(--color-text-primary)" }}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] leading-tight text-center" style={{ color: "var(--color-text-muted)" }}>
                    {opt.sublabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload */}
        <div>
          <p className="text-xs mb-3 font-medium" style={{ color: "var(--color-text-muted)" }}>Upload a photo</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all hover:border-cyan-500/60 disabled:opacity-50"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading…" : "Choose from device"}
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={resetAvatar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-all hover:bg-white/5"
          style={{ color: "var(--color-text-muted)" }}
        >
          <RotateCcw size={12} /> Reset to initial ({initial})
        </button>

        {error && (
          <p className="text-xs" style={{ color: "var(--color-red)" }}>{error}</p>
        )}
      </div>
    </div>
  );
}
