"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Film, Brain, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/group",       label: "Group",       icon: Home     },
  { href: "/gaming",      label: "Gaming",      icon: Gamepad2 },
  { href: "/movies",      label: "Movies",      icon: Film     },
  { href: "/members",     label: "Members",     icon: Users    },
  { href: "/personality", label: "Personality", icon: Brain    },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex pb-safe"
      style={{
        backgroundColor: "rgba(6,6,20,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0, 255, 234, 0.2)",
        boxShadow: "0 -4px 20px rgba(0, 255, 234, 0.06)",
      }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all active:scale-90",
            )}
            style={{
              color: active ? "#00ffea" : "var(--color-text-muted)",
              textShadow: active ? "0 0 8px rgba(0, 255, 234, 0.6)" : "none",
            }}
          >
            <span
              style={
                active
                  ? { filter: "drop-shadow(0 0 6px rgba(0, 255, 234, 0.8))" }
                  : undefined
              }
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
