"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Gamepad2,
  Film,
  Brain,
  User,
  Bell,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/group", label: "Group Corner", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/gaming", label: "Gaming Library", icon: Gamepad2 },
  { href: "/movies", label: "Movie Library", icon: Film },
  { href: "/personality", label: "Personality", icon: Brain },
];

const bottomItems = [
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-full shrink-0"
      style={{
        backgroundColor: "#08081a",
        borderRight: "1px solid rgba(0, 255, 234, 0.2)",
        boxShadow: "2px 0 20px rgba(0, 255, 234, 0.06)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-6"
        style={{ borderBottom: "1px solid rgba(0, 255, 234, 0.12)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #00ffea)",
            boxShadow: "0 0 10px rgba(0, 255, 234, 0.4)",
          }}
        >
          T
        </div>
        <div>
          <p
            className="font-black text-sm tracking-widest uppercase"
            style={{
              color: "#00ffea",
              textShadow: "0 0 8px rgba(0, 255, 234, 0.6)",
            }}
          >
            The Others
          </p>
          <p className="text-xs" style={{ color: "rgba(0, 255, 234, 0.35)" }}>
            private hub
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active ? "pl-[10px]" : ""
              )}
              style={
                active
                  ? {
                      color: "#00ffea",
                      backgroundColor: "rgba(0, 255, 234, 0.08)",
                      borderLeft: "2px solid #00ffea",
                      boxShadow: "inset 0 0 20px rgba(0, 255, 234, 0.04), 0 0 8px rgba(0, 255, 234, 0.1)",
                    }
                  : {
                      color: "var(--color-text-secondary)",
                    }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0, 255, 234, 0.04)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(0, 255, 234, 0.7)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                }
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3" style={{ borderTop: "1px solid rgba(0, 255, 234, 0.08)" }} />

      {/* Bottom nav */}
      <nav className="py-4 px-3 space-y-1">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={
                active
                  ? { color: "#00ffea", backgroundColor: "rgba(0, 255, 234, 0.08)" }
                  : { color: "var(--color-text-muted)" }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0, 255, 234, 0.04)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(0, 255, 234, 0.5)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                }
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={
            pathname.startsWith("/admin")
              ? { color: "var(--color-amber)", backgroundColor: "rgba(245, 158, 11, 0.08)" }
              : { color: "var(--color-text-muted)" }
          }
          onMouseEnter={e => {
            if (!pathname.startsWith("/admin")) {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0, 255, 234, 0.04)";
              (e.currentTarget as HTMLElement).style.color = "rgba(0, 255, 234, 0.5)";
            }
          }}
          onMouseLeave={e => {
            if (!pathname.startsWith("/admin")) {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
            }
          }}
        >
          <Shield size={17} />
          <span>Admin Panel</span>
        </Link>
      </nav>
    </aside>
  );
}
