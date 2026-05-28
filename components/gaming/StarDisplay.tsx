"use client";

import { Star } from "lucide-react";

export function HalfStar({ size, isFull, isHalf, color, emptyColor }: {
  size: number;
  isFull: boolean;
  isHalf: boolean;
  color: string;
  emptyColor: string;
}) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <Star size={size} fill="none" style={{ color: emptyColor }} />
      {(isFull || isHalf) && (
        <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: isFull ? "100%" : "50%" }}>
          <Star size={size} fill="currentColor" style={{ color }} />
        </span>
      )}
    </span>
  );
}

export function StarRow({ value, size = 11 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <HalfStar key={s} size={size}
          isFull={value >= s}
          isHalf={value >= s - 0.5 && value < s}
          color="var(--color-gold)"
          emptyColor="var(--color-border)"
        />
      ))}
    </span>
  );
}
