/** GitHub Actions — 90분 타임아웃 내 완료용 경량 스캔 */
const CI_SYNC_PIPELINE = {
  maxVerifiedFetch: 100,
  enrichChunk: 20,
  minCurated: 15,
  minTrash: 3,
  omdbConcurrency: 6,
  omdbDelayMs: 80,
  maxRawScan: 220,
};

/** 로컬/Render cron — 풀 스캔 */
const FULL_SYNC_PIPELINE = {
  maxVerifiedFetch: 320,
  enrichChunk: 24,
  minCurated: 25,
  minTrash: 4,
  omdbConcurrency: 4,
  omdbDelayMs: 200,
  maxRawScan: 600,
};

/** 일일 배치(sync) 전용 */
export const SYNC_PIPELINE =
  process.env.CI === "true" ? CI_SYNC_PIPELINE : FULL_SYNC_PIPELINE;
