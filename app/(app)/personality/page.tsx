import { TopBar } from "@/components/layout/TopBar";

export default function PersonalityPage() {
  return (
    <>
      <TopBar title="Personality Corner" />
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Personality Corner
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Discover yourself through 10 different personality lenses.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: "MBTI", desc: "16 personality types — who are you really?" },
              { name: "Enneagram", desc: "9 types based on your core motivation." },
              { name: "Big Five (OCEAN)", desc: "The most scientifically-backed model." },
              { name: "Love Languages", desc: "How you give and receive love." },
              { name: "Attachment Style", desc: "How you connect in relationships." },
              { name: "DISC", desc: "How you communicate and make decisions." },
              { name: "Western Zodiac", desc: "Auto-calculated from your birthday." },
              { name: "Chinese Zodiac", desc: "Your animal sign by birth year." },
              { name: "Life Path Number", desc: "Numerology from your full birthdate." },
              { name: "Human Design", desc: "Your energetic blueprint. Needs birth time." },
            ].map(({ name, desc }) => (
              <div
                key={name}
                className="rounded-xl p-4 border cursor-pointer transition-all hover:border-purple-500/50"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text-primary)" }}>{name}</h3>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
