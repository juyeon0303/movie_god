import fs from "fs";
import path from "path";
import { ALL_PLATFORMS } from "../src/lib/snapshot-types";
import type { CuratedMovie } from "../src/lib/types";
import type { SearchIndex, SearchIndexEntry } from "../src/lib/search-index";

interface OMDbResponse {
  Response: string;
  Title?: string;
  Director?: string;
  Error?: string;
}

function getOmdbApiKey(): string {
  return process.env.OMDB_API_KEY || "trilogy";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeDirectorNames(raw?: string): string[] {
  if (!raw || raw === "N/A") return [];
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

const DIRECTOR_ALIASES: Record<string, string[]> = {
  "Bong Joon-ho": ["봉준호", "봉 준호"],
  "Bong Joon Ho": ["봉준호", "봉 준호"],
  "Park Chan-wook": ["박찬욱"],
  "Park Chan Wook": ["박찬욱"],
  "Christopher Nolan": ["크리스토퍼 놀란", "놀란"],
  "Steven Spielberg": ["스티븐 스필버그", "스필버그"],
};

function expandDirectors(directors: string[]): string[] {
  const expanded = new Set<string>();
  for (const director of directors) {
    expanded.add(director);
    for (const alias of DIRECTOR_ALIASES[director] ?? []) {
      expanded.add(alias);
    }
  }
  return [...expanded];
}

function buildAliases(englishTitle?: string, koreanTitle?: string): string[] {
  const aliases = new Set<string>();
  if (englishTitle) aliases.add(englishTitle);
  if (koreanTitle && englishTitle && koreanTitle !== englishTitle) {
    aliases.add(koreanTitle);
  }
  return [...aliases];
}

async function fetchOmdbEntry(imdbId: string): Promise<SearchIndexEntry | null> {
  const params = new URLSearchParams({
    i: imdbId,
    apikey: getOmdbApiKey(),
    type: "movie",
  });

  const res = await fetch(`https://www.omdbapi.com/?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as OMDbResponse;
  if (data.Response !== "True") return null;

  const englishTitle = data.Title?.trim();
  const directors = expandDirectors(normalizeDirectorNames(data.Director));

  return {
    englishTitle,
    directors,
    aliases: buildAliases(englishTitle),
  };
}

function collectUniqueMovies(): Map<string, CuratedMovie> {
  const byImdb = new Map<string, CuratedMovie>();
  const snapshotDir = path.join(process.cwd(), "data", "snapshots");

  for (const platform of ALL_PLATFORMS) {
    const filePath = path.join(snapshotDir, `${platform}.json`);
    if (!fs.existsSync(filePath)) continue;

    const snapshot = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      all?: CuratedMovie[];
      curated?: CuratedMovie[];
      trash?: CuratedMovie[];
    };

    const pool =
      snapshot.all?.length
        ? snapshot.all
        : [...(snapshot.curated ?? []), ...(snapshot.trash ?? [])];

    for (const movie of pool) {
      if (!movie.imdbId || byImdb.has(movie.imdbId)) continue;
      byImdb.set(movie.imdbId, movie);
    }
  }

  return byImdb;
}

async function main() {
  const movies = collectUniqueMovies();
  const outputPath = path.join(process.cwd(), "data", "search-index.json");
  const existing: SearchIndex = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : {};

  console.log(`[search-index] unique imdb ids: ${movies.size}`);

  const index: SearchIndex = { ...existing };
  let fetched = 0;
  let skipped = 0;

  for (const [imdbId, movie] of movies) {
    if (index[imdbId]?.englishTitle && index[imdbId]?.directors?.length) {
      skipped++;
      continue;
    }

    const entry = await fetchOmdbEntry(imdbId);
    if (entry) {
      index[imdbId] = {
        ...index[imdbId],
        ...entry,
        aliases: [
          ...new Set([...(index[imdbId]?.aliases ?? []), ...(entry.aliases ?? [])]),
        ],
        directors: [
          ...new Set([...(index[imdbId]?.directors ?? []), ...(entry.directors ?? [])]),
        ],
      };
      fetched++;
      if (fetched % 25 === 0) {
        console.log(`[search-index] fetched ${fetched} / ${movies.size - skipped}`);
      }
    }

    await sleep(220);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 0));

  console.log(`[search-index] done: fetched=${fetched} skipped=${skipped} total=${Object.keys(index).length}`);
}

main().catch((error) => {
  console.error("[search-index] failed:", error);
  process.exit(1);
});
