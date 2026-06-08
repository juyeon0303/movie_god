import { getCached, PLATFORM_POOL_TTL_MS, setCache } from "./cache";
import { fetchPlatformMovies } from "./justwatch";
import { enrichMoviesScores } from "./ratings";
import { enrichMoviesWithTmdb } from "./tmdb";
import { PIPELINE } from "./pipeline-config";
import {
  applyFilters,
  classifyMovie,
  findTierOverlap,
  hasCriticScore,
  onlyCriticScored,
} from "./filters";
import type { CurationFilters, CuratedMovie, OTTPlatform } from "./types";

export const MIN_CURATED_PER_PLATFORM = PIPELINE.minCurated;
export const MIN_TRASH_PER_PLATFORM = PIPELINE.minTrash;

function countTiers(movies: CuratedMovie[]): { curated: number; trash: number } {
  let curated = 0;
  let trash = 0;
  for (const m of movies) {
    if (!hasCriticScore(m)) continue;
    const tier = classifyMovie(m);
    if (tier === "curated") curated++;
    else if (tier === "trash") trash++;
  }
  return { curated, trash };
}

function tierTargetsMet(movies: CuratedMovie[]): boolean {
  const { curated, trash } = countTiers(movies);
  return curated >= PIPELINE.minCurated && trash >= PIPELINE.minTrash;
}

async function enrichChunk(movies: CuratedMovie[]): Promise<CuratedMovie[]> {
  const withScores = await enrichMoviesScores(
    movies,
    PIPELINE.omdbConcurrency,
    PIPELINE.omdbDelayMs
  );
  return enrichMoviesWithTmdb(withScores);
}

/**
 * JustWatch에서 충분히 스캔한 뒤 평론가 점수를 붙여
 * OTT당 curated 25+ / trash 8+ 을 채울 때까지 풀을 확장한다.
 */
async function fetchEnrichedPool(platform: OTTPlatform): Promise<CuratedMovie[]> {
  const cacheKey = `pool:${platform}`;
  const cached = getCached<CuratedMovie[]>(cacheKey);
  if (cached) return cached;

  const verified = await fetchPlatformMovies(
    platform,
    PIPELINE.maxVerifiedFetch,
    PIPELINE.maxRawScan
  );
  const pool: CuratedMovie[] = [];

  for (let i = 0; i < verified.length; i += PIPELINE.enrichChunk) {
    const chunk = verified.slice(i, i + PIPELINE.enrichChunk);
    const enriched = await enrichChunk(chunk);
    pool.push(...onlyCriticScored(enriched));

    if (tierTargetsMet(pool)) break;
  }

  if (process.env.NODE_ENV === "development") {
    const { curated, trash } = countTiers(pool);
    console.debug(
      `[pipeline] ${platform}: verified=${verified.length} scored=${pool.length} curated=${curated} trash=${trash}`
    );
  }

  setCache(cacheKey, pool, PLATFORM_POOL_TTL_MS);
  return pool;
}

export async function fetchCuratedMovies(
  platform: OTTPlatform,
  filters: CurationFilters
): Promise<CuratedMovie[]> {
  const enriched = await fetchEnrichedPool(platform);
  return applyFilters(enriched, filters);
}

/** 큐레이션·쓰레기·전체 동시 조회 + 중복 자동 제거 */
export async function fetchTieredMovies(
  platform: OTTPlatform
): Promise<{ curated: CuratedMovie[]; trash: CuratedMovie[]; all: CuratedMovie[] }> {
  const enriched = await fetchEnrichedPool(platform);
  let curated = applyFilters(enriched, { platform, mode: "curated" });
  let trash = applyFilters(enriched, { platform, mode: "trash" });
  const all = applyFilters(enriched, { platform, mode: "all" });

  const overlap = findTierOverlap(curated, trash);
  if (overlap.length > 0) {
    const overlapIds = new Set(overlap.map((m) => m.id));
    console.warn(
      `[pipeline] tier overlap detected (${overlap.length}):`,
      overlap.map((m) => m.title).join(", ")
    );
    trash = trash.filter((m) => !overlapIds.has(m.id));
    curated = curated.filter((m) => !overlapIds.has(m.id));
  }

  return { curated, trash, all };
}
