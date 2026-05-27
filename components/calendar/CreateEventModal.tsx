"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { EVENT_META, type EventType, toDateKey } from "@/lib/calendar/utils";
import { X } from "lucide-react";

interface Props {
  initialDate: Date | null;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}

const EVENT_TYPES = Object.entries(EVENT_META).filter(([k]) => k !== "birthday") as [EventType, typeof EVENT_META[EventType]][];

export function CreateEventModal({ initialDate, userId, onClose, onCreated }: Props) {
  const dateStr = initialDate ? toDateKey(initialDate) : toDateKey(new Date());

  const [form, setForm] = useState({
    title: "",
    type: "game_night" as EventType,
    date: dateStr,
    time: "20:00",
    description: "",
    location_or_link: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const start_at = new Date(`${form.date}T${form.time}:00`).toISOString();

    const { error: err } = await supabase.from("events").insert({
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim() || null,
      location_or_link: form.location_or_link.trim() || null,
      start_at,
      created_by: userId,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated();
    onClose();
  }

  const selectedMeta = EVENT_META[form.type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md rounded-2xl border p-6 z-10"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>New Event</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Title *
              </label>
              <input value={form.title} onChange={e => update("title", e.target.value)}
                placeholder="e.g. Lethal Company Night"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border focus:border-purple-500/60"
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map(([type, meta]) => (
                  <button key={type} onClick={() => update("type", type)}
                    className="flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-all"
                    style={{
                      borderColor: form.type === type ? meta.color : "var(--color-border)",
                      backgroundColor: form.type === type ? meta.bg : "transparent",
                      color: form.type === type ? meta.color : "var(--color-text-muted)",
                    }}>
                    <span>{meta.emoji}</span> {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Date</label>
                <input type="date" value={form.date} onChange={e => update("date", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border focus:border-purple-500/60"
                  style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)", colorScheme: "dark" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Time</label>
                <input type="time" value={form.time} onChange={e => update("time", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border focus:border-purple-500/60"
                  style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)", colorScheme: "dark" }} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Description
              </label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)}
                rows={2} placeholder="What's happening?"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border resize-none focus:border-purple-500/60"
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }} />
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Link <span style={{ color: "var(--color-text-muted)" }}>(Discord, Zoom, etc.)</span>
              </label>
              <input value={form.location_or_link} onChange={e => update("location_or_link", e.target.value)}
                placeholder="https://discord.gg/..."
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border focus:border-purple-500/60"
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg"
                style={{ color: "var(--color-red)", backgroundColor: "color-mix(in srgb, var(--color-red) 10%, transparent)" }}>
                {error}
              </p>
            )}

            <button onClick={submit} disabled={saving}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: selectedMeta.color, color: form.type === "birthday" ? "black" : "white" }}>
              {saving ? "Creating..." : `Create ${selectedMeta.emoji} ${selectedMeta.label}`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
