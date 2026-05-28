"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";

interface MemberRow {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMembers((data ?? []) as MemberRow[]);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TopBar title="Members" />
      <div className="flex-1 overflow-y-auto">
        <div className="px-[8%] py-6 flex flex-col gap-6">
          <div>
            <h1 className="neon-heading text-4xl font-black mb-1 uppercase tracking-widest">
              Members
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Everyone in The Others.
            </p>
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center py-12 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Loading…
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className="cyber-card flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "var(--color-surface)" }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        backgroundColor: "var(--color-surface-elevated)",
                        color: "var(--color-purple)",
                      }}
                    >
                      {member.display_name[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {member.display_name}
                    </p>
                    {member.username && (
                      <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                        @{member.username}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                      Joined
                    </p>
                    <p className="text-xs font-medium" style={{ color: "var(--color-cyan)" }}>
                      {new Date(member.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
