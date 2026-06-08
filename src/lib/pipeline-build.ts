import { fetchPlatformMovies } from "./justwatch";
import { enrichMoviesScores } from "./ratings";
import { enrichMoviesWithTmdb } from "./tmdb";
import { SYNC_PIPELINE } from "./pipeline-config";
import {
  applyFilters,
  classifyMovie,
  findTierOverlap,
  hasCriticScore,
  onlyCriticScored,
} from "./filters";
import type { TierSnapshot } from "./snapshot-types";
import type { CuratedMovie, OTTPlatform } from "./types";

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

function shouldStopEnriching(
  movies: CuratedMovie[],
  processedCount: number,
  totalVerified: number
): boolean {
  if (processedCount >= totalVerified) return true;
  const { curated, trash } = countTiers(movies);
  return (
    curated >= SYNC_PIPELINE.targetCurated && trash >= SYNC_PIPELINE.minTrash
  );
}

async function enrichChunk(movies: CuratedMovie[]): Promise<CuratedMovie[]> {
  const withScores = await enrichMoviesScores(
    movies,
    SYNC_PIPELINE.omdbConcurrency,
    SYNC_PIPELINE.omdbDelayMs
  );
  return enrichMoviesWithTmdb(withScores);
}

/** 배치 전용 — JustWatch + OMDb 외부 API 호출 */
export async function buildEnrichedPool(platform: OTTPlatform): Promise<CuratedMovie[]> {
  const verified = await fetchPlatformMovies(
    platform,
    SYNC_PIPELINE.maxVerifiedFetch,
    SYNC_PIPELINE.maxRawScan
  );
  const pool: CuratedMovie[] = [];

  for (let i = 0; i < verified.length; i += SYNC_PIPELINE.enrichChunk) {
    const chunk = verified.slice(i, i + SYNC_PIPELINE.enrichChunk);
    const enriched = await enrichChunk(chunk);
    pool.push(...onlyCriticScored(enriched));
    const processed = Math.min(i + SYNC_PIPELINE.enrichChunk, verified.length);
    if (shouldStopEnriching(pool, processed, verified.length)) break;
  }

  const { curated, trash } = countTiers(pool);
  console.log(
    `[sync] ${platform}: verified=${verified.length} scored=${pool.length} curated=${curated} trash=${trash}`
  );

  return pool;
}

/** 배치 전용 — OTT 1개 플랫폼 tier 스냅샷 생성 */
export async function buildTierSnapshot(platform: OTTPlatform): Promise<TierSnapshot> {
  const enriched = await buildEnrichedPool(platform);
  let curated = applyFilters(enriched, { platform, mode: "curated" });
  let trash = applyFilters(enriched, { platform, mode: "trash" });
  const all = applyFilters(enriched, { platform, mode: "all" });

  const overlap = findTierOverlap(curated, trash);
  if (overlap.length > 0) {
    const overlapIds = new Set(overlap.map((m) => m.id));
    trash = trash.filter((m) => !overlapIds.has(m.id));
    curated = curated.filter((m) => !overlapIds.has(m.id));
  }

  const ottVerified =
    curated.filter((m) => m.ottVerified).length +
    trash.filter((m) => m.ottVerified).length;

  return {
    platform,
    curated,
    trash,
    all,
    fetchedAt: new Date().toISOString(),
    ottVerified,
  };
}
