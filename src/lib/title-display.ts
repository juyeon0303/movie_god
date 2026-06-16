const HANGUL = /[\uAC00-\uD7A3]/;
const LATIN = /[a-zA-Z]/;

const ENGLISH_STOP_WORDS =
  /\b(the|of|and|from|in|on|at|a|an|to|for|with|vs|part|chapter|episode)\b/i;

function hasHangul(value: string): boolean {
  return HANGUL.test(value);
}

function hasLatin(value: string): boolean {
  return LATIN.test(value);
}

function stripWrappingQuotes(value: string): string {
  return value.replace(/^['"''""](.+)['"''""]$/, "$1").trim();
}

function isLikelyRomanization(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (/^(JSA|F1|TV|D|O|A-)$/i.test(trimmed)) return false;
  if (/^Vol\.\s*\d+$/i.test(trimmed)) return false;

  if (/^[a-z][a-z\s.]*$/.test(trimmed)) return true;

  const words = trimmed.split(/\s+/);
  return words.length >= 2 && words.every((word) => /^[A-Z][a-z]+$/.test(word));
}

function isLikelyEnglishTitle(text: string): boolean {
  return ENGLISH_STOP_WORDS.test(text);
}

function splitKoreanLatinSuffix(title: string): string | null {
  const match = title.match(/^([\uAC00-\uD7A3][\uAC00-\uD7A3\s·''\u318D:-]*)\s+([A-Za-z].*)$/);
  if (!match) return null;

  const hangulPart = stripWrappingQuotes(match[1].trim());
  const latinPart = match[2].trim();
  if (!hangulPart || !latinPart) return null;

  if (isLikelyRomanization(latinPart) || isLikelyEnglishTitle(latinPart)) {
    return hangulPart;
  }

  return null;
}

/** UI/API에 보여줄 한글 제목 정리 */
export function normalizeDisplayTitle(title: string): string {
  let value = title.normalize("NFKC").trim();
  if (!value) return value;

  const dashMatch = value.match(/^['"''""]?(.+?)['"''""]?\s*[-–—]\s*.+$/);
  if (dashMatch && hasHangul(dashMatch[1])) {
    return stripWrappingQuotes(dashMatch[1].trim());
  }

  const koreanOnly = splitKoreanLatinSuffix(value);
  if (koreanOnly) return koreanOnly;

  return value;
}

export function hasMixedKoreanLatin(title: string): boolean {
  return hasHangul(title) && hasLatin(title);
}

/** TMDB 등 외부 소스 제목을 JustWatch 한글 제목과 합칠 때 */
export function pickEnrichedTitle(sourceTitle: string, enrichedTitle?: string): string {
  const source = normalizeDisplayTitle(sourceTitle);
  if (!enrichedTitle?.trim()) return source;

  const enriched = normalizeDisplayTitle(enrichedTitle);
  if (!enriched) return source;
  if (enriched === source) return source;

  const sourceIsCleanKorean = hasHangul(source) && !hasLatin(source);
  const enrichedStillMixed = hasMixedKoreanLatin(enrichedTitle);

  if (sourceIsCleanKorean && enrichedStillMixed) return source;
  if (
    hasHangul(source) &&
    enriched.startsWith(source) &&
    enriched.length > source.length + 2
  ) {
    return source;
  }

  return enriched;
}

export function normalizeMovieTitle<T extends { title: string }>(movie: T): T {
  const title = normalizeDisplayTitle(movie.title);
  return title === movie.title ? movie : { ...movie, title };
}
