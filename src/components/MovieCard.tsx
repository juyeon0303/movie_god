"use client";

import { useState } from "react";
import type { CuratedMovie } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { getTrashReason, isRottenTomatoes, resolveCriticScore } from "@/lib/filters";

interface MovieCardProps {
  movie: CuratedMovie;
  showCritic?: boolean;
  hellMode?: boolean;
}

function ScoreBadge({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value === undefined) return null;
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label} {value}
    </span>
  );
}

const TRASH_REASON_LABEL = {
  mc_low: "MC 핵쓰레기",
  rt_rotten: "RT Rotten",
  mc_rt_combo: "MC+RT 혹평",
  ldj_low: "이동진 혹평",
} as const;

export function MovieCard({ movie, showCritic = false, hellMode = false }: MovieCardProps) {
  const [watchWarn, setWatchWarn] = useState(false);
  const platformColor = PLATFORMS[movie.platform]?.color ?? "#888";
  const criticScore = resolveCriticScore(movie);
  const hasCriticScore = criticScore !== null;
  const isTrash = hellMode || movie.isTrash;
  const trashReason = isTrash ? getTrashReason(movie) : null;

  function handleWatchClick(e: React.MouseEvent) {
    if (!isTrash) return;
    e.preventDefault();
    setWatchWarn(true);
  }

  return (
    <article
      className={`group overflow-hidden rounded-2xl border transition-all ${
        isTrash
          ? "hell-card border-red-500/40 bg-red-950/25 hover:border-red-400/60 hover:bg-red-950/35"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isTrash ? "saturate-[0.7] contrast-[1.1]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            No Poster
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: platformColor }}
          >
            {movie.platformName}
          </span>
          {movie.ottVerified && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              ✓ OTT 확인
            </span>
          )}
          {trashReason && (
            <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
              {TRASH_REASON_LABEL[trashReason]}
            </span>
          )}
        </div>
        {isTrash && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/50">
            <span className="trash-stamp rotate-[-12deg] rounded border-2 border-red-400 bg-red-950/90 px-4 py-2 text-lg font-black uppercase tracking-widest text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.6)]">
              TRASH
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className={`text-lg font-semibold ${isTrash ? "text-red-100" : "text-white"}`}>
          {movie.title}
          {movie.year && (
            <span className={`ml-2 text-sm font-normal ${isTrash ? "text-red-300/50" : "text-zinc-500"}`}>
              {movie.year}
            </span>
          )}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <ScoreBadge label="MC" value={movie.scores.metacritic} color="#66cc33" />
          <ScoreBadge label="RT" value={movie.scores.rottenTomatoes} color="#fa320a" />
          {movie.scores.leeDongjin !== undefined && (
            <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-300">
              이동진 {movie.scores.leeDongjin}
            </span>
          )}
          {isRottenTomatoes(movie) && (
            <span className="rounded-md bg-red-600/30 px-2 py-0.5 text-xs font-bold text-red-300">
              Rotten
            </span>
          )}
          {hasCriticScore ? (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isTrash ? "bg-red-500/20 text-red-300" : "bg-amber-500/10 text-amber-300"
              }`}
            >
              평론가 {criticScore}
            </span>
          ) : (
            <span className="text-xs text-zinc-600">평론가 점수 없음</span>
          )}
        </div>

        {movie.genres && movie.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {movie.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isTrash ? "bg-red-900/40 text-red-200/60" : "bg-white/5 text-zinc-400"
                }`}
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {(movie.overview || movie.description) && (
          <p className={`mt-3 line-clamp-2 text-sm leading-relaxed ${isTrash ? "text-red-200/50" : "text-zinc-400"}`}>
            {movie.overview || movie.description}
          </p>
        )}

        {showCritic && movie.criticLine && (
          <blockquote
            className={`mt-3 border-l-2 pl-3 text-sm italic leading-relaxed ${
              isTrash ? "border-red-400/60 text-red-200/90" : "border-amber-400/50 text-amber-200/80"
            }`}
          >
            {isTrash ? `💀 ${movie.criticLine}` : movie.criticLine}
          </blockquote>
        )}

        {movie.ottVerified && movie.watchUrl && (
          <>
            <a
              href={movie.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWatchClick}
              className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isTrash
                  ? "text-red-400 hover:text-red-300"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              {isTrash ? "⚠️ 그래도 보러 감 (후회 각오)" : `${movie.platformName}에서 시청하기 →`}
            </a>
            {watchWarn && (
              <div className="mt-3 rounded-lg border border-red-500/50 bg-red-950/60 p-3 text-xs text-red-200">
                <p className="font-bold">돈과 시간을 버리시겠습니까?</p>
                <div className="mt-2 flex gap-2">
                  <a
                    href={movie.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-500"
                  >
                    각오함
                  </a>
                  <button
                    type="button"
                    onClick={() => setWatchWarn(false)}
                    className="rounded border border-white/20 px-3 py-1.5 text-white hover:bg-white/10"
                  >
                    안 봄
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
