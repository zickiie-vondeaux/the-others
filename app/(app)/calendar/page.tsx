import { TopBar } from "@/components/layout/TopBar";

export default function CalendarPage() {
  return (
    <>
      <TopBar title="Calendar" />
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Calendar
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Birthdays, game nights, movie nights, meetups — all in one place.
          </p>
          <div
            className="rounded-xl border p-8 text-center"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>Calendar coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}
