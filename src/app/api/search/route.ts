import { NextRequest, NextResponse } from "next/server";
import { searchMoviesAcrossPlatforms } from "@/lib/movie-search";
import type { OTTPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_PLATFORMS: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const platformParam = request.nextUrl.searchParams.get("platform");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "검색어를 2글자 이상 입력해 주세요." },
      { status: 400 }
    );
  }

  let platformFilter: OTTPlatform | undefined;
  if (platformParam && platformParam !== "all") {
    if (!VALID_PLATFORMS.includes(platformParam as OTTPlatform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    platformFilter = platformParam as OTTPlatform;
  }

  try {
    const data = await searchMoviesAcrossPlatforms(query, platformFilter);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "검색에 실패했어요." },
      { status: 500 }
    );
  }
}
