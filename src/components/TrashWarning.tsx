"use client";

import type { CuratedMovie } from "@/lib/types";
import { MovieCard } from "./MovieCard";

interface TrashWarningProps {
  movies: CuratedMovie[];
  loading: boolean;
}

export function TrashWarning({ movies, loading }: TrashWarningProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-64 rounded bg-red-900/40" />
          <div className="h-4 w-96 rounded bg-red-900/20" />
        </div>
      </section>
    );
  }

  if (movies.length === 0) return null;

  return (
    <section className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-black/40 p-6">
      <div className="mb-6 flex items-start gap-4">
        <span className="text-3xl">⚠️</span>
        <div>
          <h2 className="text-xl font-bold text-red-300">
            시간 낭비 방지 위원회 경고
          </h2>
          <p className="mt-1 text-sm text-red-200/70">
            인기 차트에 올라왔지만 평론가 점수 55점 이하인 작품들입니다.
            이 영화를 누르면 당신의 2시간이 증발합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {movies.slice(0, 4).map((movie) => (
          <MovieCard key={movie.id} movie={movie} showCritic />
        ))}
      </div>
    </section>
  );
}
