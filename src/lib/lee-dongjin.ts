import { promises as fs } from "fs";
import path from "path";
import type { CuratedMovie } from "./types";

/** 왓챠피디아 이동진 평론가 프로필 */
export const LEE_DONGJIN_WATCHA_USER = "DgwxAeQYNxrMj";

const RATINGS_FILE = path.join(process.cwd(), "data", "lee-dongjin", "ratings.json");
const WATCHA_API = "https://pedia.watcha.com";

export interface LeeDongjinEntry {
  title: string;
  year?: number;
  code: string;
  /** 0–100 (메타크리틱 호환 스케일) */
  score: number;
  rawRating: number;
}

export interface LeeDongjinIndex {
  updatedAt: string;
  count: number;
  byKey: Record<string, number>;
  entries: LeeDongjinEntry[];
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

/** 왓챠 raw(1–10) → 0–100 */
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

  while (attempts < 5) {
    const res = await fetch(url, { headers: WATCHA_HEADERS });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 8000));
      attempts++;
      continue;
    }
    if (!res.ok) throw new Error(`Watcha API ${res.status}: ${url}`);
    return res.json() as Promise<WatchaPage>;
  }
  throw new Error(`Watcha API rate limited: ${url}`);
}

/** 배치 전용 — 이동진 왓챠 전체 평점 수집 */
export async function fetchAllLeeDongjinRatings(): Promise<LeeDongjinIndex> {
  const entries: LeeDongjinEntry[] = [];
  let nextUri: string | null =
    `/api/users/${LEE_DONGJIN_WATCHA_USER}/contents/movies/ratings?order=recent&page=1&size=50`;

  while (nextUri) {
    const page = await fetchWatchaPage(nextUri);
    const batch = page.result?.result ?? [];

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

    nextUri = page.result?.next_uri ?? null;
    if (nextUri) await new Promise((r) => setTimeout(r, 350));
  }

  const byKey: Record<string, number> = {};
  for (const entry of entries) {
    const key = makeLookupKey(entry.title, entry.year);
    if (!(key in byKey)) byKey[key] = entry.score;
    const titleOnly = makeLookupKey(entry.title);
    if (!(titleOnly in byKey)) byKey[titleOnly] = entry.score;
  }

  return {
    updatedAt: new Date().toISOString(),
    count: entries.length,
    byKey,
    entries,
  };
}

export async function saveLeeDongjinIndex(index: LeeDongjinIndex): Promise<void> {
  await fs.mkdir(path.dirname(RATINGS_FILE), { recursive: true });
  await fs.writeFile(RATINGS_FILE, JSON.stringify(index), "utf-8");
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
