import { TopBar } from "@/components/layout/TopBar";

export default function GroupCornerPage() {
  return (
    <>
      <TopBar title="Group Corner" />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Group Corner
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Your group&apos;s living dashboard.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <PlaceholderCard title="Activity Feed" description="Live stream of everything happening in The Others." />
            <PlaceholderCard title="Personality Overview" description="Group-wide personality breakdown and compatibility." />
            <PlaceholderCard title="Birthday Spotlight" description="Who's celebrating soon — and what they want." />
            <PlaceholderCard title="Member Directory" description="All members, their personalities, and last active times." />
          </div>
        </div>
      </div>
    </>
  );
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="w-8 h-1 rounded mb-3" style={{ backgroundColor: "var(--color-purple)" }} />
      <h2 className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{description}</p>
      <div className="mt-4 text-xs font-medium px-2 py-1 rounded inline-block"
        style={{ backgroundColor: "var(--color-purple)", color: "white", opacity: 0.7 }}>
        Coming soon
      </div>
    </div>
  );
}
