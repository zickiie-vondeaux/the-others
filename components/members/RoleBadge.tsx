import { ROLE_DISPLAY, type Role } from "@/lib/roles";

const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string }> = {
  chaos:    { bg: "rgba(127,119,221,0.15)", text: "#7F77DD", border: "rgba(127,119,221,0.4)" },
  watcher:  { bg: "rgba(29,158,117,0.15)",  text: "#1D9E75", border: "rgba(29,158,117,0.4)"  },
  ascended: { bg: "rgba(212,83,126,0.15)",  text: "#D4537E", border: "rgba(212,83,126,0.4)"  },
  wanderer: { bg: "rgba(186,117,23,0.15)",  text: "#BA7517", border: "rgba(186,117,23,0.4)"  },
  unnamed:  { bg: "rgba(71,85,105,0.15)",   text: "#475569", border: "rgba(71,85,105,0.4)"   },
};

export function RoleBadge({ role, size = "sm" }: { role: Role; size?: "sm" | "xs" }) {
  const c = ROLE_COLORS[role];
  const cls = size === "xs"
    ? "text-[10px] px-1.5 py-0.5 rounded font-medium border"
    : "text-xs px-2 py-0.5 rounded-md font-semibold border";
  return (
    <span className={cls} style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>
      {ROLE_DISPLAY[role]}
    </span>
  );
}
