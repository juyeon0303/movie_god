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
      return NextResponse.json({ error: "무드를 2글자 이상 입력해 주세요." }, { status: 400 });
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
          ? `「${mood}」와 비슷한 작품 ${movies.length}편 (유사도 ${(topScore ?? 0).toFixed(2)})`
          : `「${mood}」와 맞는 작품 ${movies.length}편`
        : fallback
          ? `「${mood}」 키워드로 ${movies.length}편을 찾았어요`
          : `「${mood}」에 맞는 작품 ${movies.length}편`;

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
        { error: "데이터가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.", syncRequired: true },
        { status: 503 }
      );
    }
    console.error("Mood API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "무드 검색에 실패했어요." },
      { status: 500 }
    );
  }
}
