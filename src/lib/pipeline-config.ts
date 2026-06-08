/** 플랫폼당 목표 명작 수 — 데스크톱 4열 × 3페이지(12편) ≈ 36+, 여유 40 */
export const CURATED_TARGET_PER_PLATFORM = 40;

/** GitHub Actions — 타임아웃 내 최대한 수집 */
const CI_SYNC_PIPELINE = {
  maxVerifiedFetch: 220,
  enrichChunk: 20,
  targetCurated: CURATED_TARGET_PER_PLATFORM,
  minTrash: 4,
  omdbConcurrency: 6,
  omdbDelayMs: 80,
  maxRawScan: 480,
};

/** 로컬/Render cron — 풀 스캔 */
const FULL_SYNC_PIPELINE = {
  maxVerifiedFetch: 520,
  enrichChunk: 24,
  targetCurated: CURATED_TARGET_PER_PLATFORM,
  minTrash: 5,
  omdbConcurrency: 4,
  omdbDelayMs: 200,
  maxRawScan: 1000,
};

/** 일일 배치(sync) 전용 */
export const SYNC_PIPELINE =
  process.env.CI === "true" ? CI_SYNC_PIPELINE : FULL_SYNC_PIPELINE;
