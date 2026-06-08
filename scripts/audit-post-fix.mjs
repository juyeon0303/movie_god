const PLATFORMS = ["nfx", "dnp", "wav", "tvk"];
const DOMAINS = { nfx: "netflix.com", dnp: "disneyplus.com", wav: "wavve.com", tvk: "tving.com" };

function validate(platform, offer) {
  if (!offer?.standardWebURL) return false;
  if (offer.package?.shortName !== platform) return false;
  return offer.standardWebURL.toLowerCase().includes(DOMAINS[platform]);
}

const query = `
query GetPopularTitles(
  $country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!,
  $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!, $popularAfterCursor: String
) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy, after: $popularAfterCursor) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        objectType
        content(country: $country, language: $language) { title }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          standardWebURL
          package { shortName }
        }
      }
    }
  }
}
`;

console.log("=== 수정 후 OTT 검증 시뮬레이션 ===\n");

for (const pkg of PLATFORMS) {
  let verified = 0, skipped = 0, cursor = null, pages = 0;

  while (verified < 20 && pages < 10) {
    const r = await fetch("https://apis.justwatch.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
      body: JSON.stringify({
        operationName: "GetPopularTitles",
        variables: {
          country: "KR", language: "ko", first: 20,
          popularTitlesFilter: { objectTypes: ["MOVIE"], packages: [pkg] },
          watchNowFilter: { packages: [pkg], monetizationTypes: ["FLATRATE"] },
          popularTitlesSortBy: "POPULAR",
          popularAfterCursor: cursor,
        },
        query,
      }),
    });
    const d = await r.json();
    if (d.errors) { console.log(pkg, "ERR", d.errors[0].message); break; }
    const block = d.data.popularTitles;
    for (const e of block.edges) {
      if (e.node.objectType !== "MOVIE") continue;
      if (validate(pkg, e.node.watchNowOffer)) verified++;
      else skipped++;
      if (verified >= 20) break;
    }
    if (!block.pageInfo.hasNextPage || verified >= 20) break;
    cursor = block.pageInfo.endCursor;
    pages++;
  }
  const rate = verified > 0 ? "100%" : "0%";
  console.log(`${pkg}: 표시 ${verified}편 | 스킵 ${skipped}편 | 검증률 ${rate}`);
}
