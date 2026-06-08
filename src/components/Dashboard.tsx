"use client";

import { useCallback, useEffect, useState } from "react";
import type { CuratedMovie, OTTPlatform } from "@/lib/types";
import { Header } from "./Header";
import { PlatformFilter } from "./PlatformFilter";
import { MovieCard } from "./MovieCard";
import { TrashWarning } from "./TrashWarning";
import { MoodSearch } from "./MoodSearch";

type ViewMode = "curated" | "trash" | "all";

export function Dashboard() {
  const [platform, setPlatform] = useState<OTTPlatform>("nfx");
  const [mode, setMode] = useState<ViewMode>("curated");
  const [curatedMovies, setCuratedMovies] = useState<CuratedMovie[]>([]);
  const [trashMovies, setTrashMovies] = useState<CuratedMovie[]>([]);
  const [allMovies, setAllMovies] = useState<CuratedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHint, setLoadingHint] = useState("영화 목록 불러오는 중...");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setLoadingHint("OTT 목록 확인 중...");

    const hintTimer = window.setTimeout(() => {
      setLoadingHint("평론가 점수 조회 중... 첫 로딩은 30~60초 걸릴 수 있어요.");
    }, 8000);

    const controller = new AbortController();
    const timeoutTimer = window.setTimeout(() => controller.abort(), 120000);

    try {
      const tiersRes = await fetch(`/api/tiers?platform=${platform}`, {
        signal: controller.signal,
      });
      const tiersData = await tiersRes.json();

      if (!tiersRes.ok) throw new Error(tiersData.error);

      setCuratedMovies(tiersData.curated ?? []);
      setTrashMovies(tiersData.trash ?? []);
      setAllMovies(tiersData.all ?? []);
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "로딩 시간이 초과됐어요. 잠시 후 다시 시도해 주세요."
          : err instanceof Error
            ? err.message
            : "Failed to load";
      setError(message);
      setCuratedMovies([]);
      setTrashMovies([]);
      setAllMovies([]);
    } finally {
      window.clearTimeout(hintTimer);
      window.clearTimeout(timeoutTimer);
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const movies =
    mode === "curated" ? curatedMovies : mode === "trash" ? trashMovies : allMovies;

  const modeTabs: { id: ViewMode; label: string }[] = [
    { id: "curated", label: "✨ 큐레이션 명작" },
    { id: "all", label: "📋 전체 목록" },
    { id: "trash", label: "🗑️ 쓰레기 컷" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08)_0%,_transparent_50%)]" />

      <Header />

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PlatformFilter selected={platform} onChange={setPlatform} />
            <div className="flex gap-1 rounded-xl bg-white/5 p-1">
              {modeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    mode === tab.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {mode !== "trash" && (
          <section className="mb-10">
            <MoodSearch platform={platform} />
          </section>
        )}

        {mode !== "trash" && (
          <section className="mb-10">
            <TrashWarning movies={trashMovies} loading={loading} />
          </section>
        )}

        <section>
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-white">
              {mode === "curated" && "오늘의 큐레이션"}
              {mode === "trash" && "시간 낭비 주의 목록"}
              {mode === "all" && "전체 스트리밍 목록"}
            </h2>
            {!loading && (
              <span className="text-sm text-zinc-500">{movies.length}편</span>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-300">
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchData}
                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                다시 시도
              </button>
            </div>
          )}

          {loading && (
            <p className="mb-4 text-center text-sm text-zinc-400">{loadingHint}</p>
          )}

          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white/5">
                  <div className="aspect-[2/3] rounded-t-2xl bg-white/10" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && movies.length === 0 && (
            <p className="py-12 text-center text-zinc-500">
              필터 조건에 맞는 영화가 없습니다.
            </p>
          )}

          {!loading && movies.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  showCritic={mode === "curated" || mode === "trash"}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-white/5 py-8 text-center text-xs text-zinc-600">
          <p>Curation Only — 콘텐츠 인플레이션 시대의 오마카세 큐레이션</p>
          <p className="mt-1">
            판정 기준: Metacritic · Rotten Tomatoes 평론가만 (인기도·관객 점수 미사용)
          </p>
        </footer>
      </main>
    </div>
  );
}
