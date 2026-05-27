// RAWG API client — server-side only

const RAWG_BASE = "https://api.rawg.io/api";

export interface NormalizedGame {
  rawg_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  genres: string[];
  platforms: string[];
  is_multiplayer: boolean;
  summary: string | null;
}

interface RAWGGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  genres: { name: string }[];
  platforms: { platform: { name: string } }[] | null;
  description_raw?: string;
}

function normalize(g: RAWGGame): NormalizedGame {
  return {
    rawg_id: g.id,
    title: g.name,
    cover_url: g.background_image ?? null,
    release_year: g.released ? parseInt(g.released.split("-")[0]) : null,
    genres: g.genres?.map(x => x.name) ?? [],
    platforms: g.platforms?.map(x => x.platform.name) ?? [],
    is_multiplayer: false,
    summary: g.description_raw?.slice(0, 400) ?? null,
  };
}

export async function searchGames(query: string): Promise<NormalizedGame[]> {
  const key = process.env.RAWG_API_KEY!;
  const res = await fetch(
    `${RAWG_BASE}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=10&search_precise=true`
  );
  if (!res.ok) throw new Error(`RAWG search failed: ${res.status}`);
  const data = await res.json();
  return ((data.results as RAWGGame[]) ?? []).map(normalize);
}

export async function getGame(rawgId: number): Promise<NormalizedGame | null> {
  const key = process.env.RAWG_API_KEY!;
  const res = await fetch(`${RAWG_BASE}/games/${rawgId}?key=${key}`);
  if (!res.ok) return null;
  const data: RAWGGame = await res.json();
  return normalize(data);
}
