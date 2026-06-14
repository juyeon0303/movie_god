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
