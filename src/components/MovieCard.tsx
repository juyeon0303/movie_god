"use client";

import { useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import type { CuratedMovie } from "@/lib/types";
import { CRITIC_SUMMARY_LABEL, CRITIC_SUMMARY_NOTE } from "@/lib/critic";
import { getTrashReason, resolveCriticScore } from "@/lib/filters";

interface MovieCardProps {
  movie: CuratedMovie;
  showCritic?: boolean;
  hellMode?: boolean;
}

const TRASH_REASON_LABEL = {
  mc_low: "MC↓",
  rt_rotten: "RT↓",
  mc_rt_combo: "MC·RT↓",
  ldj_low: "LDJ↓",
} as const;

function ScoreBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value?: number;
  accent: "emerald" | "laser";
}) {
  if (value === undefined) return null;
  const color = accent === "laser" ? "text-laser" : "text-emerald";

  return (
    <div className="flex flex-col">
      <span className={`font-mono text-3xl font-bold leading-none ${color}`}>{value}</span>
      <span className="font-ui mt-0.5 text-xs font-medium text-panel-muted">{label}</span>
    </div>
  );
}

export function MovieCard({ movie, showCritic = false, hellMode = false }: MovieCardProps) {
  const [watchWarn, setWatchWarn] = useState(false);
  const [slashKey, setSlashKey] = useState(0);
  const criticScore = resolveCriticScore(movie);
  const isTrash = hellMode || movie.isTrash;
  const trashReason = isTrash ? getTrashReason(movie) : null;
  const accent = isTrash ? "laser" : "emerald";

  function handleWatchClick(e: React.MouseEvent) {
    if (!isTrash) return;
    e.preventDefault();
    setWatchWarn(true);
  }

  return (
    <article
      className={`group relative flex flex-col border bg-surface shadow-sm transition-colors duration-200 ${
        isTrash
          ? "border-laser/25 hover:border-laser/45"
          : "border-panel-border hover:border-emerald/30"
      }`}
      onMouseEnter={() => isTrash && setSlashKey((k) => k + 1)}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-raised">
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
              isTrash ? "saturate-[0.75] contrast-[1.05]" : ""
            }`}
          />
        ) : (
          <div className="font-ui flex h-full items-center justify-center text-sm text-panel-muted">
            포스터 없음
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

        {isTrash && (
          <div className="trash-watermark" aria-hidden>
            <span>CUT</span>
          </div>
        )}

        {isTrash && (
          <div key={slashKey} className="cut-slash opacity-0 transition-opacity group-hover:opacity-100" />
        )}

        <div className="absolute left-0 top-0 flex flex-col gap-1 p-2">
          {movie.ottVerified && (
            <span
              className={`font-ui inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 ${
                isTrash
                  ? "border-laser/40 bg-surface/95 text-laser"
                  : "border-emerald/40 bg-surface/95 text-emerald"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              OTT 확인됨
            </span>
          )}
          {trashReason && (
            <span className="font-ui border border-laser/35 bg-surface/95 px-2 py-0.5 text-[11px] font-semibold text-laser">
              {TRASH_REASON_LABEL[trashReason]}
            </span>
          )}
        </div>

        {movie.ottVerified && movie.watchUrl && (
          <a
            href={movie.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWatchClick}
            className={`font-ui absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 border py-2.5 text-xs font-semibold sm:flex sm:translate-y-2 sm:opacity-0 sm:transition-all sm:group-hover:translate-y-0 sm:group-hover:opacity-100 ${
              isTrash
                ? "border-laser/50 bg-laser/10 text-laser hover:bg-laser/15"
                : "border-emerald/50 bg-emerald/10 text-emerald hover:bg-emerald/15"
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isTrash ? "그래도 볼래" : "보러 가기"}
          </a>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-panel-border p-4">
        <h3 className="text-base font-semibold leading-snug text-panel-ink">
          {movie.title}
          {movie.year && (
            <span className="ml-1.5 text-sm font-normal text-panel-muted">{movie.year}</span>
          )}
        </h3>

        <div className="mt-3 flex flex-wrap items-end gap-4">
          <ScoreBlock label="Blend" value={criticScore ?? undefined} accent={accent} />
          <ScoreBlock label="MC" value={movie.scores.metacritic} accent={accent} />
          <ScoreBlock label="RT" value={movie.scores.rottenTomatoes} accent={accent} />
          {movie.scores.leeDongjin !== undefined && (
            <ScoreBlock label="LDJ" value={movie.scores.leeDongjin} accent={accent} />
          )}
        </div>

        {showCritic && movie.criticLine && (
          <div className="mt-3">
            <p
              className={`font-ui mb-1 text-[11px] font-medium ${
                isTrash ? "text-laser/85" : "text-panel-muted"
              }`}
            >
              {CRITIC_SUMMARY_LABEL}
              <span className="ml-1 font-normal text-panel-muted/80">· {CRITIC_SUMMARY_NOTE}</span>
            </p>
            <blockquote
              className={`font-ui border-l-2 pl-3 text-sm leading-relaxed ${
                isTrash ? "border-laser/45 text-panel-ink/90" : "border-gold/50 text-panel-ink/90"
              }`}
            >
              {movie.criticLine}
            </blockquote>
          </div>
        )}

        {movie.ottVerified && movie.watchUrl && !watchWarn && (
          <a
            href={movie.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWatchClick}
            className={`font-ui mt-3 flex items-center justify-center gap-2 border py-2.5 text-xs font-semibold transition-colors ${
              isTrash
                ? "border-laser/50 bg-laser/10 text-laser hover:bg-laser/15"
                : "border-emerald/50 bg-emerald/10 text-emerald hover:bg-emerald/15"
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isTrash ? "그래도 볼래" : "보러 가기"}
          </a>
        )}

        {watchWarn && movie.watchUrl && (
          <div className="mt-3 border border-laser/30 bg-laser/5 p-3">
            <p className="font-ui text-xs text-panel-muted">
              Trash Cut 목록임. 그래도 감?
            </p>
            <div className="mt-2 flex gap-2">
              <a
                href={movie.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-ui flex-1 border border-laser bg-laser/15 py-2 text-center text-xs font-semibold text-laser hover:bg-laser/20"
              >
                그래도 볼래
              </a>
              <button
                type="button"
                onClick={() => setWatchWarn(false)}
                className="font-ui flex-1 border border-panel-border py-2 text-xs text-panel-muted hover:text-panel-ink"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
