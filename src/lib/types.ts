export type OTTPlatform = "nfx" | "dnp" | "wav" | "tvk";

export interface PlatformInfo {
  id: OTTPlatform;
  name: string;
  color: string;
}

export const PLATFORMS: Record<OTTPlatform, PlatformInfo> = {
  nfx: { id: "nfx", name: "Netflix", color: "#E50914" },
  dnp: { id: "dnp", name: "Disney+", color: "#113CCF" },
  wav: { id: "wav", name: "Wavve", color: "#1E90FF" },
  tvk: { id: "tvk", name: "TVING", color: "#FF0558" },
};

export interface MovieScores {
  /** 평론가 점수만 — 판정·정렬·한줄평 전부 이것만 사용 */
  metacritic?: number;
  rottenTomatoes?: number;
}

export interface CuratedMovie {
  id: string;
  title: string;
  year?: number;
  imdbId?: string;
  tmdbId?: number;
  posterUrl?: string;
  description?: string;
  overview?: string;
  genres?: string[];
  releaseDate?: string;
  platform: OTTPlatform;
  platformName: string;
  watchUrl?: string;
  scores: MovieScores;
  criticLine?: string;
  isTrash?: boolean;
  fullPath?: string;
  /** JustWatch offer 검증 통과 — 해당 OTT에서 실제 시청 가능 */
  ottVerified?: boolean;
}

export interface CurationFilters {
  platform: OTTPlatform;
  minMetacritic?: number;
  minRottenTomatoes?: number;
  minTmdb?: number;
  mode: "curated" | "trash" | "all";
}

export interface MoviesResponse {
  movies: CuratedMovie[];
  total: number;
  platform: OTTPlatform;
  fetchedAt: string;
  cacheHit?: boolean;
}

export interface MoodSearchRequest {
  mood: string;
  platform?: OTTPlatform;
}

export interface MoodSearchResponse {
  movies: CuratedMovie[];
  mood: string;
  interpretation?: string;
}
