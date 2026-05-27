// OMDb API client — server-side only

const OMDB_BASE = "https://www.omdbapi.com";

export interface OMDbSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

interface OMDbDetail {
  imdbID: string;
  Title: string;
  Year: string;
  Genre: string;
  Director: string;
  Plot: string;
  Poster: string;
  Runtime: string;
  Response: string;
}

export interface NormalizedMovie {
  omdb_id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  genres: string[];
  runtime_minutes: number | null;
  overview: string | null;
  director: string | null;
}

function posterUrl(raw: string): string | null {
  return raw && raw !== "N/A" ? raw : null;
}

function na(s: string): string | null {
  return s && s !== "N/A" ? s : null;
}

export async function searchMovies(query: string): Promise<OMDbSearchResult[]> {
  const key = process.env.OMDB_API_KEY!;
  const res = await fetch(`${OMDB_BASE}/?s=${encodeURIComponent(query)}&apikey=${key}`);
  if (!res.ok) throw new Error(`OMDb search failed: ${res.status}`);
  const data = await res.json();
  if (data.Response === "False") return [];
  return (data.Search as OMDbSearchResult[]).slice(0, 8);
}

export async function getMovie(imdbId: string): Promise<NormalizedMovie | null> {
  const key = process.env.OMDB_API_KEY!;
  const res = await fetch(`${OMDB_BASE}/?i=${imdbId}&apikey=${key}`);
  if (!res.ok) return null;
  const data: OMDbDetail = await res.json();
  if (data.Response === "False") return null;

  const runtimeMatch = data.Runtime?.match(/(\d+)/);
  const yearMatch = data.Year?.match(/(\d{4})/);

  return {
    omdb_id: data.imdbID,
    title: data.Title,
    poster_url: posterUrl(data.Poster),
    release_year: yearMatch ? parseInt(yearMatch[1]) : null,
    genres: na(data.Genre) ? data.Genre.split(",").map(s => s.trim()) : [],
    runtime_minutes: runtimeMatch ? parseInt(runtimeMatch[1]) : null,
    overview: na(data.Plot),
    director: na(data.Director),
  };
}
