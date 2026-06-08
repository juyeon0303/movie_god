import type { MovieScores } from "./types";

/** 이동진 35% · MC 40% · RT 25% (있는 항목만 재정규화) */
export const SCORE_WEIGHTS = {
  leeDongjin: 0.35,
  metacritic: 0.4,
  rottenTomatoes: 0.25,
} as const;

export function blendCriticScore(scores: MovieScores): number | null {
  const parts: { score: number; weight: number }[] = [];

  if (scores.leeDongjin !== undefined) {
    parts.push({ score: scores.leeDongjin, weight: SCORE_WEIGHTS.leeDongjin });
  }
  if (scores.metacritic !== undefined) {
    parts.push({ score: scores.metacritic, weight: SCORE_WEIGHTS.metacritic });
  }
  if (scores.rottenTomatoes !== undefined) {
    parts.push({ score: scores.rottenTomatoes, weight: SCORE_WEIGHTS.rottenTomatoes });
  }

  if (parts.length === 0) return null;

  const total = parts.reduce((s, p) => s + p.weight, 0);
  const blended = parts.reduce((s, p) => s + p.score * (p.weight / total), 0);
  return Math.round(blended);
}

export function hasAnyCriticInput(scores: MovieScores): boolean {
  return (
    scores.leeDongjin !== undefined ||
    scores.metacritic !== undefined ||
    scores.rottenTomatoes !== undefined
  );
}
