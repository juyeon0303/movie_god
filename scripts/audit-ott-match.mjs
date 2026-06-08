/**
 * OTT 매칭 정확도 감사
 * - watchNowOffer 존재 여부
 * - package shortName 일치
 * - deeplink URL 유효성
 */

const PLATFORMS = {
  nfx: { name: "Netflix", domains: ["netflix.com"] },
  dnp: { name: "Disney+", domains: ["disneyplus.com", "disneyplus.com"] },
  wav: { name: "Wavve", domains: ["wavve.com"] },
  tvk: { name: "TVING", domains: ["tving.com"] },
};

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
        content(country: $country, language: $language) { title }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          standardWebURL
          package { clearName shortName }
        }
      }
    }
  }
}
`;

async function fetchSample(platform, limit = 40) {
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
    const block = data.data?.popularTitles;
    if (!block) break;
    for (const e of block.edges) {
      if (e.node.objectType === "MOVIE") movies.push(e.node);
    }
    if (!block.pageInfo.hasNextPage) break;
    cursor = block.pageInfo.endCursor;
  }
  return movies.slice(0, limit);
}

function auditMovie(node, expectedPkg) {
  const offer = node.watchNowOffer;
  const issues = [];

  if (!offer) issues.push("NO_OFFER");
  else {
    const pkg = offer.package?.shortName;
    if (!pkg) issues.push("NO_PACKAGE");
    else if (pkg !== expectedPkg) issues.push(`WRONG_PKG:${pkg}`);
    if (!offer.standardWebURL) issues.push("NO_URL");
    else {
      const info = PLATFORMS[expectedPkg];
      const url = offer.standardWebURL.toLowerCase();
      if (info && !info.domains.some((d) => url.includes(d))) {
        issues.push(`WRONG_DOMAIN:${offer.standardWebURL}`);
      }
    }
  }
  return issues;
}

console.log("=== OTT 매칭 정확도 감사 ===\n");
let totalIssues = 0;

for (const [pkg, info] of Object.entries(PLATFORMS)) {
  const movies = await fetchSample(pkg, 40);
  const problems = [];

  for (const node of movies) {
    const issues = auditMovie(node, pkg);
    if (issues.length) {
      problems.push({
        title: node.content.title,
        issues,
        offer: node.watchNowOffer,
      });
    }
  }

  const ok = movies.length - problems.length;
  console.log(`[${info.name}] ${pkg}`);
  console.log(`  샘플: ${movies.length}편 | 매칭 OK: ${ok} | 문제: ${problems.length}`);

  problems.slice(0, 5).forEach((p) => {
    console.log(`    ✗ ${p.title}: ${p.issues.join(", ")}`);
    if (p.offer?.package) console.log(`      pkg=${p.offer.package.shortName} url=${p.offer.standardWebURL?.slice(0, 60)}`);
  });
  console.log();

  totalIssues += problems.length;
}

console.log(`총 문제: ${totalIssues}건`);
console.log(totalIssues === 0 ? "✓ 모든 샘플 매칭 정확" : "→ 검증 로직 강화 필요");
