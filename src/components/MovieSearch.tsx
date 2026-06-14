"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { MovieSearchHit } from "@/lib/movie-search";
import type { OTTPlatform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { MovieCard } from "./MovieCard";
import { WakeUpWait } from "./WakeUpWait";

interface MovieSearchProps {
  platform: OTTPlatform;
}

const TIER_LABEL = {
  curated: { text: "Approved", className: "border-emerald/40 bg-emerald/10 text-emerald" },
  trash: { text: "Trash Cut", className: "border-laser/40 bg-laser/10 text-laser" },
  neutral: { text: "분류 없음", className: "border-panel-border bg-surface-raised text-panel-muted" },
} as const;

export function MovieSearch({ platform }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | OTTPlatform>("all");
  const [results, setResults] = useState<MovieSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setResults([]);
    setSearched(false);
    setError("");
  }, [platform]);

  async function handleSearch() {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setSearched(true);
    setError("");

    try {
      const params = new URLSearchParams({ q: trimmed });
      if (scope !== "all") params.set("platform", scope);

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "검색에 실패했어요.");
        setResults([]);
        return;
      }

      setResults(data.results ?? []);
    } catch {
      setError("연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`border bg-surface shadow-sm transition-colors ${
        focused ? "border-gold/50" : "border-panel-border"
      }`}
    >
      <div className="border-b border-panel-border px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gold" strokeWidth={2} />
          <h2 className="font-ui text-sm font-semibold text-gold">영화 검색</h2>
        </div>
        <p className="font-ui mt-1 text-sm text-panel-muted">
          보고 싶은 영화 제목을 검색하면 Approved / Trash Cut 분류를 확인할 수 있어요
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div
          className={`flex items-center gap-3 border bg-surface-raised px-4 py-3 transition-colors ${
            focused ? "border-gold/50" : "border-panel-border"
          }`}
        >
          <Search className="h-4 w-4 shrink-0 text-panel-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="예: 기생충, 인터스텔라"
            className="font-ui min-w-0 flex-1 bg-transparent text-base text-panel-ink placeholder:text-panel-muted/80 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || query.trim().length < 2}
            className="btn-focus-ring font-ui shrink-0 border-2 border-gold/50 bg-gold/12 px-5 py-2 text-xs font-bold text-gold transition hover:bg-gold/20 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`font-ui border px-3 py-1.5 text-xs transition ${
              scope === "all"
                ? "border-gold/50 bg-gold/12 text-gold"
                : "border-panel-border bg-surface-raised text-panel-muted hover:border-gold/40 hover:text-gold"
            }`}
          >
            전체 OTT
          </button>
          {(Object.keys(PLATFORMS) as OTTPlatform[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`font-ui border px-3 py-1.5 text-xs transition ${
                scope === id
                  ? "border-gold/50 bg-gold/12 text-gold"
                  : "border-panel-border bg-surface-raised text-panel-muted hover:border-gold/40 hover:text-gold"
              }`}
            >
              {PLATFORMS[id].name}
            </button>
          ))}
        </div>

        {error && <p className="font-ui mt-4 text-sm text-laser">{error}</p>}

        <WakeUpWait active={loading} variant="inline" accent="gold" />

        {!loading && searched && !error && results.length === 0 && (
          <p className="font-ui mt-6 text-center text-sm leading-relaxed text-panel-muted">
            검색 결과가 없어요.
            <br />
            OTT 카탈로그에 없거나 아직 분류되지 않은 작품일 수 있어요.
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-6 space-y-4">
            {results.map((hit) => {
              const tier = TIER_LABEL[hit.tier];
              const isTrash = hit.tier === "trash";

              return (
                <div key={`${hit.platform}-${hit.movie.id}`} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-ui border px-2 py-0.5 text-[11px] font-semibold ${tier.className}`}
                    >
                      {tier.text}
                    </span>
                    <span
                      className="font-ui text-xs font-semibold"
                      style={{ color: PLATFORMS[hit.platform].color }}
                    >
                      {PLATFORMS[hit.platform].name}
                    </span>
                    {hit.movie.year && (
                      <span className="font-ui text-xs text-panel-muted">{hit.movie.year}</span>
                    )}
                  </div>
                  <MovieCard
                    movie={{
                      ...hit.movie,
                      criticLine: hit.criticLine,
                      isTrash,
                    }}
                    showCritic
                    hellMode={isTrash}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
