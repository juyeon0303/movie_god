import { promises as fs } from "fs";
import path from "path";
import type { CuratedMovie } from "./types";

/** 왓챠피디아 이동진 평론가 프로필 */
export const LEE_DONGJIN_WATCHA_USER = "DgwxAeQYNxrMj";

const RATINGS_FILE = path.join(process.cwd(), "data", "lee-dongjin", "ratings.json");
const WATCHA_API = "https://pedia.watcha.com";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface LeeDongjinEntry {
  title: string;
  year?: number;
  code: string;
  score: number;
  rawRating: number;
}

export interface LeeDongjinIndex {
  updatedAt: string;
  count: number;
  byKey: Record<string, number>;
  entries?: LeeDongjinEntry[];
}

let memoryIndex: LeeDongjinIndex | null = null;

const WATCHA_HEADERS = {
  accept: "application/vnd.frograms+json;version=2.1.0",
  "x-frograms-app-code": "Galaxy",
  "x-frograms-client": "Galaxy-Web-App",
  "x-frograms-client-version": "2.1.0",
  "x-frograms-version": "2.1.0",
  "x-frograms-galaxy-language": "ko",
  "x-frograms-galaxy-region": "KR",
};

export function watchaRatingToHundred(raw: number): number {
  return Math.round((raw / 2) * 20);
}

export function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "");
}

function makeLookupKey(title: string, year?: number): string {
  const y = year ?? "unknown";
  return `${normalizeTitleKey(title)}|${y}`;
}

function buildByKey(entries: LeeDongjinEntry[]): Record<string, number> {
  const byKey: Record<string, number> = {};
  for (const entry of entries) {
    const key = makeLookupKey(entry.title, entry.year);
    if (!(key in byKey)) byKey[key] = entry.score;
    const titleOnly = makeLookupKey(entry.title);
    if (!(titleOnly in byKey)) byKey[titleOnly] = entry.score;
  }
  return byKey;
}

interface WatchaRatingItem {
  user_content_action: { rating: number };
  content: { code: string; title: string; year?: number };
}

interface WatchaPage {
  result?: {
    next_uri: string | null;
    result: WatchaRatingItem[];
  };
}

async function fetchWatchaPage(uri: string): Promise<WatchaPage> {
  const url = uri.startsWith("http") ? uri : `${WATCHA_API}${uri}`;
  let attempts = 0;

  while (attempts < 6) {
    const res = await fetch(url, { headers: WATCHA_HEADERS });
    if (res.status === 429) {
      const wait = 5000 + attempts * 3000;
      console.warn(`[lee-dongjin] 429, wait ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      attempts++;
      continue;
    }
    if (!res.ok) throw new Error(`Watcha API ${res.status}: ${url}`);
    return res.json() as Promise<WatchaPage>;
  }
  throw new Error(`Watcha API rate limited: ${url}`);
}

function isCacheFresh(index: LeeDongjinIndex): boolean {
  const age = Date.now() - new Date(index.updatedAt).getTime();
  return age < CACHE_MAX_AGE_MS && index.count > 500;
}

export async function fetchAllLeeDongjinRatings(options?: {
  maxPages?: number;
}): Promise<LeeDongjinIndex> {
  const maxPages = options?.maxPages ?? Infinity;
  const entries: LeeDongjinEntry[] = [];
  let nextUri: string | null =
    `/api/users/${LEE_DONGJIN_WATCHA_USER}/contents/movies/ratings?order=recent&page=1&size=50`;
  let pages = 0;

  while (nextUri && pages < maxPages) {
    pages++;
    const page = await fetchWatchaPage(nextUri);
    const batch = page.result?.result ?? [];

    if (batch.length === 0) break;

    for (const item of batch) {
      const raw = item.user_content_action?.rating;
      if (!raw || !item.content?.title) continue;
      entries.push({
        title: item.content.title,
        year: item.content.year,
        code: item.content.code,
        score: watchaRatingToHundred(raw),
        rawRating: raw,
      });
    }

    if (pages % 10 === 0) {
      console.log(`[lee-dongjin] page ${pages}, entries ${entries.length}`);
    }

    nextUri = page.result?.next_uri ?? null;
    if (nextUri) await new Promise((r) => setTimeout(r, 300));
  }

  const byKey = buildByKey(entries);
  return {
    updatedAt: new Date().toISOString(),
    count: entries.length,
    byKey,
  };
}

export async function saveLeeDongjinIndex(index: LeeDongjinIndex): Promise<void> {
  await fs.mkdir(path.dirname(RATINGS_FILE), { recursive: true });
  const compact = {
    updatedAt: index.updatedAt,
    count: index.count,
    byKey: index.byKey,
  };
  await fs.writeFile(RATINGS_FILE, JSON.stringify(compact), "utf-8");
  memoryIndex = index;
}

export async function loadLeeDongjinIndex(): Promise<LeeDongjinIndex | null> {
  if (memoryIndex) return memoryIndex;
  try {
    const raw = await fs.readFile(RATINGS_FILE, "utf-8");
    memoryIndex = JSON.parse(raw) as LeeDongjinIndex;
    return memoryIndex;
  } catch {
    return null;
  }
}

/** CI: 캐시 우선. 로컬: 전체 수집. */
export async function ensureLeeDongjinIndex(): Promise<LeeDongjinIndex | null> {
  const cached = await loadLeeDongjinIndex();
  const forceRefresh = process.env.REFRESH_LDJ === "true";

  if (cached && isCacheFresh(cached) && !forceRefresh) {
    console.log(`[sync] lee-dongjin: cache hit (${cached.count} ratings)`);
    return cached;
  }

  if (process.env.CI === "true" && cached && cached.count > 500 && !forceRefresh) {
    console.log(`[sync] lee-dongjin: CI using existing cache (${cached.count})`);
    return cached;
  }

  const maxPages = process.env.CI === "true" ? 60 : undefined;
  console.log(
    `[sync] lee-dongjin: fetching from Watcha${maxPages ? ` (max ${maxPages} pages)` : ""}...`
  );

  try {
    const fresh = await fetchAllLeeDongjinRatings({ maxPages });
    await saveLeeDongjinIndex(fresh);
    return fresh;
  } catch (err) {
    console.warn("[sync] lee-dongjin fetch failed:", err);
    return cached;
  }
}

export function lookupLeeDongjin(
  movie: CuratedMovie,
  index: LeeDongjinIndex | null
): number | undefined {
  if (!index) return undefined;

  const candidates = [
    makeLookupKey(movie.title, movie.year),
    makeLookupKey(movie.title),
  ];

  const english = movie.fullPath?.split("/").pop()?.replace(/-/g, " ");
  if (english && !/[가-힣]/.test(english)) {
    candidates.push(makeLookupKey(english, movie.year));
    candidates.push(makeLookupKey(english));
  }

  for (const key of candidates) {
    const score = index.byKey[key];
    if (score !== undefined) return score;
  }

  return undefined;
}
