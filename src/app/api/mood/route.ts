import { NextRequest, NextResponse } from "next/server";
import { filterByMood } from "@/lib/filters";
import { generateAICriticLine } from "@/lib/critic";
import { readTierSnapshot, SnapshotNotFoundError } from "@/lib/snapshot-read";
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

    const snapshot = await readTierSnapshot(platform);
    const { movies: matched, fallback } = filterByMood(snapshot.curated, mood, 6);

    const movies = await Promise.all(
      matched.map(async (m) => ({
        ...m,
        criticLine: await generateAICriticLine(m, mood),
      }))
    );

    const interpretation = fallback
      ? `"${mood}"와 가장 가까운 명작 ${movies.length}편을 추천합니다.`
      : `"${mood}"에 딱 맞는 ${movies.length}편을 찾았습니다.`;

    return NextResponse.json({
      movies,
      mood,
      interpretation,
      fallback,
      snapshotAt: snapshot.fetchedAt,
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
