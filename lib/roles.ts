export type Role = "chaos" | "watcher" | "ascended" | "wanderer" | "unnamed";

export const ROLE_DISPLAY: Record<Role, string> = {
  chaos:    "Chaos",
  watcher:  "The Watchers",
  ascended: "Ascended",
  wanderer: "Wanderer",
  unnamed:  "The Unnamed",
};

// Higher number = higher tier
export const ROLE_TIER: Record<Role, number> = {
  unnamed:  0,
  wanderer: 1,
  ascended: 2,
  watcher:  3,
  chaos:    4,
};

export const PERMISSIONS = {
  VIEW_PUBLIC:           "view_public",
  COMPLETE_ONBOARDING:   "complete_onboarding",
  VIEW_LIBRARY:          "view_library",
  TAKE_PERSONALITY_TEST: "take_personality_test",
  POST:                  "post",
  COMMENT:               "comment",
  REACT:                 "react",
  JOIN_EVENTS:           "join_events",
  RATE_GAMES:            "rate_games",
  ADD_LIBRARY_CARD:      "add_library_card",
  DELETE_OWN_CARD:       "delete_own_card",
  EDIT_PROFILE:          "edit_profile",
  CREATE_EVENTS:         "create_events",
  FLAG_CONTENT:          "flag_content",
  ACCESS_EXCLUSIVE:      "access_exclusive",
  POST_ANNOUNCEMENT:     "post_announcement",
  CUSTOM_FLAIR:          "custom_flair",
  EARLY_ACCESS:          "early_access",
  MODERATE_CONTENT:      "moderate_content",
  MUTE_KICK_BAN:         "mute_kick_ban",
  PIN_ANNOUNCEMENTS:     "pin_announcements",
  PROMOTE_TO_ASCENDED:   "promote_to_ascended",
  VIEW_ACTIVITY_LOGS:    "view_activity_logs",
  DELETE_ANY_CARD:       "delete_any_card",
  MODERATE_COMMENTS:     "moderate_comments",
  ACCESS_ADMIN_PANEL:    "access_admin_panel",
  EDIT_METADATA:         "edit_metadata",
  APP_SETTINGS:          "app_settings",
  INTEGRATIONS_BILLING:  "integrations_billing",
  FULL_ANALYTICS:        "full_analytics",
  ASSIGN_REVOKE_ROLES:   "assign_revoke_roles",
  OVERRIDE_MODERATION:   "override_moderation",
  FULL_ADMIN_PANEL:      "full_admin_panel",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const PERMISSION_MIN_TIER: Record<Permission, number> = {
  [PERMISSIONS.VIEW_PUBLIC]:           ROLE_TIER.unnamed,
  [PERMISSIONS.COMPLETE_ONBOARDING]:   ROLE_TIER.unnamed,
  [PERMISSIONS.VIEW_LIBRARY]:          ROLE_TIER.unnamed,
  [PERMISSIONS.TAKE_PERSONALITY_TEST]: ROLE_TIER.unnamed,
  [PERMISSIONS.POST]:                  ROLE_TIER.wanderer,
  [PERMISSIONS.COMMENT]:               ROLE_TIER.wanderer,
  [PERMISSIONS.REACT]:                 ROLE_TIER.wanderer,
  [PERMISSIONS.JOIN_EVENTS]:           ROLE_TIER.wanderer,
  [PERMISSIONS.RATE_GAMES]:            ROLE_TIER.wanderer,
  [PERMISSIONS.ADD_LIBRARY_CARD]:      ROLE_TIER.wanderer,
  [PERMISSIONS.DELETE_OWN_CARD]:       ROLE_TIER.wanderer,
  [PERMISSIONS.EDIT_PROFILE]:          ROLE_TIER.wanderer,
  [PERMISSIONS.CREATE_EVENTS]:         ROLE_TIER.ascended,
  [PERMISSIONS.FLAG_CONTENT]:          ROLE_TIER.ascended,
  [PERMISSIONS.ACCESS_EXCLUSIVE]:      ROLE_TIER.ascended,
  [PERMISSIONS.POST_ANNOUNCEMENT]:     ROLE_TIER.ascended,
  [PERMISSIONS.CUSTOM_FLAIR]:          ROLE_TIER.ascended,
  [PERMISSIONS.EARLY_ACCESS]:          ROLE_TIER.ascended,
  [PERMISSIONS.MODERATE_CONTENT]:      ROLE_TIER.watcher,
  [PERMISSIONS.MUTE_KICK_BAN]:         ROLE_TIER.watcher,
  [PERMISSIONS.PIN_ANNOUNCEMENTS]:     ROLE_TIER.watcher,
  [PERMISSIONS.PROMOTE_TO_ASCENDED]:   ROLE_TIER.watcher,
  [PERMISSIONS.VIEW_ACTIVITY_LOGS]:    ROLE_TIER.watcher,
  [PERMISSIONS.DELETE_ANY_CARD]:       ROLE_TIER.watcher,
  [PERMISSIONS.MODERATE_COMMENTS]:     ROLE_TIER.watcher,
  [PERMISSIONS.ACCESS_ADMIN_PANEL]:    ROLE_TIER.watcher,
  [PERMISSIONS.EDIT_METADATA]:         ROLE_TIER.chaos,
  [PERMISSIONS.APP_SETTINGS]:          ROLE_TIER.chaos,
  [PERMISSIONS.INTEGRATIONS_BILLING]:  ROLE_TIER.chaos,
  [PERMISSIONS.FULL_ANALYTICS]:        ROLE_TIER.chaos,
  [PERMISSIONS.ASSIGN_REVOKE_ROLES]:   ROLE_TIER.chaos,
  [PERMISSIONS.OVERRIDE_MODERATION]:   ROLE_TIER.chaos,
  [PERMISSIONS.FULL_ADMIN_PANEL]:      ROLE_TIER.chaos,
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_TIER[role] >= PERMISSION_MIN_TIER[permission];
}

// Can actorRole promote targetCurrentRole to targetNewRole?
export function canPromote(
  actorRole: Role,
  targetCurrentRole: Role,
  targetNewRole: Role,
): boolean {
  // Chaos is non-transferable
  if (targetNewRole === "chaos") return false;

  // Actor must be strictly above both current and new role
  if (ROLE_TIER[actorRole] <= ROLE_TIER[targetCurrentRole]) return false;
  if (ROLE_TIER[actorRole] <= ROLE_TIER[targetNewRole]) return false;

  // wanderer → ascended: watcher or chaos only
  if (targetCurrentRole === "wanderer" && targetNewRole === "ascended") {
    return actorRole === "watcher" || actorRole === "chaos";
  }

  // ascended → watcher: chaos only
  if (targetCurrentRole === "ascended" && targetNewRole === "watcher") {
    return actorRole === "chaos";
  }

  // All other upward promotions: chaos only
  return actorRole === "chaos";
}

// Can actorRole revoke/demote targetRole?
export function canRevoke(actorRole: Role, targetRole: Role): boolean {
  if (targetRole === "chaos") return false;
  return ROLE_TIER[actorRole] > ROLE_TIER[targetRole];
}

// Returns whether a delete is allowed and whether it's a moderator action (triggers notification)
export function canDeleteCard(
  actorRole: Role,
  actorUserId: string,
  cardCreatedBy: string | null,
): { allowed: boolean; isModeratorAction: boolean } {
  const isOwner = cardCreatedBy === actorUserId;

  if (isOwner && hasPermission(actorRole, PERMISSIONS.DELETE_OWN_CARD)) {
    return { allowed: true, isModeratorAction: false };
  }

  if (hasPermission(actorRole, PERMISSIONS.DELETE_ANY_CARD)) {
    return { allowed: true, isModeratorAction: !isOwner };
  }

  return { allowed: false, isModeratorAction: false };
}
