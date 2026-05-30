export const PRESET_BADGES = [
  { slug: "og",        label: "OG Member"        },
  { slug: "hype",      label: "Hype Beast"       },
  { slug: "cinephile", label: "Cinephile"        },
  { slug: "gamer",     label: "Hardcore Gamer"   },
  { slug: "host",      label: "Event Host"       },
  { slug: "helper",    label: "Helper"           },
  { slug: "creative",  label: "Creative"         },
  { slug: "lurker",    label: "Certified Lurker" },
] as const;

export type BadgeSlug = typeof PRESET_BADGES[number]["slug"];
