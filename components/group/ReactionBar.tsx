"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMOJI_SET = ["❤️","🔥","😂","👏","😱","🎮","🎬","💀"];

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Props {
  activityId: string;
  reactions: { user_id: string; emoji: string }[];
  myUserId: string;
}

export function ReactionBar({ activityId, reactions, myUserId }: Props) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const supabase = createClient();

  const grouped = EMOJI_SET.reduce<Record<string, Reaction>>((acc, e) => {
    const rows = localReactions.filter(r => r.emoji === e);
    if (rows.length > 0) acc[e] = { emoji: e, count: rows.length, reacted: rows.some(r => r.user_id === myUserId) };
    return acc;
  }, {});

  const toggle = async (emoji: string) => {
    setPickerOpen(false);
    const existing = localReactions.find(r => r.user_id === myUserId && r.emoji === emoji);
    if (existing) {
      setLocalReactions(prev => prev.filter(r => !(r.user_id === myUserId && r.emoji === emoji)));
      await supabase.from("reactions").delete().eq("activity_id", activityId).eq("user_id", myUserId).eq("emoji", emoji);
    } else {
      setLocalReactions(prev => [...prev, { user_id: myUserId, emoji }]);
      await supabase.from("reactions").insert({ activity_id: activityId, user_id: myUserId, emoji });
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      {Object.values(grouped).map(r => (
        <button
          key={r.emoji}
          onClick={() => toggle(r.emoji)}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all"
          style={{
            backgroundColor: r.reacted ? "rgba(139,92,246,0.15)" : "var(--color-surface-elevated)",
            border: `1px solid ${r.reacted ? "rgba(139,92,246,0.4)" : "var(--color-border)"}`,
            color: r.reacted ? "var(--color-purple)" : "var(--color-text-muted)",
          }}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setPickerOpen(v => !v)}
          className="text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-80"
          style={{
            backgroundColor: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          +
        </button>
        {pickerOpen && (
          <div
            className="absolute bottom-full mb-1 left-0 flex gap-1 p-1.5 rounded-xl z-10 shadow-lg"
            style={{ backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}
          >
            {EMOJI_SET.map(e => (
              <button key={e} onClick={() => toggle(e)} className="text-base hover:scale-110 transition-transform p-0.5">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
