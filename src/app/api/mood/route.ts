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
      return NextResponse.json({ error: "Mood description required" }, { status: 400 });
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
          ? `"${mood}"와 비슷한 분위기의 명작 ${movies.length}편 (벡터 유사도 ${(topScore ?? 0).toFixed(2)})`
          : `"${mood}"에 딱 맞는 명작 ${movies.length}편 — RAG 매칭`
        : fallback
          ? `"${mood}"와 가장 가까운 명작 ${movies.length}편 (키워드 폴백)`
          : `"${mood}"에 맞는 ${movies.length}편을 찾았습니다.`;

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
        { error: "스냅샷이 아직 없습니다.", syncRequired: true },
        { status: 503 }
      );
    }
    console.error("Mood API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mood search failed" },
      { status: 500 }
    );
  }
}
