import { applyFilters, findTierOverlap } from "./filters";
import { loadTierSnapshot } from "./snapshot-store";
import type { TierSnapshot } from "./snapshot-types";
import type { CurationFilters, CuratedMovie, OTTPlatform } from "./types";

function deriveTiersFromSnapshot(snapshot: TierSnapshot): Pick<
  TierSnapshot,
  "curated" | "trash" | "all"
> {
  const pool =
    snapshot.all.length > 0
      ? snapshot.all
      : [...snapshot.curated, ...snapshot.trash];

  let curated = applyFilters(pool, { platform: snapshot.platform, mode: "curated" });
  let trash = applyFilters(pool, { platform: snapshot.platform, mode: "trash" });

  const overlap = findTierOverlap(curated, trash);
  if (overlap.length > 0) {
    const overlapIds = new Set(overlap.map((m) => m.id));
    curated = curated.filter((m) => !overlapIds.has(m.id));
    trash = trash.filter((m) => !overlapIds.has(m.id));
  }

  const all = applyFilters(pool, { platform: snapshot.platform, mode: "all" });

  return { curated, trash, all };
}

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
  const { curated, trash, all } = deriveTiersFromSnapshot(snapshot);
  return {
    curated,
    trash,
    all,
    fetchedAt: snapshot.fetchedAt,
    ottVerified: snapshot.ottVerified,
  };
}

export async function readFilteredMovies(
  platform: OTTPlatform,
  filters: CurationFilters
): Promise<{ movies: CuratedMovie[]; fetchedAt: string }> {
  const snapshot = await readTierSnapshot(platform);
  const tiers = deriveTiersFromSnapshot(snapshot);
  let movies: CuratedMovie[];

  switch (filters.mode) {
    case "curated":
      movies = tiers.curated;
      break;
    case "trash":
      movies = tiers.trash;
      break;
    case "all":
    default:
      movies = tiers.all;
  }

  return { movies, fetchedAt: snapshot.fetchedAt };
}
