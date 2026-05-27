"use client";

import { Bell, User } from "lucide-react";
import Link from "next/link";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b lg:hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}>
          <Bell size={18} />
        </Link>
        <Link href="/profile" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}>
          <User size={18} />
        </Link>
      </div>
    </header>
  );
}
