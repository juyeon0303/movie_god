import {
  blendCriticScore,
  hasAnyCriticInput,
  hasAdequateCriticSample,
} from "./score-blend";
import type { CuratedMovie, CurationFilters } from "./types";

export const DEFAULT_MIN_RT = 85;
export const CURATED_MIN = 75;
/** Metacritic 단독 Trash Cut 컷 */
export const TRASH_MC_MAX = 45;
/** Rotten Tomatoes Rotten 배지 (60% 미만) */
export const RT_ROTTEN_MAX = 59;
/** MC·RT 동시 혹평 시 지옥행 MC 상한 — 50~60대 팝콘 무비는 RT Fresh면 중립 */
export const TRASH_MC_RT_COMBO_MAX = 55;

/** @deprecated TRASH_MC_MAX 사용 */
export const TRASH_THRESHOLD = TRASH_MC_MAX;

export type MovieTier = "curated" | "trash" | "neutral";
export type TrashReason = "mc_low" | "rt_rotten" | "mc_rt_combo" | "ldj_low";

/** 블렌드 평론가 점수 — 이동진·MC·RT 가중 평균 */
export function resolveCriticScore(movie: CuratedMovie): number | null {
  return blendCriticScore(movie.scores);
}

export function hasCriticScore(movie: CuratedMovie): boolean {
  return hasAnyCriticInput(movie.scores);
}

/** 평론가 점수 없는 작품 제외 — 인기도로 끼어든 작품 차단 */
export function onlyCriticScored(movies: CuratedMovie[]): CuratedMovie[] {
  return movies.filter(hasCriticScore);
}

/** @deprecated resolveCriticScore 사용 */
export function resolveQualityScore(movie: CuratedMovie): number | null {
  return resolveCriticScore(movie);
}

export function isRottenTomatoes(movie: CuratedMovie): boolean {
  const rt = movie.scores.rottenTomatoes;
  return rt !== undefined && rt <= RT_ROTTEN_MAX;
}

/** 지옥행 판정 — MC 45↓ 단독, RT Rotten 단독, MC·RT 동시 혹평 */
export function getTrashReason(movie: CuratedMovie): TrashReason | null {
  const { metacritic, rottenTomatoes, leeDongjin } = movie.scores;

  if (leeDongjin !== undefined && leeDongjin <= 40) {
    return "ldj_low";
  }

  if (metacritic !== undefined && metacritic <= TRASH_MC_MAX) {
    return "mc_low";
  }

  if (
    metacritic === undefined &&
    rottenTomatoes !== undefined &&
    rottenTomatoes <= RT_ROTTEN_MAX
  ) {
    return "rt_rotten";
  }

  if (
    metacritic !== undefined &&
    metacritic <= TRASH_MC_RT_COMBO_MAX &&
    rottenTomatoes !== undefined &&
    rottenTomatoes <= RT_ROTTEN_MAX
  ) {
    return "mc_rt_combo";
  }

  return null;
}

export function isTrashMovie(movie: CuratedMovie): boolean {
  return getTrashReason(movie) !== null;
}

/** 영화를 단 하나의 등급으로만 분류 — curated/trash 동시 소속 불가 */
export function classifyMovie(movie: CuratedMovie): MovieTier {
  const score = resolveCriticScore(movie);
  if (score === null) return "neutral";
  if (score >= CURATED_MIN && hasAdequateCriticSample(movie.scores)) return "curated";
  if (isTrashMovie(movie)) return "trash";
  return "neutral";
}

export function passesCurationFilter(movie: CuratedMovie): boolean {
  return classifyMovie(movie) === "curated";
}

export function isTrash(movie: CuratedMovie): boolean {
  return classifyMovie(movie) === "trash";
}

function assertNoTierOverlap(movies: CuratedMovie[], mode: string): void {
  if (process.env.NODE_ENV === "production") return;
  const ids = new Set<string>();
  for (const m of movies) {
    if (ids.has(m.id)) {
      console.warn(`[filters] duplicate id in ${mode}: ${m.id} ${m.title}`);
    }
    ids.add(m.id);
  }
}

export function applyFilters(
  movies: CuratedMovie[],
  filters: CurationFilters
): CuratedMovie[] {
  const platformFiltered = movies.filter((m) => m.platform === filters.platform);

  switch (filters.mode) {
    case "curated": {
      const result = platformFiltered
        .filter((m) => classifyMovie(m) === "curated")
        .sort((a, b) => (resolveCriticScore(b) ?? 0) - (resolveCriticScore(a) ?? 0));
      assertNoTierOverlap(result, "curated");
      return result;
    }

    case "trash": {
      const result = platformFiltered
        .filter((m) => classifyMovie(m) === "trash")
        .map((m) => ({ ...m, isTrash: true }))
        .sort((a, b) => (resolveCriticScore(a) ?? 100) - (resolveCriticScore(b) ?? 100));
      assertNoTierOverlap(result, "trash");
      return result;
    }

    case "all":
    default:
      return platformFiltered
        .filter(hasCriticScore)
        .sort((a, b) => (resolveCriticScore(b) ?? 0) - (resolveCriticScore(a) ?? 0));
  }
}

