import {
  CURATED_MIN,
  getTrashReason,
  resolveCriticScore,
  RT_ROTTEN_MAX,
  TRASH_MC_MAX,
} from "./filters";
import { hasAdequateCriticSample, SCORE_WEIGHTS } from "./score-blend";
import type { CuratedMovie, MovieScores } from "./types";

export const CRITIC_SUMMARY_LABEL = "평점 요약";
export const CRITIC_SUMMARY_NOTE = `LDJ ${SCORE_WEIGHTS.leeDongjin * 100}% · MC ${SCORE_WEIGHTS.metacritic * 100}% · RT ${SCORE_WEIGHTS.rottenTomatoes * 100}%`;

const LDJ_TRASH_MAX = 40;

function formatSourceScores(scores: MovieScores): string {
  const parts: string[] = [];
  if (scores.leeDongjin !== undefined) parts.push(`이동진 ${scores.leeDongjin}`);
  if (scores.metacritic !== undefined) parts.push(`MC ${scores.metacritic}`);
  if (scores.rottenTomatoes !== undefined) parts.push(`RT ${scores.rottenTomatoes}`);
  return parts.join(" · ");
}

function approvedSampleNote(scores: MovieScores): string {
  if (scores.metacritic !== undefined) return "MC 확보";
  return "소스 2개 이상";
}

function buildCuratedLine(movie: CuratedMovie): string {
  const blend = resolveCriticScore(movie) ?? 0;
  const sources = formatSourceScores(movie.scores);
  const sample = approvedSampleNote(movie.scores);

  let line = `블렌드 ${blend}점`;
  if (sources) line += ` (${sources})`;
  line += `. ${CURATED_MIN}점 이상·${sample} 기준으로 Approved에 포함돼요.`;

  return line;
}

function buildTrashLine(movie: CuratedMovie): string {
  const blend = resolveCriticScore(movie);
  const reason = getTrashReason(movie);
  const { metacritic, rottenTomatoes, leeDongjin } = movie.scores;
  const blendPrefix = blend !== null ? `블렌드 ${blend}점 · ` : "";

  switch (reason) {
    case "ldj_low":
      return `${blendPrefix}이동진 ${leeDongjin}점. ${LDJ_TRASH_MAX}점 이하 기준으로 Trash Cut이에요.`;
    case "mc_low":
      return `${blendPrefix}MC ${metacritic}점. ${TRASH_MC_MAX}점 이하 기준으로 Trash Cut이에요.`;
    case "rt_rotten":
      return `${blendPrefix}RT ${rottenTomatoes}%. MC 없음·${RT_ROTTEN_MAX}% 이하 기준으로 Trash Cut이에요.`;
    case "mc_rt_combo":
      return `${blendPrefix}MC ${metacritic} · RT ${rottenTomatoes}%. MC·RT 모두 낮아 Trash Cut이에요.`;
    default: {
      const sources = formatSourceScores(movie.scores);
      return sources
        ? `${blendPrefix}(${sources}). Trash Cut 분류 기준에 해당해요.`
        : "Trash Cut 분류 기준에 해당해요.";
    }
  }
}

export function generateTrashCriticLine(movie: CuratedMovie): string {
  return buildTrashLine(movie);
}

export function generateCriticLine(movie: CuratedMovie): string {
  if (!hasAdequateCriticSample(movie.scores)) {
    const blend = resolveCriticScore(movie);
    const sources = formatSourceScores(movie.scores);
    if (blend !== null && sources) {
      return `블렌드 ${blend}점 (${sources}). 평론 소스가 부족해 Approved에는 포함되지 않아요.`;
    }
  }
  return buildCuratedLine(movie);
}
