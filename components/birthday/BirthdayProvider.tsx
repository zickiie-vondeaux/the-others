"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isBirthdayToday, isBirthdaySoon, daysUntilBirthday } from "@/lib/birthday";
import { BirthdaySurpriseScreen } from "./BirthdaySurpriseScreen";
import type { Profile } from "@/lib/supabase/types";

type BirthdayProfile = Pick<Profile, "id" | "display_name" | "avatar_url" | "birthday">;

interface BirthdayCtx {
  todaysCelebrants: BirthdayProfile[];
  upcomingBirthdays: (BirthdayProfile & { daysUntil: number })[];
  myProfile: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
}

const Ctx = createContext<BirthdayCtx>({
  todaysCelebrants: [],
  upcomingBirthdays: [],
  myProfile: null,
});

export function useBirthdays() {
  return useContext(Ctx);
}

export function BirthdayProvider({ children }: { children: React.ReactNode }) {
  const [todaysCelebrants, setTodaysCelebrants] = useState<BirthdayProfile[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<(BirthdayProfile & { daysUntil: number })[]>([]);
  const [myProfile, setMyProfile] = useState<Pick<Profile, "id" | "display_name" | "avatar_url"> | null>(null);
  const [isMyBirthday, setIsMyBirthday] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url,birthday");

    if (!profiles) return;

    const today: BirthdayProfile[] = [];
    const upcoming: (BirthdayProfile & { daysUntil: number })[] = [];

    for (const p of profiles as BirthdayProfile[]) {
      if (isBirthdayToday(p.birthday)) {
        today.push(p);
      } else if (isBirthdaySoon(p.birthday, 7)) {
        const days = daysUntilBirthday(p.birthday);
        if (days !== null) upcoming.push({ ...p, daysUntil: days });
      }
    }

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    setTodaysCelebrants(today);
    setUpcomingBirthdays(upcoming);

    const me = profiles.find(p => p.id === user.id) as BirthdayProfile | undefined;
    if (me) {
      setMyProfile({ id: me.id, display_name: me.display_name, avatar_url: me.avatar_url });
      setIsMyBirthday(isBirthdayToday(me.birthday));
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  return (
    <Ctx.Provider value={{ todaysCelebrants, upcomingBirthdays, myProfile }}>
      {isMyBirthday && (
        <style>{`
          :root {
            --color-purple: #fbbf24 !important;
            --color-purple-hover: #f59e0b !important;
          }
        `}</style>
      )}
      {children}
      {isMyBirthday && myProfile && (
        <BirthdaySurpriseScreen profile={myProfile} />
      )}
    </Ctx.Provider>
  );
}
