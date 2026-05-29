"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Plus, X, Check, Loader2 } from "lucide-react";
import type { Role } from "@/lib/roles";

interface InviteCode {
  id: string;
  code: string;
  status: "active" | "used" | "revoked";
  generated_at: string;
  used_at: string | null;
  generated_by: string;
  generator?: { display_name: string; username: string; role: string } | null;
  user?: { display_name: string; username: string } | null;
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  active:  { color: "#1D9E75", bg: "rgba(29,158,117,0.15)", label: "Active"  },
  used:    { color: "#888780", bg: "rgba(136,135,128,0.15)", label: "Used"   },
  revoked: { color: "#ec4899", bg: "rgba(236,72,153,0.15)", label: "Revoked" },
};

export function InvitesSection({ myRole }: { myRole: Role }) {
  const [codes, setCodes]       = useState<InviteCode[]>([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode]   = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invites");
    const data = await res.json();
    setCodes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setGenerating(true);
    setNewCode(null);
    const res = await fetch("/api/invites", { method: "POST" });
    const data = await res.json();
    if (data.code) {
      setNewCode(data.code);
      await load();
    }
    setGenerating(false);
  }

  async function revoke(id: string) {
    setRevoking(id);
    await fetch("/api/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
    setRevoking(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Invite Codes</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {myRole === "chaos" ? "All codes from all members" : "Your codes and wanderer-generated codes"}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Generate Code
        </button>
      </div>

      {newCode && (
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ backgroundColor: "rgba(29,158,117,0.1)", borderColor: "rgba(29,158,117,0.3)" }}>
          <Check size={16} style={{ color: "#1D9E75", flexShrink: 0 }} />
          <span className="font-mono font-bold tracking-widest text-lg flex-1" style={{ color: "#1D9E75" }}>
            {newCode}
          </span>
          <button onClick={() => copyCode(newCode)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: "rgba(29,158,117,0.2)", color: "#1D9E75" }}>
            {copied === newCode ? <Check size={12} /> : <Copy size={12} />}
            {copied === newCode ? "Copied!" : "Copy"}
          </button>
          <button onClick={() => setNewCode(null)}><X size={14} style={{ color: "var(--color-text-muted)" }} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
        </div>
      ) : codes.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No invite codes yet.</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "480px" }}>
          {codes.map(c => {
            const s = STATUS_STYLE[c.status];
            return (
              <div key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <span className="font-mono font-bold tracking-widest text-sm w-24 shrink-0"
                  style={{ color: c.status === "active" ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  {c.code}
                </span>

                <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ backgroundColor: s.bg, color: s.color }}>
                  {s.label}
                </span>

                <div className="flex-1 min-w-0">
                  {c.generator && (
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      By {c.generator.display_name} ({c.generator.role})
                      · {new Date(c.generated_at).toLocaleDateString()}
                    </p>
                  )}
                  {c.status === "used" && c.user && (
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      Used by {c.user.display_name} {c.used_at ? `· ${new Date(c.used_at).toLocaleDateString()}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.status === "active" && (
                    <button onClick={() => copyCode(c.code)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                      title="Copy code">
                      {copied === c.code ? <Check size={13} style={{ color: "#1D9E75" }} /> : <Copy size={13} style={{ color: "var(--color-text-muted)" }} />}
                    </button>
                  )}
                  {c.status === "active" && (
                    <button
                      onClick={() => revoke(c.id)}
                      disabled={revoking === c.id}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: "rgba(236,72,153,0.15)", color: "#ec4899" }}
                    >
                      {revoking === c.id ? <Loader2 size={11} className="animate-spin" /> : "Revoke"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
