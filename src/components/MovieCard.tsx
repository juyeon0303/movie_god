import type { CuratedMovie } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { resolveCriticScore } from "@/lib/filters";

interface MovieCardProps {
  movie: CuratedMovie;
  showCritic?: boolean;
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

export function MovieCard({ movie, showCritic = false }: MovieCardProps) {
  const platformColor = PLATFORMS[movie.platform]?.color ?? "#888";
  const criticScore = resolveCriticScore(movie);
  const hasCriticScore = criticScore !== null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/[0.08]">
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
        </div>
        {movie.isTrash && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/70">
            <span className="rotate-[-12deg] rounded border-2 border-red-400 px-4 py-2 text-lg font-black uppercase tracking-widest text-red-300">
              TRASH
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">
          {movie.title}
          {movie.year && (
            <span className="ml-2 text-sm font-normal text-zinc-500">{movie.year}</span>
          )}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <ScoreBadge label="MC" value={movie.scores.metacritic} color="#66cc33" />
          <ScoreBadge label="RT" value={movie.scores.rottenTomatoes} color="#fa320a" />
          {hasCriticScore ? (
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
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
                className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {(movie.overview || movie.description) && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {movie.overview || movie.description}
          </p>
        )}

        {showCritic && movie.criticLine && (
          <blockquote
            className={`mt-3 border-l-2 pl-3 text-sm italic ${
              movie.isTrash
                ? "border-red-400/50 text-red-200/80"
                : "border-amber-400/50 text-amber-200/80"
            }`}
          >
            {movie.criticLine}
          </blockquote>
        )}

        {movie.ottVerified && movie.watchUrl && (
          <a
            href={movie.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
          >
            {movie.platformName}에서 시청하기 →
          </a>
        )}
      </div>
    </article>
  );
}
