"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import type { BirthdayMessage } from "@/lib/birthday";
import type { Profile } from "@/lib/supabase/types";

interface Props {
  forUserId: string;
  forUserName: string;
  myUserId: string;
  onClose?: () => void;
}

export function BirthdayMessageWall({ forUserId, forUserName, myUserId, onClose }: Props) {
  const [messages, setMessages] = useState<BirthdayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const year = new Date().getFullYear();
  const isSelf = forUserId === myUserId;
  const alreadyWrote = messages.some(m => m.from_user_id === myUserId);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("birthday_messages")
      .select("*, from_profile:profiles!birthday_messages_from_user_id_fkey(id,display_name,avatar_url)")
      .eq("for_user_id", forUserId)
      .eq("year", year)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as BirthdayMessage[]);
  }, [supabase, forUserId, year]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    setError("");
    const { error: err } = await supabase.from("birthday_messages").insert({
      for_user_id: forUserId,
      from_user_id: myUserId,
      message: draft.trim(),
      year,
    });
    setSending(false);
    if (err) { setError(err.message); return; }
    setDraft("");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      {onClose && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            🎂 Birthday messages for {forUserName}
          </h3>
          <button onClick={onClose} className="p-1 hover:opacity-60 transition-opacity" style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--color-text-muted)" }}>
            No messages yet — be the first to wish {forUserName} a happy birthday!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(m => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                {(m.from_profile as any)?.avatar_url
                  ? <img src={(m.from_profile as any).avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-purple)" }}>
                      {((m.from_profile as any)?.display_name?.[0] ?? "?").toUpperCase()}
                    </div>}
                <div
                  className="flex-1 rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}
                >
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-purple)" }}>
                    {(m.from_profile as any)?.display_name ?? "Someone"}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{m.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Compose */}
      {!isSelf && !alreadyWrote && (
        <div className="flex flex-col gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, 500))}
            placeholder={`Say something to ${forUserName}…`}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{draft.length}/500</span>
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg font-medium disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
          {error && <p className="text-xs" style={{ color: "var(--color-red)" }}>{error}</p>}
        </div>
      )}

      {alreadyWrote && !isSelf && (
        <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
          ✓ You already left a message this year.
        </p>
      )}
    </div>
  );
}
