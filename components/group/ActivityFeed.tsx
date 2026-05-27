"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_ICONS, ACTIVITY_LABELS, type ActivityEntryWithProfile } from "@/lib/activity";
import { ReactionBar } from "./ReactionBar";

interface Reaction { user_id: string; emoji: string; activity_id: string; }

interface Props {
  initial: ActivityEntryWithProfile[];
  allReactions: Reaction[];
  myUserId: string;
}

function parseLabel(template: string) {
  return template.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**")
      ? <strong key={i} style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export function ActivityFeed({ initial, allReactions, myUserId }: Props) {
  const [items, setItems] = useState<ActivityEntryWithProfile[]>(initial);
  const [reactions, setReactions] = useState<Reaction[]>(allReactions);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel("activity-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "activity_feed",
      }, async (payload) => {
        // Fetch profile for the new item
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,username")
          .eq("id", (payload.new as any).user_id)
          .single();
        if (!profile) return;
        const newItem: ActivityEntryWithProfile = { ...(payload.new as any), profile };
        setItems(prev => [newItem, ...prev.slice(0, 49)]);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reactions",
      }, (payload) => {
        setReactions(prev => [...prev, payload.new as Reaction]);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "reactions",
      }, (payload) => {
        setReactions(prev => prev.filter(r =>
          !(r.user_id === (payload.old as any).user_id &&
            r.activity_id === (payload.old as any).activity_id &&
            r.emoji === (payload.old as any).emoji)
        ));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [supabase]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "var(--color-text-muted)" }}>
        <span className="text-3xl">🌑</span>
        <p className="text-sm">No activity yet. Go play something.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <AnimatePresence initial={false}>
        {items.map((item, idx) => {
          const itemReactions = reactions.filter(r => r.activity_id === item.id);
          const labelFn = ACTIVITY_LABELS[item.type];
          const label = labelFn ? labelFn(item.entity_title, item.metadata as any) : item.type;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex gap-3 py-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 pt-0.5">
                {item.profile.avatar_url
                  ? <img src={item.profile.avatar_url} alt={item.profile.display_name} className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-purple)" }}>
                      {item.profile.display_name[0]?.toUpperCase()}
                    </div>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>{item.profile.display_name}</strong>
                  {" "}{parseLabel(label)}
                  <span className="ml-1">{ACTIVITY_ICONS[item.type]}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
                <ReactionBar activityId={item.id} reactions={itemReactions} myUserId={myUserId} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
