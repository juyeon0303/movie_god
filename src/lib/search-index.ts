import fs from "fs";
import path from "path";
import type { CuratedMovie } from "./types";

export interface SearchIndexEntry {
  englishTitle?: string;
  directors?: string[];
  aliases?: string[];
}

export type SearchIndex = Record<string, SearchIndexEntry>;

let cachedIndex: SearchIndex | null = null;
let cachedDirectorLookup: Map<string, string[]> | null = null;

function indexPath(): string {
  return path.join(process.cwd(), "data", "search-index.json");
}

export function getSearchIndex(): SearchIndex {
  if (cachedIndex) return cachedIndex;

  const filePath = indexPath();
  if (!fs.existsSync(filePath)) {
    cachedIndex = {};
    return cachedIndex;
  }

  cachedIndex = JSON.parse(fs.readFileSync(filePath, "utf8")) as SearchIndex;
  return cachedIndex;
}

function normalizeDirectorKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·.,!?'"()[\]{}:;/-]+/g, "");
}

export function getDirectorLookup(): Map<string, string[]> {
  if (cachedDirectorLookup) return cachedDirectorLookup;

  const lookup = new Map<string, string[]>();
  for (const [imdbId, entry] of Object.entries(getSearchIndex())) {
    for (const director of entry.directors ?? []) {
      const key = normalizeDirectorKey(director);
      if (!key) continue;
      const list = lookup.get(key) ?? [];
      if (!list.includes(imdbId)) list.push(imdbId);
      lookup.set(key, list);
    }
  }

  cachedDirectorLookup = lookup;
  return lookup;
}

export function getSearchIndexEntry(movie: CuratedMovie): SearchIndexEntry | undefined {
  if (!movie.imdbId) return undefined;
  return getSearchIndex()[movie.imdbId];
}

export function lookupDirectorImdbIds(query: string): string[] {
  const key = normalizeDirectorKey(query);
  if (!key) return [];
  return getDirectorLookup().get(key) ?? [];
}
