"use client";

const CYCLE_W = 200;
const ECG_CYCLES = 30;

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

export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
    >
      {/* Photo background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/mainbg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark overlay — mutes image enough to keep UI readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(6,6,16,0.82) 0%, rgba(6,6,16,0.75) 45%, rgba(6,6,16,0.88) 100%)",
        }}
      />

      {/* Subtle color tint to blend image with the app palette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ECG traces */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        <g transform="translate(0, 160)">
          <g className="ecg-trace-1">
            <path d={ecgPath} fill="none" stroke="#00ffea" strokeWidth="1.5" opacity="0.1" />
          </g>
        </g>
        <g transform="translate(-600, 420)">
          <g className="ecg-trace-2">
            <path d={ecgPath} fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.07" />
          </g>
        </g>
        <g transform="translate(-1200, 660)">
          <g className="ecg-trace-3">
            <path d={ecgPath} fill="none" stroke="#00ffea" strokeWidth="1" opacity="0.04" />
          </g>
        </g>
      </svg>
    </div>
  );
}
