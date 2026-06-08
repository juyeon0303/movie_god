import { loadTierSnapshot } from "./snapshot-store";
import type { TierSnapshot } from "./snapshot-types";
import type { CurationFilters, CuratedMovie, OTTPlatform } from "./types";

export class SnapshotNotFoundError extends Error {
  constructor(platform: OTTPlatform) {
    super(`No pre-rendered snapshot for platform: ${platform}`);
    this.name = "SnapshotNotFoundError";
  }
}

export async function readTierSnapshot(platform: OTTPlatform): Promise<TierSnapshot> {
  const snapshot = await loadTierSnapshot(platform);
  if (!snapshot) throw new SnapshotNotFoundError(platform);
  return snapshot;
}

export async function readTieredMovies(
  platform: OTTPlatform
): Promise<Pick<TierSnapshot, "curated" | "trash" | "all" | "fetchedAt" | "ottVerified">> {
  const snapshot = await readTierSnapshot(platform);
  return {
    curated: snapshot.curated,
    trash: snapshot.trash,
    all: snapshot.all,
    fetchedAt: snapshot.fetchedAt,
    ottVerified: snapshot.ottVerified,
  };
}

export async function readFilteredMovies(
  platform: OTTPlatform,
  filters: CurationFilters
): Promise<{ movies: CuratedMovie[]; fetchedAt: string }> {
  const snapshot = await readTierSnapshot(platform);
  let movies: CuratedMovie[];

  switch (filters.mode) {
    case "curated":
      movies = snapshot.curated;
      break;
    case "trash":
      movies = snapshot.trash;
      break;
    case "all":
    default:
      movies = snapshot.all;
  }

  return { movies, fetchedAt: snapshot.fetchedAt };
}
