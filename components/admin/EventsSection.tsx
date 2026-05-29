"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Calendar, MapPin, Link as LinkIcon, Clock } from "lucide-react";

interface AdminEvent {
  id: string;
  title: string;
  type: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  created_by: string;
  profiles?: { display_name: string; username: string } | null;
}

const EVENT_TYPES = [
  "game_night", "movie_night", "meetup", "online", "milestone", "other",
];

const TYPE_COLORS: Record<string, string> = {
  game_night:  "#7F77DD",
  movie_night: "#D4537E",
  meetup:      "#1D9E75",
  online:      "#BA7517",
  milestone:   "#06b6d4",
  other:       "#888780",
};

function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventsSection() {
  const [events, setEvents]     = useState<AdminEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Partial<AdminEvent> | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setIsNew(true);
    setEditing({ type: "game_night", title: "", start_at: "" });
  }

  function openEdit(e: AdminEvent) {
    setIsNew(false);
    setEditing({ ...e });
  }

  async function save() {
    if (!editing?.title || !editing.start_at) return;
    setSaving(true);
    if (isNew) {
      await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    } else {
      await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    }
    await load();
    setEditing(null);
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    setDeleting(id);
    await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.start_at) >= now);
  const past     = events.filter(e => new Date(e.start_at) < now);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {events.length} event{events.length !== 1 ? "s" : ""} total
        </p>
        <button onClick={openNew}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
          <Plus size={14} /> New Event
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div className="rounded-xl border p-4 space-y-3"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "rgba(127,119,221,0.4)" }}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
              {isNew ? "New Event" : "Edit Event"}
            </p>
            <button onClick={() => setEditing(null)}>
              <X size={14} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Title *</label>
              <input type="text" value={editing.title ?? ""} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Type</label>
              <select value={editing.type ?? "other"} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Date & Time *</label>
              <input type="datetime-local"
                value={editing.start_at ? toLocalInputValue(editing.start_at) : ""}
                onChange={e => setEditing(p => ({ ...p, start_at: new Date(e.target.value).toISOString() }))}
                className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>End Time</label>
              <input type="datetime-local"
                value={editing.end_at ? toLocalInputValue(editing.end_at) : ""}
                onChange={e => setEditing(p => ({ ...p, end_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Location / Link</label>
              <input type="text" value={editing.location ?? ""}
                onChange={e => setEditing(p => ({ ...p, location: e.target.value || null }))}
                placeholder="Address or URL"
                className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Description</label>
              <textarea value={editing.description ?? ""} rows={3}
                onChange={e => setEditing(p => ({ ...p, description: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-xl border bg-transparent text-sm outline-none resize-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving || !editing.title || !editing.start_at}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isNew ? "Create Event" : "Save Changes"}
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm"
              style={{ color: "var(--color-text-muted)" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} /></div>
      ) : (
        <div className="space-y-5 overflow-y-auto" style={{ maxHeight: "480px" }}>
          {upcoming.length > 0 && (
            <EventGroup label="Upcoming" events={upcoming} onEdit={openEdit} onDelete={deleteEvent} deleting={deleting} />
          )}
          {past.length > 0 && (
            <EventGroup label="Past" events={past} onEdit={openEdit} onDelete={deleteEvent} deleting={deleting} faded />
          )}
          {events.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: "var(--color-text-muted)" }}>No events yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EventGroup({ label, events, onEdit, onDelete, deleting, faded }: {
  label: string;
  events: AdminEvent[];
  onEdit: (e: AdminEvent) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
  faded?: boolean;
}) {
  return (
    <div style={{ opacity: faded ? 0.7 : 1 }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
        {label} ({events.length})
      </p>
      <div className="space-y-2">
        {events.map(e => (
          <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="w-2 h-2 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: TYPE_COLORS[e.type] ?? "#888780" }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{e.title}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <Calendar size={11} />
                  {new Date(e.start_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
                {e.end_at && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <Clock size={11} />
                    ends {new Date(e.end_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </span>
                )}
                {e.location && (
                  <span className="flex items-center gap-1 text-xs truncate max-w-[180px]" style={{ color: "var(--color-text-muted)" }}>
                    {e.location.startsWith("http") ? <LinkIcon size={11} /> : <MapPin size={11} />}
                    {e.location}
                  </span>
                )}
              </div>
              {e.description && (
                <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--color-text-muted)" }}>{e.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(e)} className="p-1.5 rounded-lg hover:bg-white/10" title="Edit">
                <Pencil size={13} style={{ color: "var(--color-text-muted)" }} />
              </button>
              <button onClick={() => onDelete(e.id)} disabled={deleting === e.id}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors" title="Delete">
                {deleting === e.id ? <Loader2 size={13} className="animate-spin" style={{ color: "#D4537E" }} />
                  : <Trash2 size={13} style={{ color: "#D4537E" }} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
