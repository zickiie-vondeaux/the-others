"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";
import { formatBirthdayDate } from "@/lib/birthday";

interface Props {
  celebrants: Pick<Profile, "id" | "display_name" | "avatar_url" | "birthday">[];
  onClickCelebrant: (userId: string) => void;
}

export function BirthdayBanner({ celebrants, onClickCelebrant }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || celebrants.length === 0) return null;

  const names = celebrants.map(c => c.display_name);
  const nameStr =
    names.length === 1 ? names[0]
    : names.length === 2 ? `${names[0]} and ${names[1]}`
    : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

  return (
    <div
      className="relative flex items-center gap-3 px-5 py-3 rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(139,92,246,0.15) 100%)",
        border: "1px solid rgba(251,191,36,0.3)",
      }}
    >
      {/* Shimmer */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)", animation: "shimmer 3s infinite" }} />

      <div className="flex -space-x-2 flex-shrink-0">
        {celebrants.slice(0, 3).map(c => (
          c.avatar_url
            ? <img key={c.id} src={c.avatar_url} alt={c.display_name}
                className="w-8 h-8 rounded-full border-2 object-cover cursor-pointer hover:scale-110 transition-transform"
                style={{ borderColor: "var(--color-gold)" }}
                onClick={() => onClickCelebrant(c.id)} />
            : <div key={c.id}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ borderColor: "var(--color-gold)", backgroundColor: "rgba(251,191,36,0.2)", color: "var(--color-gold)" }}
                onClick={() => onClickCelebrant(c.id)}>
                {c.display_name[0]?.toUpperCase()}
              </div>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          🎂 Happy Birthday, {nameStr}!
        </p>
        {celebrants[0]?.birthday && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {formatBirthdayDate(celebrants[0].birthday)}
            {celebrants.length === 1 ? " — leave them a message!" : ""}
          </p>
        )}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:opacity-60 transition-opacity flex-shrink-0"
        style={{ color: "var(--color-text-muted)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
