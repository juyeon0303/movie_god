import type { CuratedMovie, OTTPlatform } from "./types";
import { PLATFORMS } from "./types";
import { parseTmdbIdFromJustWatchId } from "./tmdb";
import { validateOttOffer } from "./ott-verify";

const JUSTWATCH_GRAPHQL = "https://apis.justwatch.com/graphql";

const DEFAULT_MAX_RAW_SCAN = 600;

const POPULAR_TITLES_QUERY = `
query GetPopularTitles(
  $country: Country!,
  $popularTitlesFilter: TitleFilter,
  $watchNowFilter: WatchNowOfferFilter!,
  $first: Int!,
  $language: Language!,
  $popularTitlesSortBy: PopularTitlesSorting!,
  $popularAfterCursor: String
) {
  popularTitles(
    country: $country
    filter: $popularTitlesFilter
    first: $first
    sortBy: $popularTitlesSortBy
    after: $popularAfterCursor
  ) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        objectType
        content(country: $country, language: $language) {
          title
          fullPath
          originalReleaseYear
          posterUrl
          shortDescription
          externalIds {
            imdbId
          }
          genres {
            translation(language: $language)
            shortName
          }
        }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          standardWebURL
          monetizationType
          package {
            clearName
            shortName
          }
        }
      }
    }
  }
}
`;

interface JustWatchNode {
  id: string;
  objectType: string;
  content: {
    title: string;
    fullPath: string;
    originalReleaseYear?: number;
    posterUrl?: string;
    shortDescription?: string;
    externalIds?: { imdbId?: string };
    genres?: Array<{ translation?: string; shortName?: string }>;
  };
  watchNowOffer?: {
    standardWebURL?: string;
    monetizationType?: string;
    package?: {
      clearName?: string;
      shortName?: string;
    };
  };
}

interface JustWatchResponse {
  data?: {
    popularTitles?: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      edges: Array<{ node: JustWatchNode }>;
    };
  };
  errors?: Array<{ message: string }>;
}

async function graphqlRequest(
  operationName: string,
  variables: Record<string, unknown>
): Promise<JustWatchResponse> {
  const res = await fetch(JUSTWATCH_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "App-Version": "3.9.0-web-web",
    },
    body: JSON.stringify({ operationName, variables, query: POPULAR_TITLES_QUERY }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`JustWatch API error: ${res.status}`);
  }

  const json: JustWatchResponse = await res.json();
  if (json.errors?.length) {
    throw new Error(`JustWatch GraphQL error: ${json.errors[0].message}`);
  }

  return json;
}

function resolvePosterUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const resolved = url
    .replace("{profile}", "s592")
    .replace("{format}", "jpg");
  return resolved.startsWith("http")
    ? resolved
    : `https://images.justwatch.com${resolved}`;
}

function nodeToMovie(node: JustWatchNode, platform: OTTPlatform): CuratedMovie | null {
  if (node.objectType !== "MOVIE") return null;

  const validation = validateOttOffer(platform, node.watchNowOffer);
  if (!validation.valid) {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[ott-verify] skip ${node.content.title}: ${validation.reason}`
      );
    }
    return null;
  }

  const offer = node.watchNowOffer!;

  return {
    id: node.id,
    imdbId: node.content.externalIds?.imdbId,
    tmdbId: parseTmdbIdFromJustWatchId(node.id) ?? undefined,
    title: node.content.title,
    year: node.content.originalReleaseYear,
    posterUrl: resolvePosterUrl(node.content.posterUrl),
    description: node.content.shortDescription,
    overview: node.content.shortDescription,
    genres: node.content.genres
      ?.map((g) => g.translation)
      .filter((g): g is string => !!g),
    platform,
    platformName: offer.package?.clearName ?? PLATFORMS[platform].name,
    watchUrl: offer.standardWebURL,
    fullPath: node.content.fullPath,
    ottVerified: true,
    scores: {},
  };
}

export async function fetchPlatformMovies(
  platform: OTTPlatform,
  limit = 40,
  maxRawScan = DEFAULT_MAX_RAW_SCAN
): Promise<CuratedMovie[]> {
  const movies: CuratedMovie[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let rawScanned = 0;
  let skipped = 0;

  while (hasMore && movies.length < limit && rawScanned < maxRawScan) {
    const batchSize = Math.min(20, limit - movies.length + 10);

    const json = await graphqlRequest("GetPopularTitles", {
      country: "KR",
      language: "ko",
      first: batchSize,
      popularTitlesFilter: {
        objectTypes: ["MOVIE"],
        packages: [platform],
      },
      watchNowFilter: {
        packages: [platform],
        monetizationTypes: ["FLATRATE"],
      },
      popularTitlesSortBy: "POPULAR",
      popularAfterCursor: cursor,
    });

    const popular = json.data?.popularTitles;
    if (!popular) break;

    for (const edge of popular.edges) {
      rawScanned++;
      const movie = nodeToMovie(edge.node, platform);
      if (movie) {
        movies.push(movie);
      } else {
        skipped++;
      }
      if (movies.length >= limit) break;
    }

    hasMore = popular.pageInfo.hasNextPage;
    cursor = popular.pageInfo.endCursor;
  }

  if (skipped > 0 && process.env.NODE_ENV === "development") {
    console.debug(
      `[justwatch] ${platform}: ${movies.length} verified, ${skipped} skipped (raw scanned: ${rawScanned})`
    );
  }

  return movies;
}

export async function fetchMultiPlatformMovies(
  platforms: OTTPlatform[] = ["nfx", "dnp"],
  limitPerPlatform = 30
): Promise<CuratedMovie[]> {
  const results = await Promise.all(
    platforms.map((p) => fetchPlatformMovies(p, limitPerPlatform))
  );
  return results.flat();
}
