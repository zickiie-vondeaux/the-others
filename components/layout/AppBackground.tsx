"use client";

// ── ECG path ──────────────────────────────────────────────────
const CYCLE_W = 200;
const ECG_CYCLES = 30;
const ECG_ANIM_PX = 20 * CYCLE_W; // exactly 20 cycles → seamless

function buildEcgPath(): string {
  const pts: string[] = [];
  for (let i = 0; i < ECG_CYCLES; i++) {
    const x = i * CYCLE_W;
    if (i === 0) pts.push("M 0,0");
    pts.push(`L ${x + 35},0`);
    pts.push(`C ${x + 43},-7 ${x + 53},-7 ${x + 61},0`);
    pts.push(`L ${x + 80},0`);
    pts.push(`L ${x + 84},5 L ${x + 88},-38 L ${x + 92},10`);
    pts.push(`L ${x + 98},0`);
    pts.push(`C ${x + 113},-13 ${x + 140},-13 ${x + 154},0`);
    pts.push(`L ${x + CYCLE_W},0`);
  }
  return pts.join(" ");
}

const ecgPath = buildEcgPath();

// ── City building data ─────────────────────────────────────────
// Each building: [x, width, height, neonColor?, showWindows?]
// All buildings anchor to y=900 (bottom of viewBox)

const FAR: [number, number, number][] = [
  [0, 108, 155], [118, 72, 128], [200, 138, 182], [348, 82, 145],
  [440, 162, 168], [612, 92, 155], [714, 122, 188], [846, 102, 160],
  [958, 152, 175], [1120, 112, 165], [1242, 132, 180], [1384, 200, 160],
];

const MID: [number, number, number, string | null, boolean][] = [
  [0,    82,  288, null,      true],
  [92,   122, 255, "#8b5cf6", true],
  [224,  92,  315, null,      true],
  [326,  152, 274, null,      true],
  [488,  82,  302, null,      false],
  [580,  112, 340, "#00ffea", true],
  [702,  132, 290, null,      true],
  [844,  102, 314, null,      false],
  [956,  142, 272, "#ec4899", true],
  [1108, 92,  306, null,      true],
  [1210, 122, 288, null,      false],
  [1342, 200, 300, "#00ffea", true],
];

const FRONT: [number, number, number, string, boolean][] = [
  [0,    128, 445, "#8b5cf6", true],
  [138,  82,  385, "#00ffea", false],
  [230,  162, 508, "#00ffea", true],
  [402,  102, 455, "#8b5cf6", true],
  [514,  142, 425, "#ec4899", true],
  [666,  92,  392, "#00ffea", false],
  [768,  208, 532, "#00ffea", true],
  [986,  112, 450, "#8b5cf6", true],
  [1108, 152, 472, "#c084fc", true],
  [1270, 102, 432, "#00ffea", true],
  [1382, 200, 512, "#8b5cf6", true],
];

// Deterministic window pattern: lit if hash(col, row, seed) < threshold
function isWindowLit(col: number, row: number, seed: number): boolean {
  return ((col * 13 + row * 7 + seed * 3) % 11) < 3;
}

function Windows({
  bx, by, bw, bh, seed,
}: {
  bx: number; by: number; bw: number; bh: number; seed: number;
}) {
  const cols = Math.floor((bw - 8) / 12);
  const rows = Math.floor((bh - 16) / 16);
  const windows: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isWindowLit(c, r, seed)) continue;
      const wx = bx + 4 + c * 12;
      const wy = by + 10 + r * 16;
      // Vary window colour: mostly amber, some cyan
      const isCyan = (c * 5 + r * 3 + seed) % 9 === 0;
      windows.push(
        <rect key={`${r}-${c}`} x={wx} y={wy} width={4} height={5}
          fill={isCyan ? "#00ffea" : "#f59e0b"} opacity={isCyan ? "0.55" : "0.45"} />
      );
    }
  }
  return <>{windows}</>;
}

