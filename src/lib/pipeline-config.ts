/** 일일 배치(sync) 전용 — 풀 스캔 */
export const SYNC_PIPELINE = {
  maxVerifiedFetch: 320,
  enrichChunk: 24,
  minCurated: 25,
  minTrash: 8,
  omdbConcurrency: 4,
  omdbDelayMs: 200,
  maxRawScan: 600,
};
