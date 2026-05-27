"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkAndUnlockAchievements, type Achievement } from "@/lib/achievements";
import { AchievementToastStack } from "./AchievementToast";

interface AchievementCtx {
  triggerCheck: () => Promise<void>;
}

const Ctx = createContext<AchievementCtx>({ triggerCheck: async () => {} });

export function useAchievements() {
  return useContext(Ctx);
}

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState("");
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const checkingRef = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Initial check on load
        checkAndUnlockAchievements(user.id).then(unlocked => {
          if (unlocked.length > 0) setToastQueue(unlocked);
        });
      }
    });
  }, []);

  // Auto-dismiss toasts after 5s each
  useEffect(() => {
    if (toastQueue.length === 0) return;
    const t = setTimeout(() => {
      setToastQueue(prev => prev.slice(1));
    }, 5000);
    return () => clearTimeout(t);
  }, [toastQueue]);

  const triggerCheck = useCallback(async () => {
    if (!userId || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const unlocked = await checkAndUnlockAchievements(userId);
      if (unlocked.length > 0) {
        setToastQueue(prev => [...prev, ...unlocked]);
      }
    } finally {
      checkingRef.current = false;
    }
  }, [userId]);

  const dismiss = (id: string) => setToastQueue(prev => prev.filter(a => a.id !== id));

  return (
    <Ctx.Provider value={{ triggerCheck }}>
      {children}
      <AchievementToastStack achievements={toastQueue} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}
