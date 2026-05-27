"use client";

const CYCLE_W = 200;

function buildPath(cycles: number): string {
  const pts: string[] = [];
  for (let i = 0; i < cycles; i++) {
    const x = i * CYCLE_W;
    if (i === 0) pts.push(`M 0,0`);
    pts.push(`L ${x + 35},0`);
    pts.push(`C ${x + 43},-7 ${x + 53},-7 ${x + 61},0`);
    pts.push(`L ${x + 80},0`);
    pts.push(`L ${x + 84},5`);
    pts.push(`L ${x + 88},-38`);
    pts.push(`L ${x + 92},10`);
    pts.push(`L ${x + 98},0`);
    pts.push(`C ${x + 113},-13 ${x + 140},-13 ${x + 154},0`);
    pts.push(`L ${x + CYCLE_W},0`);
  }
  return pts.join(" ");
}

const CYCLES = 30;
const ANIM_DIST = 20 * CYCLE_W; // exactly 20 cycles — seamless loop
const path = buildPath(CYCLES);

export function EcgBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Trace 1 — cyan, slow (22s), upper area */}
        <g transform="translate(0, 160)">
          <g className="ecg-trace-1">
            <path d={path} fill="none" stroke="#00ffea" strokeWidth="1.5" opacity="0.11" />
          </g>
        </g>

        {/* Trace 2 — purple, medium (15s), mid area, phase offset */}
        <g transform="translate(-600, 420)">
          <g className="ecg-trace-2">
            <path d={path} fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.07" />
          </g>
        </g>

        {/* Trace 3 — cyan, fast (11s), lower area, phase offset */}
        <g transform="translate(-1200, 680)">
          <g className="ecg-trace-3">
            <path d={path} fill="none" stroke="#00ffea" strokeWidth="1" opacity="0.05" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export const ecgAnimDist = ANIM_DIST;
