import type { CuratedMovie } from "./types";
import { pickEnrichedTitle } from "./title-display";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface TMDBMovieResponse {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  vote_average: number;
}

const tmdbCache = new Map<number, TMDBMovieResponse & { fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function parseTmdbIdFromJustWatchId(justwatchId: string): number | null {
  const match = justwatchId.match(/^tm(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchTmdbById(tmdbId: number): Promise<TMDBMovieResponse | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const cached = tmdbCache.get(tmdbId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    const { fetchedAt: _, ...data } = cached;
    return data;
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      language: "ko-KR",
    });

    const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as TMDBMovieResponse;
    tmdbCache.set(tmdbId, { ...data, fetchedAt: Date.now() });
    return data;
  } catch {
    return null;
  }
}

async function searchTmdbByTitle(title: string, year?: number): Promise<number | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      query: title,
      language: "ko-KR",
    });
    if (year) params.set("year", String(year));

    const res = await fetch(`${TMDB_BASE}/search/movie?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const first = data.results?.[0];
    return first?.id ?? null;
  } catch {
    return null;
  }
}

export async function enrichMovieWithTmdb(movie: CuratedMovie): Promise<CuratedMovie> {
  let tmdbId = movie.tmdbId ?? parseTmdbIdFromJustWatchId(movie.id);

  if (!tmdbId) {
    const searched = await searchTmdbByTitle(movie.title, movie.year);
    if (searched) tmdbId = searched;
  }

  if (!tmdbId) return movie;

  const details = await fetchTmdbById(tmdbId);
  if (!details) return { ...movie, tmdbId };

  const posterUrl = details.poster_path
    ? `${TMDB_IMAGE_BASE}${details.poster_path}`
    : movie.posterUrl;

  return {
    ...movie,
    tmdbId,
    title: pickEnrichedTitle(movie.title, details.title),
    overview: details.overview || movie.description,
    description: details.overview || movie.description,
    genres: details.genres.map((g) => g.name),
    releaseDate: details.release_date || undefined,
    posterUrl,
    scores: movie.scores,
  };
}

export async function enrichMoviesWithTmdb(
  movies: CuratedMovie[],
  concurrency = 5
): Promise<CuratedMovie[]> {
  if (!process.env.TMDB_API_KEY) return movies;

  const enriched: CuratedMovie[] = [];

  for (let i = 0; i < movies.length; i += concurrency) {
    const batch = movies.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(enrichMovieWithTmdb));
    enriched.push(...results);
  }

  return enriched;
}
