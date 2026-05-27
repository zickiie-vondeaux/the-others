"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const unread = notifications.filter(n => !n.is_read).length;

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data ?? []) as Notification[]);
  };

  useEffect(() => {
    if (!userId) return;
    load();

    const channel = supabase.channel(`notifications-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  };

  const markOne = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(v => !v); if (!open && unread > 0) markAllRead(); }}
        className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        style={{ color: unread > 0 ? "var(--color-purple)" : "var(--color-text-secondary)" }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              maxHeight: 400,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs hover:opacity-70 transition-opacity" style={{ color: "var(--color-purple)" }}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ color: "var(--color-text-muted)" }}>
                  <span className="text-2xl">🔕</span>
                  <p className="text-xs">You're all caught up.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { markOne(n.id); if (n.link) window.location.href = n.link; }}
                    className="w-full flex gap-3 px-4 py-3 text-left hover:opacity-80 transition-all border-b last:border-b-0"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: n.is_read ? "transparent" : "rgba(139,92,246,0.06)",
                    }}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>{n.title}</p>
                      {n.body && <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>{n.body}</p>}
                      <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "var(--color-purple)" }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TYPE_ICON: Record<string, string> = {
  reaction:    "❤️",
  poll_closed: "🏆",
  event_reminder: "📅",
  birthday:    "🎂",
  achievement: "🏅",
};