/** curated·trash 목록 간 교집합 검사 (개발 시 경고) */
export function findTierOverlap(
  curated: CuratedMovie[],
  trash: CuratedMovie[]
): CuratedMovie[] {
  const trashIds = new Set(trash.map((m) => m.id));
  return curated.filter((m) => trashIds.has(m.id));
}

const MOOD_TO_GENRES: Record<string, string[]> = {
  스릴러: ["스릴러", "미스터리", "범죄"],
  미스터리: ["미스터리", "스릴러", "범죄"],
  코미디: ["코미디"],
  웃: ["코미디"],
  로맨스: ["로맨스", "드라마"],
  사랑: ["로맨스", "드라마"],
  멜로: ["로맨스", "드라마"],
  공포: ["공포", "스릴러"],
  호러: ["공포", "스릴러"],
  액션: ["액션"],
  잔잔: ["드라마", "로맨스"],
  힐링: ["드라마", "가족", "코미디"],
  우울: ["드라마"],
  비: ["드라마", "로맨스"],
  와인: ["드라마", "로맨스"],
  혼자: ["드라마"],
  감동: ["드라마", "가족"],
  씁쓸: ["드라마", "범죄"],
  위로: ["드라마", "가족", "코미디"],
  뒤통수: ["스릴러", "미스터리"],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  rain: ["melancholy", "drama", "romance", "slow", "atmospheric", "비", "우울", "감성", "드라마"],
  비: ["드라마", "로맨스", "감성", "잔잔", "슬픔", "외로"],
  우울: ["드라마", "감동", "슬픔", "외로", "감성"],
  스릴러: ["스릴러", "미스터리", "범죄", "긴장", "추격", "살인"],
  코미디: ["코미디", "웃음", "유쾌", "가벼"],
  로맨스: ["로맨스", "사랑", "멜로", "감성"],
  공포: ["공포", "호러", "무서", "공포"],
  잔잔: ["드라마", "로맨스", "힐링", "고요"],
  액션: ["액션", "스릴", "추격", "폭발"],
  와인: ["드라마", "로맨스", "감성", "우아"],
  혼자: ["드라마", "인물", "내면", "고독"],
  씁쓸: ["드라마", "범죄", "복수", "인생"],
  감동: ["드라마", "가족", "감동", "눈물"],
  위로: ["드라마", "가족", "힐링", "따뜻"],
  뒤통수: ["스릴러", "미스터리", "반전", "충격"],
};

function inferGenresFromMood(mood: string): string[] {
  const genres = new Set<string>();
  for (const [keyword, mapped] of Object.entries(MOOD_TO_GENRES)) {
    if (mood.includes(keyword)) mapped.forEach((g) => genres.add(g));
  }
  return [...genres];
}

function movieRatingScore(movie: CuratedMovie): number {
  return resolveCriticScore(movie) ?? 0;
}

function movieSearchText(movie: CuratedMovie): string {
  const parts = [
    movie.title,
    movie.overview,
    movie.description,
    ...(movie.genres ?? []),
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

export function matchMood(mood: string, movie: CuratedMovie): number {
  const searchText = movieSearchText(movie);
  const moodLower = mood.toLowerCase();
  let score = 0;

  for (const [keyword, tags] of Object.entries(MOOD_KEYWORDS)) {
    if (moodLower.includes(keyword)) {
      for (const tag of tags) {
        if (searchText.includes(tag.toLowerCase())) score += 2;
      }
      score += 1;
    }
  }

  for (const genre of movie.genres ?? []) {
    if (moodLower.includes(genre.toLowerCase())) score += 4;
  }

  const moodWords = moodLower.split(/\s+/).filter((w) => w.length > 1);
  for (const word of moodWords) {
    if (searchText.includes(word)) score += 3;
  }

  if (passesCurationFilter(movie)) score += 1;

  return score;
}

export interface MoodMatchResult {
  movies: CuratedMovie[];
  fallback: boolean;
}

export function filterByMood(
  movies: CuratedMovie[],
  mood: string,
  limit = 8
): MoodMatchResult {
  const scored = movies
    .map((m) => ({ movie: m, score: matchMood(mood, m) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return {
      movies: scored.slice(0, limit).map(({ movie }) => movie),
      fallback: false,
    };
  }

  const targetGenres = inferGenresFromMood(mood);
  if (targetGenres.length > 0) {
    const genreMatched = movies
      .filter((m) => m.genres?.some((g) => targetGenres.some((tg) => g.includes(tg))))
      .sort((a, b) => movieRatingScore(b) - movieRatingScore(a))
      .slice(0, limit);

    if (genreMatched.length > 0) {
      return { movies: genreMatched, fallback: true };
    }
  }

  return {
    movies: [...movies]
      .sort((a, b) => movieRatingScore(b) - movieRatingScore(a))
      .slice(0, Math.min(4, limit)),
    fallback: true,
  };
}
