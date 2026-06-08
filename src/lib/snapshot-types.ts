import type { CuratedMovie, OTTPlatform } from "./types";

export const ALL_PLATFORMS: OTTPlatform[] = ["nfx", "dnp", "wav", "tvk"];

/** 배치 작업이 DB/파일에 저장하는 스냅샷 (한줄평 제외) */
export interface TierSnapshot {
  platform: OTTPlatform;
  curated: CuratedMovie[];
  trash: CuratedMovie[];
  all: CuratedMovie[];
  fetchedAt: string;
  ottVerified: number;
}
