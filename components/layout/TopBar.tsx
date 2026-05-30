"use client";

import { useEffect, useRef, useState } from "react";
import { User, Settings, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/group/NotificationBell";
import { hasPermission, PERMISSIONS, type Role } from "@/lib/roles";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [userId, setUserId]   = useState("");
  const [role, setRole]       = useState<Role | null>(null);
  const [open, setOpen]       = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);
  const supabase              = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role) setRole(data.role as Role);
        });
    });
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const canAdmin = role && hasPermission(role, PERMISSIONS.ACCESS_ADMIN_PANEL);

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
        className="text-2xl font-black uppercase tracking-widest"
        style={{ color: "#00ffea", textShadow: "0 0 6px #00ffea, 0 0 20px rgba(0, 255, 234, 0.8), 0 0 48px rgba(0, 255, 234, 0.4)" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {userId && <NotificationBell userId={userId} />}

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(prev => !prev)}
            aria-label="Account menu"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: open ? "#00ffea" : "rgba(0, 255, 234, 0.5)" }}
          >
            <User size={18} />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-50"
              style={{
                backgroundColor: "rgba(6,6,20,0.96)",
                border: "1px solid rgba(0, 255, 234, 0.18)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(0, 255, 234, 0.06)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <MenuItem href="/profile" icon={<User size={15} />} label="My Profile" onClick={() => setOpen(false)} />
              <MenuItem href="/settings" icon={<Settings size={15} />} label="Settings" onClick={() => setOpen(false)} />
              {canAdmin && (
                <MenuItem href="/admin" icon={<Shield size={15} />} label="Admin Panel" onClick={() => setOpen(false)} amber />
              )}
              <div style={{ borderTop: "1px solid rgba(0,255,234,0.08)" }} />
              <a
                href="/api/auth/signout"
                className="flex items-center gap-3 px-4 py-3 text-sm w-full"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(236,72,153,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(236,72,153,0.85)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  href,
  icon,
  label,
  onClick,
  amber,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  amber?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-sm"
      style={{ color: "var(--color-text-secondary)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = amber
          ? "rgba(245,158,11,0.07)"
          : "rgba(0,255,234,0.06)";
        (e.currentTarget as HTMLElement).style.color = amber
          ? "var(--color-amber)"
          : "#00ffea";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "";
        (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
