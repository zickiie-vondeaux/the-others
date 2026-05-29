import { createAdminClient } from "@/lib/supabase/admin";

export async function createCardRemovedNotification(
  recipientUserId: string,
  cardType: "game" | "movie",
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: recipientUserId,
    type: "card_removed_by_moderator",
    body: `Your ${cardType} card was removed by a moderator.`,
    is_read: false,
  });
}
