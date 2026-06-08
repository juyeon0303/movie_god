/**
 * @deprecated 런타임 API는 snapshot-read 사용. 배치는 pipeline-build 사용.
 */
export {
  readTieredMovies as fetchTieredMovies,
  readFilteredMovies as fetchCuratedMovies,
} from "./snapshot-read";

export { buildTierSnapshot, buildEnrichedPool } from "./pipeline-build";
export { SYNC_PIPELINE } from "./pipeline-config";