export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
    >
      {/* ── City SVG ──────────────────────────────────────────── */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#060610" />
            <stop offset="50%"  stopColor="#0b0720" />
            <stop offset="80%"  stopColor="#160834" />
            <stop offset="100%" stopColor="#1c0840" />
          </linearGradient>

          {/* Horizon atmospheric glow */}
          <radialGradient id="horizon" cx="50%" cy="100%" r="65%" fx="50%" fy="90%">
            <stop offset="0%"   stopColor="#6d28d9" stopOpacity="0.38" />
            <stop offset="45%"  stopColor="#4c1d95" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>

          {/* Left-side secondary glow (cyan tint) */}
          <radialGradient id="glow-left" cx="0%" cy="80%" r="45%">
            <stop offset="0%"   stopColor="#00ffea" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00ffea" stopOpacity="0" />
          </radialGradient>

          {/* Moon */}
          <radialGradient id="moon-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#e8d5ff" stopOpacity="0.9" />
            <stop offset="60%"  stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
          </radialGradient>

          {/* Glow filters */}
          <filter id="glow-xs" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-s" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-m" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-l" x="-250%" y="-250%" width="600%" height="600%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect width="1440" height="900" fill="url(#city-sky)" />
        <rect width="1440" height="900" fill="url(#horizon)" />
        <rect width="1440" height="900" fill="url(#glow-left)" />

        {/* Stars — deterministic scatter */}
        {Array.from({ length: 60 }, (_, i) => {
          const sx = ((i * 137 + 50) % 1440);
          const sy = ((i * 97 + 30) % 420);
          const bright = i % 5 === 0;
          return (
            <circle key={i} cx={sx} cy={sy} r={bright ? 1.2 : 0.7}
              fill="white" opacity={bright ? 0.6 : 0.3}
              filter={bright ? "url(#glow-xs)" : undefined} />
          );
        })}

        {/* Moon */}
        <circle cx="1180" cy="100" r="55" fill="url(#moon-core)" filter="url(#glow-l)" opacity="0.5" />
        <circle cx="1180" cy="100" r="28" fill="#f0e0ff" opacity="0.12" />

        {/* ── Far buildings ───────────────────────────────────── */}
        <g fill="#0e0e28">
          {FAR.map(([x, w, h], i) => (
            <rect key={i} x={x} y={900 - h} width={w} height={h} />
          ))}
        </g>

        {/* ── Mid buildings ───────────────────────────────────── */}
        {MID.map(([x, w, h, neon, wins], i) => {
          const by = 900 - h;
          return (
            <g key={i}>
              <rect x={x} y={by} width={w} height={h} fill="#0a0a1e" />
              {wins && <Windows bx={x} by={by} bw={w} bh={h} seed={i * 17 + 100} />}
              {neon && (
                <>
                  {/* Neon roofline */}
                  <rect x={x} y={by} width={w} height={2} fill={neon}
                    opacity="0.85" filter="url(#glow-s)" />
                  {/* Faint neon floor-line halfway up */}
                  <rect x={x + 8} y={by + Math.floor(h * 0.5)} width={w - 16} height={1}
                    fill={neon} opacity="0.3" filter="url(#glow-xs)" />
                </>
              )}
            </g>
          );
        })}

        {/* ── Front buildings ─────────────────────────────────── */}
        {FRONT.map(([x, w, h, neon, wins], i) => {
          const by = 900 - h;
          const hasAntenna   = i % 3 === 0;
          const hasVertStrip = i % 4 === 1;
          const hasSign      = i % 3 === 2;
          return (
            <g key={i}>
              <rect x={x} y={by} width={w} height={h} fill="#060612" />
              {wins && <Windows bx={x} by={by} bw={w} bh={h} seed={i * 31 + 200} />}

              {/* Roofline neon strip */}
              <rect x={x} y={by} width={w} height={3} fill={neon}
                opacity="0.9" filter="url(#glow-m)" />

              {/* Secondary accent line (1/3 from top) */}
              <rect x={x + 6} y={by + Math.floor(h / 3)} width={w - 12} height={1}
                fill={neon} opacity="0.35" filter="url(#glow-xs)" />

              {/* Antenna */}
              {hasAntenna && (
                <>
                  <rect x={x + Math.floor(w / 2) - 1} y={by - 40} width={2} height={42}
                    fill={neon} opacity="0.7" filter="url(#glow-s)" />
                  <circle cx={x + Math.floor(w / 2)} cy={by - 42} r={3}
                    fill={neon} opacity="0.9" filter="url(#glow-m)" />
                </>
              )}

              {/* Vertical neon strip */}
              {hasVertStrip && (
                <rect x={x + Math.floor(w * 0.75)} y={by} width={3} height={Math.floor(h * 0.45)}
                  fill={neon} opacity="0.5" filter="url(#glow-s)" />
              )}

              {/* Neon sign block */}
              {hasSign && (
                <>
                  <rect x={x + 10} y={by + Math.floor(h * 0.28)} width={w - 20} height={18}
                    fill={neon} opacity="0.08" />
                  <rect x={x + 10} y={by + Math.floor(h * 0.28)} width={w - 20} height={18}
                    fill="none" stroke={neon} strokeWidth={1} opacity="0.5"
                    filter="url(#glow-s)" />
                </>
              )}
            </g>
          );
        })}

        {/* Ground */}
        <rect y="878" width="1440" height="22" fill="#040410" />

        {/* Ground puddle reflections — neon smears */}
        {[
          { cx: 200,  w: 80,  color: "#8b5cf6" },
          { cx: 540,  w: 60,  color: "#00ffea" },
          { cx: 880,  w: 100, color: "#00ffea" },
          { cx: 1200, w: 70,  color: "#c084fc" },
        ].map(({ cx, w, color }, i) => (
          <ellipse key={i} cx={cx} cy={893} rx={w} ry={5}
            fill={color} opacity="0.18" filter="url(#glow-s)" />
        ))}
      </svg>

      {/* ── ECG traces (fixed over city) ──────────────────────── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        <g transform="translate(0, 160)">
          <g className="ecg-trace-1">
            <path d={ecgPath} fill="none" stroke="#00ffea" strokeWidth="1.5" opacity="0.12" />
          </g>
        </g>
        <g transform="translate(-600, 420)">
          <g className="ecg-trace-2">
            <path d={ecgPath} fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.08" />
          </g>
        </g>
        <g transform="translate(-1200, 660)">
          <g className="ecg-trace-3">
            <path d={ecgPath} fill="none" stroke="#00ffea" strokeWidth="1" opacity="0.05" />
          </g>
        </g>
      </svg>
    </div>
  );
}
