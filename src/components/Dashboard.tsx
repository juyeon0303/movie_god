"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import type { CuratedMovie, OTTPlatform } from "@/lib/types";
import { Header } from "./Header";
import { PlatformFilter } from "./PlatformFilter";
import { MovieCard } from "./MovieCard";
import { TrashWarning } from "./TrashWarning";
import { MovieSearch } from "./MovieSearch";
import { TrashGateModal } from "./TrashGateModal";
import { ModeToggle, type ViewMode } from "./ModeToggle";
import { getMoviePageSize, MoviePagination } from "./MoviePagination";
import { BrandLogo } from "./BrandLogo";
import { PLATFORMS } from "@/lib/types";
import { WakeUpWait } from "./WakeUpWait";

export function Dashboard() {
  const [platform, setPlatform] = useState<OTTPlatform>("nfx");
  const [mode, setMode] = useState<ViewMode>("curated");
  const [page, setPage] = useState(1);
  const [showTrashGate, setShowTrashGate] = useState(false);
  const [slashAnim, setSlashAnim] = useState(false);
  const [curatedMovies, setCuratedMovies] = useState<CuratedMovie[]>([]);
  const [trashMovies, setTrashMovies] = useState<CuratedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isTrash = mode === "trash";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const tiersRes = await fetch(`/api/tiers?platform=${platform}`);
      const tiersData = await tiersRes.json();

      if (!tiersRes.ok) {
        if (tiersData.syncRequired) {
          throw new Error("데이터를 불러올 수 없어요. 잠시 후 다시 시도해 주세요.");
        }
        throw new Error(tiersData.error ?? "목록을 불러오지 못했어요.");
      }

      setCuratedMovies(tiersData.curated ?? []);
      setTrashMovies(tiersData.trash ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 로드 실패.");
      setCuratedMovies([]);
      setTrashMovies([]);
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [platform, mode]);

  function handleModeSelect(next: ViewMode) {
    if (next === "trash" && mode !== "trash") {
      setShowTrashGate(true);
      return;
    }
    if (next === "curated" && mode === "trash") {
      setSlashAnim(true);
      window.setTimeout(() => setSlashAnim(false), 600);
    }
    setMode(next);
  }

  function enterTrash() {
    setShowTrashGate(false);
    setSlashAnim(true);
    setMode("trash");
    window.setTimeout(() => setSlashAnim(false), 600);
  }

  const movies = isTrash ? trashMovies : curatedMovies;
  const pageSize = getMoviePageSize();
  const totalPages = Math.max(1, Math.ceil(movies.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlice = movies.slice((safePage - 1) * pageSize, safePage * pageSize);
  const displayMovies = isTrash
    ? pageSlice.map((m) => ({ ...m, isTrash: true }))
    : pageSlice;

  return (
    <div
      className={`trashcut-theme relative min-h-screen bg-void transition-colors duration-300 ${
        isTrash ? "trash-mode" : ""
      }`}
    >
      {isTrash && (
        <div className="trash-scanlines pointer-events-none fixed inset-0 z-0" aria-hidden />
      )}
      {slashAnim && <div className="cut-slash fixed inset-0 z-30" aria-hidden />}

      <TrashGateModal
        open={showTrashGate}
        onConfirm={enterTrash}
        onCancel={() => setShowTrashGate(false)}
      />

      <Header mode={mode} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-8">
          <MovieSearch platform={platform} />
        </section>

        <section className="mb-8">
          <ModeToggle mode={mode} onChange={handleModeSelect} />
        </section>

        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PlatformFilter selected={platform} onChange={setPlatform} mode={mode} />
          {!loading && (
            <p className="font-ui text-xs font-semibold tracking-wide sm:text-sm">
              <span style={{ color: PLATFORMS[platform].color }}>{PLATFORMS[platform].name}</span>
              <span className="text-silver"> · </span>
              <span className={isTrash ? "text-laser" : "text-gold"}>
              {isTrash ? "Trash Cut" : "Approved"} · {movies.length}편
              </span>
            </p>
          )}
        </section>

        {!isTrash && (
          <section className="mb-8">
            <TrashWarning
              movies={trashMovies}
              loading={loading}
              onEnterHell={() => setShowTrashGate(true)}
            />
          </section>
        )}

        {isTrash && !loading && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-laser/25 bg-surface p-5 shadow-sm"
          >
            <h2 className="font-ui text-sm font-semibold text-laser sm:text-base">
              Trash <span className="text-laser">Cut</span>
            </h2>
            <p className="font-ui mt-2 text-sm leading-relaxed text-panel-muted">
              평론 점수 기준으로 분류된 작품이에요. 시청 여부는 본인 판단에 맡겨요.
            </p>
          </motion.section>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between border-b border-border pb-3">
            <h2
              className={`font-ui text-sm font-bold ${
                isTrash ? "text-laser" : "text-gold"
              }`}
            >
              {isTrash ? (
                <>
                  Trash <span className="neon-laser">Cut</span>
                </>
              ) : (
                "Approved"
              )}
            </h2>
          </div>

          {error && (
            <div className="mb-6 border border-laser/30 bg-surface p-4 shadow-sm">
              <p className="font-ui text-sm text-laser">{error}</p>
              <button
                type="button"
                onClick={fetchData}
                className="font-ui mt-3 inline-flex items-center gap-2 border border-panel-border bg-surface px-4 py-2 text-xs text-panel-ink hover:border-gold/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                다시 시도
              </button>
            </div>
          )}

          <WakeUpWait
            active={loading}
            variant="page"
            accent={isTrash ? "laser" : "gold"}
          />

          {!loading && !error && movies.length === 0 && (
            <p className="font-ui py-20 text-center text-sm text-silver">
              {isTrash
                ? "Trash Cut 작품이 없어요."
                : "Approved 작품이 없어요. 데이터를 확인해 주세요."}
            </p>
          )}

          <AnimatePresence mode="wait">
            {!loading && movies.length > 0 && (
              <motion.div
                key={`${platform}-${mode}-${safePage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              >
                {displayMovies.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <MovieCard movie={movie} hellMode={isTrash} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && movies.length > 0 && (
            <MoviePagination
              total={movies.length}
              page={safePage}
              onChange={setPage}
              mode={mode}
            />
          )}
        </section>

        <footer className="mt-20 border-t border-border py-8 text-center">
          <p className="flex justify-center">
            <BrandLogo size="sm" className="text-panel-ink" />
          </p>
          <p className="font-ui mt-2 text-xs text-silver sm:text-sm">
            관객 평점은 사용하지 않아요 · 이동진 35% · MC 40% · RT 25%
          </p>
        </footer>
      </main>
    </div>
  );
}
