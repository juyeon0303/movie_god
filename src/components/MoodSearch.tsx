"use client";

import { useState } from "react";
import { Command, Loader2, Sparkles } from "lucide-react";
import type { CuratedMovie, OTTPlatform } from "@/lib/types";
import { MovieCard } from "./MovieCard";
import { WakeUpWait } from "./WakeUpWait";

interface MoodSearchProps {
  platform: OTTPlatform;
}

const MOOD_PRESETS = [
  { label: "시간 때우기", query: "시간 때우기용으로 무난한 명작" },
  { label: "Pure Masterpiece", query: "순수 명작, 비평가 만장일치 걸작" },
  { label: "뇌 녹는 비주얼", query: "시각적으로 뇌가 녹는 명작" },
  { label: "비 오는 날", query: "비 오는 날 혼자 와인 마시며 감상" },
  { label: "킹받을 때", query: "킹받는데 대리 만족으로 복수하는 명작" },
];

export function MoodSearch({ platform }: MoodSearchProps) {
  const [mood, setMood] = useState("");
  const [results, setResults] = useState<CuratedMovie[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [method, setMethod] = useState<"rag" | "keyword" | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSearch(searchMood?: string) {
    const query = searchMood ?? mood;
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: query, platform }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.movies);
        setInterpretation(data.interpretation ?? "");
        setMethod(data.method ?? null);
      }
    } catch {
      setResults([]);
      setMethod(null);
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
          <Sparkles className="h-4 w-4 text-gold" strokeWidth={2} />
          <h2 className="font-ui text-sm font-semibold text-gold">Mood Command</h2>
        </div>
        <p className="font-ui mt-1 text-sm text-panel-muted">
          감정·상황을 입력 — RAG 임베딩 또는 키워드로 명작 매칭
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div
          className={`flex items-center gap-3 border bg-surface-raised px-4 py-3 transition-colors ${
            focused ? "border-gold/50" : "border-panel-border"
          }`}
        >
          <Command className="h-4 w-4 shrink-0 text-panel-muted" />
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="무드 입력… 예: 잔잔하지만 뒤통수 맞는 스릴러"
            className="font-ui min-w-0 flex-1 bg-transparent text-base text-panel-ink placeholder:text-panel-muted/80 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={loading}
            className="btn-focus-ring font-ui shrink-0 border-2 border-gold/50 bg-gold/12 px-5 py-2 text-xs font-bold text-gold transition hover:bg-gold/20 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MOOD_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setMood(preset.query);
                handleSearch(preset.query);
              }}
              className="font-ui border border-panel-border bg-surface-raised px-3 py-1.5 text-xs text-panel-muted transition hover:border-gold/40 hover:text-gold"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {interpretation && (
          <p className="font-ui mt-4 text-sm text-gold">
            {interpretation}
            {method === "rag" && (
              <span className="ml-2 border border-gold/30 px-1.5 py-0.5 text-[11px]">RAG</span>
            )}
            {method === "keyword" && (
              <span className="ml-2 border border-panel-border px-1.5 py-0.5 text-[11px] text-panel-muted">
                Keyword
              </span>
            )}
          </p>
        )}

        <WakeUpWait active={loading} variant="inline" accent="gold" />

        {!loading && searched && results.length === 0 && (
          <p className="font-ui mt-6 text-center text-sm text-panel-muted">
            매칭 실패. sync-tiers 임베딩 또는 다른 무드를 시도하세요.
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} showCritic />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
