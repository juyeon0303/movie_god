import fs from "fs";
import path from "path";
import { ALL_PLATFORMS } from "../src/lib/snapshot-types";
import { normalizeMovieTitle } from "../src/lib/title-display";
import type { CuratedMovie } from "../src/lib/types";
import type { TierSnapshot } from "../src/lib/snapshot-types";

function normalizeList(movies: CuratedMovie[]): { movies: CuratedMovie[]; changed: number } {
  let changed = 0;
  const next = movies.map((movie) => {
    const normalized = normalizeMovieTitle(movie);
    if (normalized.title !== movie.title) changed++;
    return normalized;
  });
  return { movies: next, changed };
}

function main() {
  const snapshotDir = path.join(process.cwd(), "data", "snapshots");
  let totalChanged = 0;

  for (const platform of ALL_PLATFORMS) {
    const filePath = path.join(snapshotDir, `${platform}.json`);
    if (!fs.existsSync(filePath)) continue;

    const snapshot = JSON.parse(fs.readFileSync(filePath, "utf8")) as TierSnapshot;
    const curated = normalizeList(snapshot.curated ?? []);
    const trash = normalizeList(snapshot.trash ?? []);
    const all = normalizeList(snapshot.all ?? []);
    const changed = curated.changed + trash.changed + all.changed;

    if (changed > 0) {
      snapshot.curated = curated.movies;
      snapshot.trash = trash.movies;
      snapshot.all = all.movies;
      fs.writeFileSync(filePath, JSON.stringify(snapshot));
      console.log(`[titles] ${platform}: updated ${changed} titles`);
      totalChanged += changed;
    } else {
      console.log(`[titles] ${platform}: no changes`);
    }
  }

  console.log(`[titles] done: ${totalChanged} titles updated`);
}

main();
