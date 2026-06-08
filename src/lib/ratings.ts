import type { CuratedMovie, MovieScores } from "./types";

const scoreCache = new Map<string, MovieScores & { fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface OMDbResponse {
  Response: string;
  Metascore?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Error?: string;
}

function getOmdbApiKey(): string | undefined {
  return process.env.OMDB_API_KEY || "trilogy";
}

function parseRottenTomatoes(ratings?: Array<{ Source: string; Value: string }>): number | undefined {
  const rt = ratings?.find((r) => r.Source === "Rotten Tomatoes");
  if (!rt) return undefined;
  const match = rt.Value.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : undefined;
}

function englishTitleFromPath(fullPath?: string): string | undefined {
  if (!fullPath) return undefined;
  const slug = fullPath.split("/").pop();
  if (!slug || /[가-힣]/.test(slug)) return undefined;
  return slug.replace(/-/g, " ");
}

async function fetchOMDb(params: URLSearchParams): Promise<MovieScores> {
  const apiKey = getOmdbApiKey();
  if (!apiKey) return {};

  params.set("apikey", apiKey);

  try {
    const res = await fetch(`https://www.omdbapi.com/?${params}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return {};

    const data = (await res.json()) as OMDbResponse;
    if (data.Response !== "True") return {};

    const metascore = data.Metascore && data.Metascore !== "N/A"
      ? parseInt(data.Metascore, 10)
      : undefined;

    return {
      metacritic: metascore,
      rottenTomatoes: parseRottenTomatoes(data.Ratings),
    };
  } catch {
    return {};
  }
}

async function fetchCriticScores(movie: CuratedMovie): Promise<MovieScores> {
  if (movie.imdbId) {
    const byImdb = await fetchOMDb(
      new URLSearchParams({ i: movie.imdbId, type: "movie" })
    );
    if (byImdb.metacritic || byImdb.rottenTomatoes) return byImdb;
  }

  const english = englishTitleFromPath(movie.fullPath);
  if (english) {
    const params = new URLSearchParams({ t: english, type: "movie" });
    if (movie.year) params.set("y", String(movie.year));
    const byEnglish = await fetchOMDb(params);
    if (byEnglish.metacritic || byEnglish.rottenTomatoes) return byEnglish;
  }

  const params = new URLSearchParams({ t: movie.title, type: "movie" });
  if (movie.year) params.set("y", String(movie.year));
  return fetchOMDb(params);
}

export async function enrichMovieScores(movie: CuratedMovie): Promise<CuratedMovie> {
  const cacheKey =
    movie.imdbId ?? `${movie.fullPath ?? movie.title}-${movie.year ?? "unknown"}`;
  const cached = scoreCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    const { fetchedAt: _, ...scores } = cached;
    return { ...movie, scores: { ...movie.scores, ...scores } };
  }

  const criticScores = await fetchCriticScores(movie);

  const enrichedScores: MovieScores = {
    ...movie.scores,
    metacritic: criticScores.metacritic ?? movie.scores.metacritic,
    rottenTomatoes: criticScores.rottenTomatoes ?? movie.scores.rottenTomatoes,
  };

  scoreCache.set(cacheKey, { ...enrichedScores, fetchedAt: Date.now() });

  return { ...movie, scores: enrichedScores };
}

export async function enrichMoviesScores(
  movies: CuratedMovie[],
  concurrency = 3,
  delayMs = 250
): Promise<CuratedMovie[]> {
  const enriched: CuratedMovie[] = [];

  for (let i = 0; i < movies.length; i += concurrency) {
    const batch = movies.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(enrichMovieScores));
    enriched.push(...results);
    if (i + concurrency < movies.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return enriched;
}
