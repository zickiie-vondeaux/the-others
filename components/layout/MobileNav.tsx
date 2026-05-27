"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Gamepad2, Film, Brain } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/group", label: "Group", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/gaming", label: "Gaming", icon: Gamepad2 },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/personality", label: "Personality", icon: Brain },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 border-t z-50 flex"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
              active ? "" : ""
            )}
            style={{ color: active ? "var(--color-cyan)" : "var(--color-text-muted)" }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
