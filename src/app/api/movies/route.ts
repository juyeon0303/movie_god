import { NextRequest, NextResponse } from "next/server";
import { jsonCached } from "@/lib/http";
import { readFilteredMovies, SnapshotNotFoundError } from "@/lib/snapshot-read";
import type { CurationFilters, OTTPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_PLATFORMS: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const platform = (searchParams.get("platform") ?? "nfx") as OTTPlatform;
  const mode = (searchParams.get("mode") ?? "curated") as CurationFilters["mode"];

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const { movies, fetchedAt } = await readFilteredMovies(platform, { platform, mode });

    return jsonCached({
      movies,
      total: movies.length,
      platform,
      tmdbEnriched: !!process.env.TMDB_API_KEY,
      fetchedAt,
      source: "snapshot",
    });
  } catch (error) {
    if (error instanceof SnapshotNotFoundError) {
      return NextResponse.json(
        { error: "스냅샷이 아직 없습니다.", syncRequired: true },
        { status: 503 }
      );
    }
    console.error("Movies API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
