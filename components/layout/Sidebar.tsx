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
    <aside className="hidden lg:flex flex-col w-64 h-full border-r shrink-0"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b"
        style={{ borderColor: "var(--color-border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
          style={{ background: "linear-gradient(135deg, var(--color-purple), var(--color-cyan))" }}>
          T
        </div>
        <div>
          <p className="font-bold text-sm tracking-wide" style={{ color: "var(--color-text-primary)" }}>
            THE OTHERS
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>private hub</p>
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
                active
                  ? "text-cyan-400 bg-cyan-400/10 border-l-2 border-cyan-400 pl-[10px]"
                  : "hover:bg-white/5"
              )}
              style={{ color: active ? "var(--color-cyan)" : "var(--color-text-secondary)" }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t" style={{ borderColor: "var(--color-border)" }} />

      {/* Bottom nav */}
      <nav className="py-4 px-3 space-y-1">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active ? "text-cyan-400 bg-cyan-400/10" : "hover:bg-white/5"
              )}
              style={{ color: active ? "var(--color-cyan)" : "var(--color-text-muted)" }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Admin link — shown to all for now, will be gated by role */}
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            pathname.startsWith("/admin") ? "text-amber-400 bg-amber-400/10" : "hover:bg-white/5"
          )}
          style={{ color: pathname.startsWith("/admin") ? "var(--color-amber)" : "var(--color-text-muted)" }}
        >
          <Shield size={17} />
          <span>Admin Panel</span>
        </Link>
      </nav>
    </aside>
  );
}
