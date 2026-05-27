// IGDB API client — server-side only (keeps client_secret safe)

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";

// Module-level token cache for the lifetime of the Vercel function instance
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.IGDB_CLIENT_ID!;
  const clientSecret = process.env.IGDB_CLIENT_SECRET!;

  const res = await fetch(
    `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!res.ok) throw new Error(`Twitch token request failed: ${res.status}`);

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export interface NormalizedGame {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  genres: string[];
  platforms: string[];
  is_multiplayer: boolean;
  summary: string | null;
}

interface IGDBGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  first_release_date?: number;
  genres?: { name: string }[];
  platforms?: { abbreviation?: string; name: string }[];
  game_modes?: { name: string }[];
  summary?: string;
}

function normalize(g: IGDBGame): NormalizedGame {
  return {
    igdb_id: g.id,
    title: g.name,
    cover_url: g.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : null,
    release_year: g.first_release_date
      ? new Date(g.first_release_date * 1000).getFullYear()
      : null,
    genres: g.genres?.map(x => x.name) ?? [],
    platforms: g.platforms?.map(x => x.abbreviation ?? x.name) ?? [],
    is_multiplayer: g.game_modes?.some(m => m.name === "Multiplayer") ?? false,
    summary: g.summary ?? null,
  };
}

export async function searchGames(query: string): Promise<NormalizedGame[]> {
  const token = await getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID!;

  // version_parent = null filters out game editions/ports and returns the main game entry
  const body = `search "${query}"; fields name,cover.image_id,first_release_date,genres.name,platforms.abbreviation,platforms.name,game_modes.name,summary; limit 10; where version_parent = null;`;

  const res = await fetch(`${IGDB_BASE}/games`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) throw new Error(`IGDB games request failed: ${res.status}`);

  const games: IGDBGame[] = await res.json();
  return games.map(normalize);
}
