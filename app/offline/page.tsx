"use client";

export default function OfflinePage() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="text-6xl">🦦</div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          You're offline
        </h1>
        <p className="text-sm max-w-xs" style={{ color: "var(--color-text-muted)" }}>
          The Others needs a connection. Find some Wi-Fi and we'll pick up right where you left off.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
      >
        Try again
      </button>
    </div>
  );
}
