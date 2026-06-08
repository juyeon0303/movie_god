import {
  CURATED_MIN,
  getTrashReason,
  matchMood,
  resolveCriticScore,
  RT_ROTTEN_MAX,
  TRASH_MC_MAX,
  TRASH_MC_RT_COMBO_MAX,
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

function moodAddendum(mood: string, movie: CuratedMovie): string | null {
  if (matchMood(mood, movie) <= 0) return null;
  const genre = movie.genres?.[0];
  if (genre) return `「${mood}」 무드와 ${genre} 장르가 맞아요.`;
  return `「${mood}」 무드 키워드와 맞아요.`;
}

function buildCuratedLine(movie: CuratedMovie, mood?: string): string {
  const blend = resolveCriticScore(movie) ?? 0;
  const sources = formatSourceScores(movie.scores);
  const sample = approvedSampleNote(movie.scores);

  let line = `블렌드 ${blend}점`;
  if (sources) line += ` (${sources})`;
  line += `. ${CURATED_MIN}점 이상·${sample} 기준으로 Approved.`;

  const moodNote = mood ? moodAddendum(mood, movie) : null;
  if (moodNote) line += ` ${moodNote}`;

  return line;
}

function buildTrashLine(movie: CuratedMovie): string {
  const blend = resolveCriticScore(movie);
  const reason = getTrashReason(movie);
  const { metacritic, rottenTomatoes, leeDongjin } = movie.scores;
  const blendPrefix = blend !== null ? `블렌드 ${blend}점 · ` : "";

  switch (reason) {
    case "ldj_low":
      return `${blendPrefix}이동진 ${leeDongjin}. ${LDJ_TRASH_MAX}점 이하 기준으로 Trash Cut.`;
    case "mc_low":
      return `${blendPrefix}MC ${metacritic}. ${TRASH_MC_MAX}점 이하 기준으로 Trash Cut.`;
    case "rt_rotten":
      return `${blendPrefix}RT ${rottenTomatoes}%. MC 없음·${RT_ROTTEN_MAX}% 이하 기준으로 Trash Cut.`;
    case "mc_rt_combo":
      return `${blendPrefix}MC ${metacritic} · RT ${rottenTomatoes}%. MC ${TRASH_MC_RT_COMBO_MAX} 이하·RT ${RT_ROTTEN_MAX}% 이하 기준으로 Trash Cut.`;
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

export function generateCriticLine(movie: CuratedMovie, mood?: string): string {
  if (!hasAdequateCriticSample(movie.scores)) {
    const blend = resolveCriticScore(movie);
    const sources = formatSourceScores(movie.scores);
    if (blend !== null && sources) {
      return `블렌드 ${blend}점 (${sources}). 평론가 소스가 부족해 Approved에는 포함되지 않아요.`;
    }
  }
  return buildCuratedLine(movie, mood);
}

/** @deprecated OpenAI 대신 점수·분류 규칙 기반 한줄평 사용 */
export function generateAICriticLine(movie: CuratedMovie, mood?: string): string {
  return generateCriticLine(movie, mood);
}
