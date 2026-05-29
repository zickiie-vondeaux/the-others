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

export function MemberCard({ member, onClick }: { member: MemberRow; onClick: () => void }) {
  const [flipping, setFlipping] = useState(false);
  const showBio = (member.privacy_settings?.bio ?? true) && !!member.bio;

  function handleClick() {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => {
      onClick();
      setTimeout(() => setFlipping(false), 50);
    }, 180);
  }

  return (
    <motion.button
      onClick={handleClick}
      animate={flipping ? { rotateY: 90, scale: 0.92 } : { rotateY: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeIn" }}
      style={{
        transformOrigin: "center",
        perspective: 800,
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
      className="w-full text-left rounded-2xl border overflow-hidden group cursor-pointer"
      whileHover={!flipping ? { y: -3, boxShadow: "0 8px 24px rgba(139,92,246,0.2)" } : {}}
    >
      {/* Full-width avatar area — fixed aspect ratio */}
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio: "4/3", background: ROLE_GRADIENT[member.role] }}
      >
        {member.avatar_url && (
          <img
            src={member.avatar_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {!member.avatar_url && (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-black" style={{ color: "rgba(255,255,255,0.25)" }}>
              {member.display_name[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info — fixed height so all cards are uniform */}
      <div className="p-3 h-[88px] flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
            {member.display_name}
          </p>
          <RoleBadge role={member.role} size="xs" />
        </div>
        <p className="text-xs leading-relaxed line-clamp-2 mt-1" style={{ color: "var(--color-text-muted)" }}>
          {showBio ? member.bio : `@${member.username}`}
        </p>
      </div>
    </motion.button>
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
