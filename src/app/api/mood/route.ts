import { NextRequest, NextResponse } from "next/server";
import { generateCriticLine } from "@/lib/critic";
import { searchMoviesByMood } from "@/lib/mood-rag";
import { readTieredMovies, SnapshotNotFoundError } from "@/lib/snapshot-read";
import type { OTTPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mood = body.mood?.trim();
    const platform = (body.platform ?? "nfx") as OTTPlatform;

    if (!mood || mood.length < 2) {
      return NextResponse.json({ error: "무드 2글자 이상." }, { status: 400 });
    }

    const { curated, fetchedAt } = await readTieredMovies(platform);
    const { movies: matched, fallback, method, topScore } = await searchMoviesByMood(
      mood,
      curated,
      platform,
      6
    );

    const movies = matched.map((m) => ({
      ...m,
      criticLine: generateCriticLine(m, mood),
    }));

    const interpretation =
      method === "rag"
        ? fallback
          ? `「${mood}」 비슷한 vibe ${movies.length}편 · sim ${(topScore ?? 0).toFixed(2)}`
          : `「${mood}」 vec 매칭 ${movies.length}편`
        : fallback
          ? `「${mood}」 키워드 폴백 ${movies.length}편`
          : `「${mood}」 → ${movies.length}편 뽑음`;

    return NextResponse.json({
      movies,
      mood,
      interpretation,
      fallback,
      method,
      snapshotAt: fetchedAt,
    });
  } catch (error) {
    if (error instanceof SnapshotNotFoundError) {
      return NextResponse.json(
        { error: "스냅샷 없음. sync 돌리거나 기다려.", syncRequired: true },
        { status: 503 }
      );
    }
    console.error("Mood API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "무드 검색 터짐" },
      { status: 500 }
    );
  }
}
