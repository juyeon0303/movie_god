"use client";

import { useCallback, useEffect, useState } from "react";
import type { CuratedMovie, OTTPlatform } from "@/lib/types";
import { Header } from "./Header";
import { PlatformFilter } from "./PlatformFilter";
import { MovieCard } from "./MovieCard";
import { TrashWarning } from "./TrashWarning";
import { MoodSearch } from "./MoodSearch";
import { TrashGateModal } from "./TrashGateModal";

type ViewMode = "curated" | "trash";

export function Dashboard() {
  const [platform, setPlatform] = useState<OTTPlatform>("nfx");
  const [mode, setMode] = useState<ViewMode>("curated");
  const [showTrashGate, setShowTrashGate] = useState(false);
  const [curatedMovies, setCuratedMovies] = useState<CuratedMovie[]>([]);
  const [trashMovies, setTrashMovies] = useState<CuratedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isHell = mode === "trash";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const tiersRes = await fetch(`/api/tiers?platform=${platform}`);
      const tiersData = await tiersRes.json();

      if (!tiersRes.ok) {
        if (tiersData.syncRequired) {
          throw new Error(
            "영화 데이터가 아직 준비되지 않았어요. GitHub Actions sync-tiers 워크플로를 실행해 주세요."
          );
        }
        throw new Error(tiersData.error);
      }

      setCuratedMovies(tiersData.curated ?? []);
      setTrashMovies(tiersData.trash ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setCuratedMovies([]);
      setTrashMovies([]);
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleModeSelect(next: ViewMode) {
    if (next === "trash" && mode !== "trash") {
      setShowTrashGate(true);
      return;
    }
    setMode(next);
  }

  function enterHell() {
    setShowTrashGate(false);
    setMode("trash");
  }

  const movies = isHell ? trashMovies : curatedMovies;
  const displayMovies = isHell
    ? movies.map((m) => ({ ...m, isTrash: true }))
    : movies;

  const modeTabs: { id: ViewMode; label: string; desc: string }[] = [
    { id: "curated", label: "☁️ 천국", desc: "평론가 75+" },
    { id: "trash", label: "🔥 지옥", desc: "MC 45↓ · RT Rotten" },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isHell ? "hell-theme bg-[#0c0303]" : "heaven-theme bg-[#0a0a0f]"
      }`}
    >
      <div
        className={`pointer-events-none fixed inset-0 transition-opacity duration-500 ${
          isHell
            ? "bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.15)_0%,_transparent_55%)] opacity-100"
            : "bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08)_0%,_transparent_50%)] opacity-100"
        }`}
      />
      {isHell && <div className="hell-scanlines pointer-events-none fixed inset-0" />}

      <TrashGateModal
        open={showTrashGate}
        onConfirm={enterHell}
        onCancel={() => setShowTrashGate(false)}
      />

      <Header mode={mode} />

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PlatformFilter selected={platform} onChange={setPlatform} />

            <div
              className={`flex gap-2 rounded-2xl p-1.5 transition-colors ${
                isHell ? "bg-red-950/50 ring-1 ring-red-500/30" : "bg-white/5"
              }`}
            >
              {modeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleModeSelect(tab.id)}
                  className={`flex flex-1 flex-col items-center rounded-xl px-4 py-3 transition-all sm:min-w-[140px] ${
                    mode === tab.id
                      ? tab.id === "trash"
                        ? "bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        : "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40"
                      : tab.id === "trash"
                        ? "text-red-400/60 hover:bg-red-950/40 hover:text-red-300"
                        : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  <span className="text-sm font-bold">{tab.label}</span>
                  <span className="mt-0.5 text-[10px] opacity-70">{tab.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {!isHell && (
          <>
            <section className="mb-10">
              <MoodSearch platform={platform} />
            </section>
            <section className="mb-10">
              <TrashWarning
                movies={trashMovies}
                loading={loading}
                onEnterHell={() => setShowTrashGate(true)}
              />
            </section>
          </>
        )}

        {isHell && !loading && (
          <section className="hell-alert-bar mb-8 rounded-2xl border-2 border-red-500/60 bg-red-950/40 p-6">
            <div className="flex items-center gap-3">
              <span className="animate-pulse text-3xl">🚨</span>
              <h2
                className="glitch-text text-2xl font-black text-red-400"
                data-text="시간 낭비 주의 구역"
              >
                시간 낭비 주의 구역
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-red-200/90">
              Metacritic 45↓ · RT Rotten — 진짜 핵쓰레기만.
              <br />
              <span className="font-bold text-red-300">
                돈과 시간을 버리시겠습니까? 각 카드의 시청 링크를 누르면 다시 물어봅니다.
              </span>
            </p>
          </section>
        )}

        <section>
          <div className="mb-6 flex items-baseline justify-between">
            <h2
              className={`text-lg font-semibold ${
                isHell ? "glitch-text text-red-300" : "text-white"
              }`}
              data-text={isHell ? "🔥 지옥 목록" : "☁️ 오늘의 명작"}
            >
              {isHell ? "🔥 지옥 목록" : "☁️ 오늘의 명작"}
            </h2>
            {!loading && (
              <span className={`text-sm ${isHell ? "text-red-400/70" : "text-zinc-500"}`}>
                {movies.length}편
              </span>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`animate-pulse rounded-2xl ${
                    isHell ? "bg-red-950/30" : "bg-white/5"
                  }`}
                >
                  <div
                    className={`aspect-[2/3] rounded-t-2xl ${
                      isHell ? "bg-red-900/30" : "bg-white/10"
                    }`}
                  />
                  <div className="space-y-2 p-4">
                    <div
                      className={`h-4 w-3/4 rounded ${
                        isHell ? "bg-red-900/30" : "bg-white/10"
                      }`}
                    />
                    <div
                      className={`h-3 w-1/2 rounded ${
                        isHell ? "bg-red-900/20" : "bg-white/5"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && movies.length === 0 && (
            <p className={`py-12 text-center ${isHell ? "text-red-400/60" : "text-zinc-500"}`}>
              {isHell ? "이 OTT에는 지옥행 영화가 없습니다. 다행이네요." : "명작이 아직 없습니다."}
            </p>
          )}

          {!loading && movies.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  showCritic
                  hellMode={isHell}
                />
              ))}
            </div>
          )}
        </section>

        <footer
          className={`mt-16 border-t py-8 text-center text-xs ${
            isHell ? "border-red-900/50 text-red-900/80" : "border-white/5 text-zinc-600"
          }`}
        >
          <p>Curation Only — 콘텐츠 인플레이션 시대의 오마카세 큐레이션</p>
          <p className="mt-1">
            판정: 이동진(35%)·MC(40%)·RT(25%) 블렌드 — 인기도·관객 점수 미사용
          </p>
        </footer>
      </main>
    </div>
  );
}
