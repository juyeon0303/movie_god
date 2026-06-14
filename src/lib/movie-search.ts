import { classifyMovie, type MovieTier } from "./filters";
import {
  getSearchIndexEntry,
  lookupDirectorImdbIds,
} from "./search-index";
import { ALL_PLATFORMS } from "./snapshot-types";
import { readTieredMovies, SnapshotNotFoundError } from "./snapshot-read";
import type { CuratedMovie, OTTPlatform } from "./types";

export interface MovieSearchHit {
  movie: CuratedMovie;
  tier: MovieTier;
  platform: OTTPlatform;
  matchScore: number;
  matchReason?: string;
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

function titleWordScore(normalizedQuery: string, title: string): number {
  const normalizedTitle = normalizeText(title);
  if (normalizedTitle === normalizedQuery) return 100;
  if (normalizedTitle.startsWith(normalizedQuery)) return 90;
  if (normalizedTitle.includes(normalizedQuery)) return 78;

  for (const segment of title.split(/\s+/)) {
    const normalizedSegment = normalizeText(segment);
    if (!normalizedSegment) continue;
    if (normalizedSegment === normalizedQuery) return 88;
    if (normalizedSegment.startsWith(normalizedQuery)) return 84;
    if (normalizedQuery.length >= 2 && normalizedSegment.includes(normalizedQuery)) {
      return 80;
    }
  }

  return 0;
}

function buildHaystack(movie: CuratedMovie): string {
  const index = getSearchIndexEntry(movie);
  const english = englishSlugFromPath(movie.fullPath);
  const parts = [
    movie.title,
    english,
    index?.englishTitle,
    ...(index?.aliases ?? []),
    ...(index?.directors ?? []),
    ...(movie.genres ?? []),
    movie.overview,
    movie.description,
  ];
  return parts.filter(Boolean).join(" ");
}

function metadataScore(normalizedQuery: string, movie: CuratedMovie): number {
  const index = getSearchIndexEntry(movie);
  if (!index) return 0;

  let score = 0;

  if (index.englishTitle) {
    const english = normalizeText(index.englishTitle);
    if (english === normalizedQuery) score = Math.max(score, 98);
    else if (english.startsWith(normalizedQuery)) score = Math.max(score, 92);
    else if (english.includes(normalizedQuery)) score = Math.max(score, 86);
  }

  for (const alias of index.aliases ?? []) {
    const normalizedAlias = normalizeText(alias);
    if (normalizedAlias === normalizedQuery) score = Math.max(score, 96);
    else if (normalizedAlias.includes(normalizedQuery)) score = Math.max(score, 84);
  }

  for (const director of index.directors ?? []) {
    const normalizedDirector = normalizeText(director);
    if (normalizedDirector === normalizedQuery) score = Math.max(score, 88);
    else if (normalizedDirector.includes(normalizedQuery)) score = Math.max(score, 82);
  }

  return score;
}

function matchReasonForScore(
  score: number,
  movie: CuratedMovie,
  normalizedQuery: string
): string | undefined {
  const index = getSearchIndexEntry(movie);
  if (index?.englishTitle && normalizeText(index.englishTitle).includes(normalizedQuery)) {
    return `영문 제목: ${index.englishTitle}`;
  }
  if (index?.directors?.some((name) => normalizeText(name).includes(normalizedQuery))) {
    return `감독: ${index.directors.join(", ")}`;
  }
  if (score >= 80) return "제목 일치";
  return undefined;
}

function matchScore(query: string, movie: CuratedMovie): number {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery || normalizedQuery.length < 2) return 0;

  let score = titleWordScore(normalizedQuery, movie.title);
  score = Math.max(score, metadataScore(normalizedQuery, movie));

  const english = englishSlugFromPath(movie.fullPath);
  if (english) {
    const normalizedEnglish = normalizeText(english);
    if (normalizedEnglish === normalizedQuery) score = Math.max(score, 94);
    else if (normalizedEnglish.startsWith(normalizedQuery)) score = Math.max(score, 88);
    else if (normalizedEnglish.includes(normalizedQuery)) score = Math.max(score, 82);
  }

  const haystack = normalizeText(buildHaystack(movie));
  if (haystack.includes(normalizedQuery)) {
    score = Math.max(score, 68);
  }

  const queryTokens = query
    .trim()
    .split(/\s+/)
    .map(normalizeText)
    .filter((token) => token.length >= 2);

  if (queryTokens.length > 0) {
    const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
    if (matchedTokens.length > 0) {
      score = Math.max(
        score,
        52 + (matchedTokens.length / queryTokens.length) * 24
      );
    }
  }

  if (movie.imdbId && lookupDirectorImdbIds(query).includes(movie.imdbId)) {
    score = Math.max(score, 86);
  }

  return score;
}

export function searchMoviesInPool(
  query: string,
  movies: CuratedMovie[],
  limit = 12
): MovieSearchHit[] {
  const normalizedQuery = normalizeText(query.trim());

  const scored = movies
    .map((movie) => {
      const score = matchScore(query, movie);
      return {
        movie,
        tier: classifyMovie(movie),
        platform: movie.platform,
        matchScore: score,
      };
    })
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
      matchReason: matchReasonForScore(row.matchScore, row.movie, normalizedQuery),
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
