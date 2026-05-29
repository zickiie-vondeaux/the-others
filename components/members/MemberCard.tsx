"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RoleBadge } from "./RoleBadge";
import type { Role } from "@/lib/roles";
import type { PrivacySettings } from "@/lib/supabase/types";

export interface MemberRow {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  last_active_at: string;
  role: Role;
  favorite_game: string | null;
  favorite_movie: string | null;
  favorite_food: string | null;
  favorite_music: string | null;
  favorite_color: string | null;
  platforms: string[];
  steam_id: string | null;
  privacy_settings: PrivacySettings | null;
}

const ROLE_GRADIENT: Record<Role, string> = {
  origin:   "linear-gradient(135deg, #7F77DD, #5b54c2)",
  watcher:  "linear-gradient(135deg, #1D9E75, #14735a)",
  ascended: "linear-gradient(135deg, #D4537E, #a83d60)",
  wanderer: "linear-gradient(135deg, #BA7517, #8a5510)",
  unnamed:  "linear-gradient(135deg, #334155, #1e293b)",
};

const ROLE_FLIP_COLOR: Record<Role, string> = {
  origin:   "#7F77DD",
  watcher:  "#1D9E75",
  ascended: "#D4537E",
  wanderer: "#BA7517",
  unnamed:  "#334155",
};

export function MemberCard({ member, onClick }: { member: MemberRow; onClick: () => void }) {
  const [flipping, setFlipping] = useState(false);
  const showBio = (member.privacy_settings?.bio ?? true) && !!member.bio;

  function handleClick() {
    if (flipping) return;
    setFlipping(true);
    // open modal exactly when the flip completes
    setTimeout(() => {
      onClick();
      setTimeout(() => setFlipping(false), 60);
    }, 400);
  }

  return (
    <div
      className="w-full cursor-pointer"
      style={{ perspective: "900px" }}
      onClick={handleClick}
    >
      <motion.div
        animate={{ rotateY: flipping ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        whileHover={!flipping ? { y: -3 } : {}}
        style={{ transformStyle: "preserve-3d", position: "relative" }}
      >
        {/* ── FRONT ── */}
        <div
          className="w-full rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Square avatar area */}
          <div
            className="w-full relative overflow-hidden"
            style={{ aspectRatio: "1 / 1", background: ROLE_GRADIENT[member.role] }}
          >
            {member.avatar_url && (
              <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
            )}
            {!member.avatar_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-black select-none"
                  style={{ fontSize: "clamp(5rem, 30%, 9rem)", color: "rgba(255,255,255,0.2)", lineHeight: 1 }}
                >
                  {member.display_name[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Fixed-height info bar */}
          <div className="px-3 py-2.5 h-[72px] flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                {member.display_name}
              </p>
              <RoleBadge role={member.role} size="xs" />
            </div>
            <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
              {showBio ? member.bio : `@${member.username}`}
            </p>
          </div>
        </div>

        {/* ── BACK — role color ── */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{
            background: ROLE_GRADIENT[member.role],
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span
            className="font-black select-none"
            style={{ fontSize: "clamp(5rem, 30%, 9rem)", color: "rgba(255,255,255,0.22)", lineHeight: 1 }}
          >
            {member.display_name[0]?.toUpperCase()}
          </span>
          <div className="text-center px-3">
            <p className="font-bold text-sm text-white/80 truncate">{member.display_name}</p>
            <div className="mt-1 flex justify-center">
              <RoleBadge role={member.role} size="xs" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function MemberListRow({ member, onClick }: { member: MemberRow; onClick: () => void }) {
  const showBio = (member.privacy_settings?.bio ?? true) && !!member.bio;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:bg-white/5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
        style={{ background: ROLE_GRADIENT[member.role] }}
      >
        {member.avatar_url
          ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg font-black" style={{ color: "rgba(255,255,255,0.3)" }}>
                {member.display_name[0]?.toUpperCase()}
              </span>
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
            {member.display_name}
          </span>
          <RoleBadge role={member.role} size="xs" />
        </div>
        {showBio && (
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {member.bio}
          </p>
        )}
      </div>
    </button>
  );
}
