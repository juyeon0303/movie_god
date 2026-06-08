import { NextResponse } from "next/server";

const API_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

export function jsonCached(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": API_CACHE_CONTROL,
      ...(init?.headers ?? {}),
    },
  });
}
