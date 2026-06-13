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

export const CRITIC_SUMMARY_LABEL = "점수 브리핑";
export const CRITIC_SUMMARY_NOTE = `LDJ ${SCORE_WEIGHTS.leeDongjin * 100}% · MC ${SCORE_WEIGHTS.metacritic * 100}% · RT ${SCORE_WEIGHTS.rottenTomatoes * 100}%`;

const LDJ_TRASH_MAX = 40;

function formatSourceScores(scores: MovieScores): string {
  const parts: string[] = [];
  if (scores.leeDongjin !== undefined) parts.push(`LDJ ${scores.leeDongjin}`);
  if (scores.metacritic !== undefined) parts.push(`MC ${scores.metacritic}`);
  if (scores.rottenTomatoes !== undefined) parts.push(`RT ${scores.rottenTomatoes}`);
  return parts.join(" · ");
}

function approvedSampleNote(scores: MovieScores): string {
  if (scores.metacritic !== undefined) return "MC 있음";
  return "소스 2+";
}

function moodAddendum(mood: string, movie: CuratedMovie): string | null {
  if (matchMood(mood, movie) <= 0) return null;
  const genre = movie.genres?.[0];
  if (genre) return `「${mood}」 × ${genre} 매칭.`;
  return `「${mood}」 키워드 매칭.`;
}

function buildCuratedLine(movie: CuratedMovie, mood?: string): string {
  const blend = resolveCriticScore(movie) ?? 0;
  const sources = formatSourceScores(movie.scores);
  const sample = approvedSampleNote(movie.scores);

  let line = `블렌드 ${blend}`;
  if (sources) line += ` (${sources})`;
  line += ` · ${CURATED_MIN}+ · ${sample} → Approved.`;

  const moodNote = mood ? moodAddendum(mood, movie) : null;
  if (moodNote) line += ` ${moodNote}`;

  return line;
}

function buildTrashLine(movie: CuratedMovie): string {
  const blend = resolveCriticScore(movie);
  const reason = getTrashReason(movie);
  const { metacritic, rottenTomatoes, leeDongjin } = movie.scores;
  const blendPrefix = blend !== null ? `블렌드 ${blend} · ` : "";

  switch (reason) {
    case "ldj_low":
      return `${blendPrefix}LDJ ${leeDongjin} · ${LDJ_TRASH_MAX}↓ → Trash Cut.`;
    case "mc_low":
      return `${blendPrefix}MC ${metacritic} · ${TRASH_MC_MAX}↓ → Trash Cut.`;
    case "rt_rotten":
      return `${blendPrefix}RT ${rottenTomatoes}% · MC 없음 · ${RT_ROTTEN_MAX}%↓ → Trash Cut.`;
    case "mc_rt_combo":
      return `${blendPrefix}MC ${metacritic} · RT ${rottenTomatoes}% · 둘 다 밀림 → Trash Cut.`;
    default: {
      const sources = formatSourceScores(movie.scores);
      return sources
        ? `${blendPrefix}(${sources}) · Trash Cut 기준 충족.`
        : "Trash Cut 기준 충족.";
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
      return `블렌드 ${blend} (${sources}) · 소스 부족 → Approved 제외.`;
    }
  }
  return buildCuratedLine(movie, mood);
}

export function generateAICriticLine(movie: CuratedMovie, mood?: string): string {
  return generateCriticLine(movie, mood);
}
