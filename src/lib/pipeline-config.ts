/** Render/프로덕션에서는 OMDb 호출량을 줄여 요청 타임아웃을 방지 */
const isProductionHost = process.env.NODE_ENV === "production";

export const PIPELINE = isProductionHost
  ? {
      maxVerifiedFetch: 96,
      enrichChunk: 16,
      minCurated: 20,
      minTrash: 5,
      omdbConcurrency: 6,
      omdbDelayMs: 60,
      maxRawScan: 180,
    }
  : {
      maxVerifiedFetch: 320,
      enrichChunk: 24,
      minCurated: 25,
      minTrash: 8,
      omdbConcurrency: 3,
      omdbDelayMs: 250,
      maxRawScan: 600,
    };
