"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
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
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "true");
  }, []);

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-open", String(next));
      return next;
    });
  };

  return (
    <>
      {/* Floating re-open button when sidebar is hidden */}
      {!open && (
        <button
          onClick={toggle}
          className="hidden lg:flex fixed top-5 left-4 z-50 items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110"
          style={{
            backgroundColor: "rgba(6,6,20,0.85)",
            border: "1px solid rgba(0,255,234,0.25)",
            color: "rgba(0,255,234,0.7)",
            boxShadow: "0 0 10px rgba(0,255,234,0.15)",
          }}
          aria-label="Open sidebar"
        >
          <PanelLeftOpen size={15} />
        </button>
      )}

    <aside
      className="hidden lg:flex flex-col h-full shrink-0 overflow-hidden"
      style={{
        width: open ? "256px" : "0px",
        transition: "width 0.25s ease",
        backgroundColor: "rgba(6,6,20,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: open ? "1px solid rgba(0, 255, 234, 0.2)" : "none",
        boxShadow: open ? "2px 0 20px rgba(0, 255, 234, 0.06)" : "none",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-6 shrink-0"
        style={{ borderBottom: "1px solid rgba(0, 255, 234, 0.12)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #00ffea)",
            boxShadow: "0 0 10px rgba(0, 255, 234, 0.4)",
          }}
        >
          T
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-black text-sm tracking-widest uppercase truncate"
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
        <button
          onClick={toggle}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-all hover:scale-110"
          style={{ color: "rgba(0,255,234,0.45)" }}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
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
    </>
  );
}
