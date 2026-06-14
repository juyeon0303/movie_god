/** 플랫폼당 목표 Approved 수 */
export const CURATED_TARGET_PER_PLATFORM = 100;

/** Trash Cut 최소 수 — Approved만 채우고 Trash가 비지 않도록 */
export const TRASH_TARGET_MIN = 15;

/** GitHub Actions — 타임아웃 내 최대한 수집 */
const CI_SYNC_PIPELINE = {
  maxVerifiedFetch: 480,
  enrichChunk: 20,
  targetCurated: CURATED_TARGET_PER_PLATFORM,
  minTrash: TRASH_TARGET_MIN,
  omdbConcurrency: 6,
  omdbDelayMs: 80,
  maxRawScan: 900,
};

/** 로컬/Render cron — 풀 스캔 */
const FULL_SYNC_PIPELINE = {
  maxVerifiedFetch: 1000,
  enrichChunk: 24,
  targetCurated: CURATED_TARGET_PER_PLATFORM,
  minTrash: TRASH_TARGET_MIN,
  omdbConcurrency: 4,
  omdbDelayMs: 200,
  maxRawScan: 1500,
};

/** 일일 배치(sync) 전용 */
export const SYNC_PIPELINE =
  process.env.CI === "true" ? CI_SYNC_PIPELINE : FULL_SYNC_PIPELINE;
