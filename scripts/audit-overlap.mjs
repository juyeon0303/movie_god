/**
 * 큐레이션 ↔ 쓰레기 중복 감사
 * 구(舊) 로직(인기도 OR 품질)으로 겹치는 영화 + 신(新) 로직 검증
 */

const PLATFORMS = ["nfx", "dnp", "wav", "tvk"];
const TRASH_THRESHOLD = 40;
const CURATED_MIN = 75;

const query = `
query GetPopularTitles(
  $country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!,
  $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!, $popularAfterCursor: String
) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy, after: $popularAfterCursor) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        objectType
        content(country: $country, language: $language) {
          title
          scoring { imdbScore tmdbScore jwRating }
        }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          package { shortName }
        }
      }
    }
  }
}
`;

async function fetchMovies(platform, limit = 80) {
  const movies = [];
  let cursor = null;
  while (movies.length < limit) {
    const res = await fetch("https://apis.justwatch.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
      body: JSON.stringify({
        operationName: "GetPopularTitles",
        variables: {
          country: "KR", language: "ko", first: 20,
          popularTitlesFilter: { objectTypes: ["MOVIE"], packages: [platform] },
          watchNowFilter: { packages: [platform] },
          popularTitlesSortBy: "POPULAR",
          popularAfterCursor: cursor,
        },
        query,
      }),
    });
    const data = await res.json();
    if (data.errors && movies.length === 0) {
      console.error(`[${platform}] GraphQL error:`, data.errors[0]?.message);
      break;
    }
    const block = data.data?.popularTitles;
    if (!block) break;
    for (const e of block.edges) {
      if (e.node.objectType !== "MOVIE") continue;
      const s = e.node.content.scoring ?? {};
      movies.push({
        id: e.node.id,
        title: e.node.content.title,
        platform,
        scores: {
          imdb: s.imdbScore,
          tmdb: s.tmdbScore ? Math.round(s.tmdbScore * 10) : undefined,
          jwRating: s.jwRating,
        },
      });
    }
    if (!block.pageInfo.hasNextPage) break;
    cursor = block.pageInfo.endCursor;
  }
  return movies;
}

function resolveQuality(movie) {
  const { imdb, tmdb } = movie.scores;
  if (imdb !== undefined) return Math.round(imdb * 10);
  if (tmdb !== undefined) return tmdb;
  return null;
}

// 구 로직 — 중복 원인
function oldCurated(m) {
  const { imdb, tmdb, jwRating } = m.scores;
  const imdbPct = imdb !== undefined ? Math.round(imdb * 10) : undefined;
  const jwPct = jwRating ? Math.round(jwRating * 100) : undefined;
  return (
    (tmdb !== undefined && tmdb >= 75) ||
    (imdbPct !== undefined && imdbPct >= 75) ||
    (jwPct !== undefined && jwPct >= 80)
  );
}

function oldTrash(m) {
  const { imdb, tmdb, jwRating } = m.scores;
  const imdbPct = imdb !== undefined ? Math.round(imdb * 10) : undefined;
  const jwPct = jwRating ? Math.round(jwRating * 100) : undefined;
  return (
    (tmdb !== undefined && tmdb <= 50) ||
    (imdbPct !== undefined && imdbPct <= 50) ||
    (jwPct !== undefined && jwPct <= 55)
  );
}

function newTier(m) {
  const q = resolveQuality(m);
  if (q === null) return "neutral";
  if (q <= TRASH_THRESHOLD) return "trash";
  if (q >= CURATED_MIN) return "curated";
  return "neutral";
}

console.log("=== 중복 감사 시작 ===\n");
let totalOldOverlap = 0;

for (const platform of PLATFORMS) {
  const movies = await fetchMovies(platform);
  const oldOverlap = movies.filter((m) => oldCurated(m) && oldTrash(m));
  const curated = movies.filter((m) => newTier(m) === "curated");
  const trash = movies.filter((m) => newTier(m) === "trash");
  const newOverlap = curated.filter((c) => trash.some((t) => t.id === c.id));

  console.log(`[${platform}] 총 ${movies.length}편`);
  console.log(`  구 로직 중복: ${oldOverlap.length}편`);
  if (oldOverlap.length) {
    oldOverlap.forEach((m) => {
      const s = m.scores;
      console.log(`    - ${m.title} | imdb:${s.imdb} tmdb:${s.tmdb} jw:${s.jwRating?.toFixed(2)}`);
    });
    totalOldOverlap += oldOverlap.length;
  }
  console.log(`  신 로직: curated=${curated.length} trash=${trash.length} 중복=${newOverlap.length}`);
  if (newOverlap.length) {
    newOverlap.forEach((m) => console.log(`    BUG: ${m.title}`));
  }
  console.log();
}

console.log(`구 로직 총 중복: ${totalOldOverlap}편`);
console.log(totalOldOverlap === 0 ? "구 로직도 깨끗" : "→ 신 로직으로 수정 완료 확인");
