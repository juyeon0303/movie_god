import { NextRequest, NextResponse } from "next/server";
import { jsonCached } from "@/lib/http";
import { readTieredMovies, SnapshotNotFoundError } from "@/lib/snapshot-read";
import type { OTTPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_PLATFORMS: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

export async function GET(request: NextRequest) {
  const platform = (request.nextUrl.searchParams.get("platform") ?? "nfx") as OTTPlatform;

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const { curated, trash, all, fetchedAt, ottVerified } =
      await readTieredMovies(platform);

    return jsonCached({
      curated,
      trash,
      all,
      platform,
      ottVerified,
      fetchedAt,
      source: "snapshot",
    });
  } catch (error) {
    if (error instanceof SnapshotNotFoundError) {
      return NextResponse.json(
        {
          error: "스냅샷이 아직 없습니다. sync-tiers 배치를 먼저 실행해 주세요.",
          syncRequired: true,
        },
        { status: 503 }
      );
    }
    console.error("Tiers API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load tiers" },
      { status: 500 }
    );
  }
}
