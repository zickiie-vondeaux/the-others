"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { BirthdayMessageWall } from "./BirthdayMessageWall";
import { getSurpriseSeenKey } from "@/lib/birthday";
import type { Profile } from "@/lib/supabase/types";

interface Props {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url">;
}

export function BirthdaySurpriseScreen({ profile }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const key = getSurpriseSeenKey(profile.id);
    if (localStorage.getItem(key)) return;
    setVisible(true);
  }, [profile.id]);

  useEffect(() => {
    if (!visible || firedRef.current) return;
    firedRef.current = true;

    const fire = (angle: number, origin: { x: number; y: number }) => {
      confetti({
        particleCount: 60,
        spread: 55,
        angle,
        origin,
        colors: ["#8b5cf6", "#06b6d4", "#fbbf24", "#f472b6", "#10b981"],
        scalar: 1.2,
      });
    };

    setTimeout(() => fire(60, { x: 0, y: 0.65 }), 100);
    setTimeout(() => fire(120, { x: 1, y: 0.65 }), 250);
    setTimeout(() => fire(90, { x: 0.5, y: 0.5 }), 500);
    setTimeout(() => fire(60, { x: 0.1, y: 0.7 }), 750);
    setTimeout(() => fire(120, { x: 0.9, y: 0.7 }), 900);
  }, [visible]);

  const dismiss = () => {
    localStorage.setItem(getSurpriseSeenKey(profile.id), "1");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(251,191,36,0.4)",
              boxShadow: "0 0 60px rgba(251,191,36,0.15), 0 0 120px rgba(139,92,246,0.1)",
            }}
          >
            {/* Gold glow top */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.12), transparent 60%)" }} />

            <div className="relative flex flex-col items-center gap-6 p-8 text-center">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.3 }}
                className="relative"
              >
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.display_name}
                      className="w-24 h-24 rounded-full object-cover"
                      style={{ border: "3px solid var(--color-gold)", boxShadow: "0 0 24px rgba(251,191,36,0.4)" }} />
                  : <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black"
                      style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "var(--color-gold)", border: "3px solid var(--color-gold)" }}>
                      {profile.display_name[0]?.toUpperCase()}
                    </div>}
                <span className="absolute -bottom-1 -right-1 text-2xl">🎂</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-2"
              >
                <h1 className="text-3xl font-black" style={{ color: "var(--color-gold)" }}>
                  Happy Birthday!
                </h1>
                <p className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {profile.display_name}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  The others wanted you to see this 🥂
                </p>
              </motion.div>

              {/* Message wall */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-full rounded-xl p-4"
                style={{ backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}
              >
                <BirthdayMessageWall
                  forUserId={profile.id}
                  forUserName={profile.display_name}
                  myUserId={profile.id}
                />
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={dismiss}
                className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--color-gold)", color: "#000" }}
              >
                Thanks 🎉
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
