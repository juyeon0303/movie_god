import { NextRequest, NextResponse } from "next/server";
import { fetchCuratedMovies } from "@/lib/pipeline";
import { generateCriticLine, generateTrashCriticLine } from "@/lib/critic";
import type { CurationFilters, OTTPlatform } from "@/lib/types";

const VALID_PLATFORMS: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const platform = (searchParams.get("platform") ?? "nfx") as OTTPlatform;
  const mode = (searchParams.get("mode") ?? "curated") as CurationFilters["mode"];
  const withCritic = searchParams.get("critic") === "true";

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const filters: CurationFilters = { platform, mode };
    const filtered = await fetchCuratedMovies(platform, filters);

    const movies = filtered.map((m) => {
      if (mode === "trash") {
        return { ...m, criticLine: generateTrashCriticLine(m) };
      }
      if (withCritic) {
        return { ...m, criticLine: generateCriticLine(m) };
      }
      return m;
    });

    return NextResponse.json({
      movies,
      total: movies.length,
      platform,
      tmdbEnriched: !!process.env.TMDB_API_KEY,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Movies API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
