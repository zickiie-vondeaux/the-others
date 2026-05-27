import { TopBar } from "@/components/layout/TopBar";

export default function AdminPage() {
  return (
    <>
      <TopBar title="Admin Panel" />
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-amber)" }}>
            Admin Panel
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Manage members, invites, and content.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Invite Links", desc: "Generate and revoke invite links for new members." },
              { title: "Members", desc: "View all members, manage roles, remove users." },
              { title: "Content Moderation", desc: "Delete any post or activity feed entry." },
              { title: "Profile Override", desc: "Edit any member's profile or wishlist." },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-5 border"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <h2 className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                <div className="mt-4 text-xs font-medium px-2 py-1 rounded inline-block"
                  style={{ backgroundColor: "var(--color-amber)", color: "black", opacity: 0.9 }}>
                  Coming soon
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
