import { classifyMovie, type MovieTier } from "./filters";
import { generateCriticLine, generateTrashCriticLine } from "./critic";
import { ALL_PLATFORMS } from "./snapshot-types";
import { readTieredMovies, SnapshotNotFoundError } from "./snapshot-read";
import type { CuratedMovie, OTTPlatform } from "./types";

export interface MovieSearchHit {
  movie: CuratedMovie;
  tier: MovieTier;
  platform: OTTPlatform;
  criticLine: string;
  matchScore: number;
}

export interface MovieSearchResponse {
  query: string;
  results: MovieSearchHit[];
  platform: OTTPlatform | "all";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·.,!?'"()[\]{}:;/-]+/g, "");
}

function englishSlugFromPath(fullPath?: string): string | undefined {
  if (!fullPath) return undefined;
  const slug = fullPath.split("/").pop();
  if (!slug || /[가-힣]/.test(slug)) return undefined;
  return slug.replace(/-/g, " ");
}

function matchScore(query: string, movie: CuratedMovie): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeText(movie.title);
  const english = englishSlugFromPath(movie.fullPath);
  const normalizedEnglish = english ? normalizeText(english) : "";

  if (title === normalizedQuery || normalizedEnglish === normalizedQuery) return 100;
  if (title.startsWith(normalizedQuery) || normalizedEnglish.startsWith(normalizedQuery)) {
    return 90;
  }
  if (title.includes(normalizedQuery) || normalizedEnglish.includes(normalizedQuery)) {
    return 75;
  }

  const queryTokens = query
    .trim()
    .split(/\s+/)
    .map(normalizeText)
    .filter((token) => token.length >= 2);
  if (queryTokens.length === 0) return 0;

  const haystack = `${title} ${normalizedEnglish}`;
  const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
  if (matchedTokens.length === 0) return 0;

  return 40 + (matchedTokens.length / queryTokens.length) * 30;
}

function criticLineForTier(movie: CuratedMovie, tier: MovieTier): string {
  if (tier === "trash") return generateTrashCriticLine(movie);
  return generateCriticLine(movie);
}

export function searchMoviesInPool(
  query: string,
  movies: CuratedMovie[],
  limit = 12
): MovieSearchHit[] {
  const scored = movies
    .map((movie) => ({
      movie,
      tier: classifyMovie(movie),
      platform: movie.platform,
      matchScore: matchScore(query, movie),
    }))
    .filter((row) => row.matchScore > 0)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.movie.title.localeCompare(b.movie.title, "ko");
    })
    .slice(0, limit)
    .map((row) => ({
      movie: row.movie,
      tier: row.tier,
      platform: row.platform,
      matchScore: row.matchScore,
      criticLine: criticLineForTier(row.movie, row.tier),
    }));

  return scored;
}

export async function searchMoviesAcrossPlatforms(
  query: string,
  platformFilter?: OTTPlatform
): Promise<MovieSearchResponse> {
  const platforms = platformFilter ? [platformFilter] : ALL_PLATFORMS;
  const hits: MovieSearchHit[] = [];
  const seen = new Set<string>();

  for (const platform of platforms) {
    try {
      const { all } = await readTieredMovies(platform);
      for (const hit of searchMoviesInPool(query, all, 12)) {
        const key = `${hit.platform}:${hit.movie.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(hit);
      }
    } catch (error) {
      if (!(error instanceof SnapshotNotFoundError)) throw error;
    }
  }

  hits.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.movie.title.localeCompare(b.movie.title, "ko");
  });

  return {
    query,
    results: hits.slice(0, 12),
    platform: platformFilter ?? "all",
  };
}
