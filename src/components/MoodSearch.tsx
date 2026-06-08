"use client";

import { useState } from "react";
import type { CuratedMovie, OTTPlatform } from "@/lib/types";
import { MovieCard } from "./MovieCard";

interface MoodSearchProps {
  platform: OTTPlatform;
}

const MOOD_PRESETS = [
  "비 오는 날 혼자 와인 마시며 감상 젖고 싶어",
  "잔잔하지만 뒤통수 때리는 스릴러",
  "웃기면서도 뭔가 씁쓸한 코미디",
  "마음이 울적할 때 위로가 되는 영화",
];

export function MoodSearch({ platform }: MoodSearchProps) {
  const [mood, setMood] = useState("");
  const [results, setResults] = useState<CuratedMovie[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-black/40 p-6">
      <h2 className="text-xl font-semibold text-amber-200">
        🎭 무드 매칭 — 오늘의 감정을 말해줘
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        API 키 없이 JustWatch 장르·줄거리로 매칭합니다. 큐레이션 DB 안에서만 검색.
      </p>

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="예: 비 오는 날 혼자 와인 마시며 감상 젖고 싶어"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "검색 중..." : "찾기"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {MOOD_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setMood(preset);
              handleSearch(preset);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-amber-400/30 hover:text-amber-200"
          >
            {preset}
          </button>
        ))}
      </div>

      {interpretation && (
        <p className="mt-4 text-sm text-amber-300/80">{interpretation}</p>
      )}

      {loading && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="mt-6 text-center text-zinc-500">
          해당 무드에 맞는 명작을 찾지 못했습니다. 다른 표현을 시도해 보세요.
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} showCritic />
          ))}
        </div>
      )}
    </section>
  );
}
