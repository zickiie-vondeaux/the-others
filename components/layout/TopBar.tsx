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
      className="flex items-center justify-between px-6 py-4 lg:hidden"
      style={{
        backgroundColor: "#08081a",
        borderBottom: "1px solid rgba(0, 255, 234, 0.15)",
        boxShadow: "0 2px 16px rgba(0, 255, 234, 0.05)",
      }}
    >
      <h1
        className="text-base font-black uppercase tracking-widest"
        style={{ color: "#00ffea", textShadow: "0 0 12px rgba(0, 255, 234, 0.5)" }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {userId && <NotificationBell userId={userId} />}
        <Link
          href="/profile"
          aria-label="My profile"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(0, 255, 234, 0.5)" }}
        >
          <User size={18} />
        </Link>
      </div>
    </header>
  );
}
