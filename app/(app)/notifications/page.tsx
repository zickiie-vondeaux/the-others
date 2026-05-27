"use client";

import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Check } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  reaction:       "❤️",
  poll_closed:    "🏆",
  event_reminder: "📅",
  birthday:       "🎂",
  achievement:    "🏅",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);

    // Mark all as read
    if ((data ?? []).some((n: any) => !n.is_read)) {
      await supabase.from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <TopBar title="Notifications" />
      <div className="flex-1 overflow-y-auto">
        <div className="px-[8%] py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Notifications</h1>
            {unread > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "var(--color-purple)" }}>
                {unread} new
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: "var(--color-text-muted)" }}>Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--color-text-muted)" }}>
              <span className="text-4xl">🔕</span>
              <p className="text-sm">You're all caught up.</p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden divide-y"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderColor: "var(--color-border)" }}
            >
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="flex gap-4 px-5 py-4"
                  style={{ backgroundColor: n.is_read ? "transparent" : "rgba(139,92,246,0.04)" }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{n.title}</p>
                    {n.body && <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{n.body}</p>}
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {n.is_read && <Check size={14} className="flex-shrink-0 mt-1" style={{ color: "var(--color-text-muted)" }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
