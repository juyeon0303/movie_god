import { NextRequest, NextResponse } from "next/server";
import { fetchTieredMovies } from "@/lib/pipeline";
import { generateCriticLine, generateTrashCriticLine } from "@/lib/critic";
import type { OTTPlatform } from "@/lib/types";

const VALID_PLATFORMS: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

export async function GET(request: NextRequest) {
  const platform = (request.nextUrl.searchParams.get("platform") ?? "nfx") as OTTPlatform;

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const { curated, trash } = await fetchTieredMovies(platform);

    const verified = curated.filter((m) => m.ottVerified).length + trash.filter((m) => m.ottVerified).length;

    return NextResponse.json({
      curated: curated.map((m) => ({ ...m, criticLine: generateCriticLine(m) })),
      trash: trash.map((m) => ({ ...m, criticLine: generateTrashCriticLine(m) })),
      platform,
      ottVerified: verified,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Tiers API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tiers" },
      { status: 500 }
    );
  }
}
