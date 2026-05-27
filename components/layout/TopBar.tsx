"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/group/NotificationBell";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [userId, setUserId] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b lg:hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {userId && <NotificationBell userId={userId} />}
        <Link href="/profile" aria-label="My profile" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}>
          <User size={18} />
        </Link>
      </div>
    </header>
  );
}
