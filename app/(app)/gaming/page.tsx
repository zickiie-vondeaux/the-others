import { TopBar } from "@/components/layout/TopBar";

export default function GamingPage() {
  return (
    <>
      <TopBar title="Gaming Library" />
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Gaming Library
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Games played, queued, and wishlisted by The Others.
          </p>
          <div
            className="rounded-xl border p-8 text-center"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>Gaming Library coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}
