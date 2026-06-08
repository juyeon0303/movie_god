import { NextRequest, NextResponse } from "next/server";
import { fetchPlatformMovies } from "@/lib/justwatch";
import type { OTTPlatform } from "@/lib/types";

const VALID: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

/** OTT 매칭 정확도 점검용 — 모든 항목이 ottVerified=true 여야 함 */
export async function GET(request: NextRequest) {
  const platform = (request.nextUrl.searchParams.get("platform") ?? "nfx") as OTTPlatform;

  if (!VALID.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const movies = await fetchPlatformMovies(platform, 20);
    const unverified = movies.filter((m) => !m.ottVerified || !m.watchUrl);

    return NextResponse.json({
      platform,
      total: movies.length,
      allVerified: unverified.length === 0,
      unverified: unverified.map((m) => ({ id: m.id, title: m.title })),
      sample: movies.slice(0, 5).map((m) => ({
        title: m.title,
        platform: m.platformName,
        watchUrl: m.watchUrl,
        ottVerified: m.ottVerified,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verify failed" },
      { status: 500 }
    );
  }
}
