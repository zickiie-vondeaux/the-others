import { TopBar } from "@/components/layout/TopBar";

export default function ProfilePage() {
  return (
    <>
      <TopBar title="My Profile" />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            My Profile
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Your identity in The Others.
          </p>
          <div
            className="rounded-xl border p-8 text-center"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>Profile coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}
