"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { MovieSearchHit } from "@/lib/movie-search";
import { resolveCriticScore } from "@/lib/filters";
import { PLATFORMS } from "@/lib/types";

const TIER_LABEL = {
  curated: { text: "Approved", className: "border-emerald/40 bg-emerald/10 text-emerald" },
  trash: { text: "Trash Cut", className: "border-laser/40 bg-laser/10 text-laser" },
  neutral: { text: "분류 없음", className: "border-panel-border bg-surface-raised text-panel-muted" },
} as const;

interface SearchResultCardProps {
  hit: MovieSearchHit;
}

export function SearchResultCard({ hit }: SearchResultCardProps) {
  const [watchWarn, setWatchWarn] = useState(false);
  const { movie, tier, criticLine, matchReason } = hit;
  const tierLabel = TIER_LABEL[tier];
  const isTrash = tier === "trash";
  const blend = resolveCriticScore(movie);

  function handleWatchClick(e: React.MouseEvent) {
    if (!isTrash) return;
    e.preventDefault();
    setWatchWarn(true);
  }

  return (
    <article
      className={`border bg-surface p-3 sm:p-4 ${
        isTrash ? "border-laser/25" : "border-panel-border"
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="relative h-28 w-20 shrink-0 overflow-hidden bg-surface-raised sm:h-32 sm:w-24">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className={`h-full w-full object-cover ${isTrash ? "saturate-[0.8]" : ""}`}
            />
          ) : (
            <div className="font-ui flex h-full items-center justify-center px-1 text-center text-[11px] text-panel-muted">
              포스터 없음
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-ui border px-2 py-0.5 text-[11px] font-semibold ${tierLabel.className}`}
            >
              {tierLabel.text}
            </span>
            <span
              className="font-ui text-xs font-semibold"
              style={{ color: PLATFORMS[hit.platform].color }}
            >
              {PLATFORMS[hit.platform].name}
            </span>
            {movie.year && (
              <span className="font-ui text-xs text-panel-muted">{movie.year}</span>
            )}
          </div>

          <h3 className="mt-2 text-sm font-semibold leading-snug text-panel-ink sm:text-base">
            {movie.title}
          </h3>

          {matchReason && (
            <p className="font-ui mt-1 text-xs text-panel-muted">{matchReason}</p>
          )}

          <div className="font-ui mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-panel-muted">
            {blend !== null && <span>Blend {blend}</span>}
            {movie.scores.metacritic !== undefined && <span>MC {movie.scores.metacritic}</span>}
            {movie.scores.rottenTomatoes !== undefined && (
              <span>RT {movie.scores.rottenTomatoes}</span>
            )}
            {movie.scores.leeDongjin !== undefined && (
              <span>이동진 {movie.scores.leeDongjin}</span>
            )}
          </div>

          {criticLine && (
            <p className="font-ui mt-2 line-clamp-2 text-xs leading-relaxed text-panel-ink/85 sm:line-clamp-3 sm:text-sm">
              {criticLine}
            </p>
          )}

          {movie.ottVerified && movie.watchUrl && !watchWarn && (
            <a
              href={movie.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWatchClick}
              className={`font-ui mt-3 inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold ${
                isTrash
                  ? "border-laser/50 bg-laser/10 text-laser hover:bg-laser/15"
                  : "border-emerald/50 bg-emerald/10 text-emerald hover:bg-emerald/15"
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {isTrash ? "OTT에서 보기" : "시청하기"}
            </a>
          )}

          {watchWarn && movie.watchUrl && (
            <div className="mt-3 border border-laser/30 bg-laser/5 p-2.5">
              <p className="font-ui text-xs text-panel-muted">
                Trash Cut에 포함된 작품이에요. 그래도 시청하시겠어요?
              </p>
              <div className="mt-2 flex gap-2">
                <a
                  href={movie.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui flex-1 border border-laser bg-laser/15 py-1.5 text-center text-xs font-semibold text-laser hover:bg-laser/20"
                >
                  시청하기
                </a>
                <button
                  type="button"
                  onClick={() => setWatchWarn(false)}
                  className="font-ui flex-1 border border-panel-border py-1.5 text-xs text-panel-muted hover:text-panel-ink"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
