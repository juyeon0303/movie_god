const query = `
query GetPopularTitles(
  $country: Country!,
  $popularTitlesFilter: TitleFilter,
  $watchNowFilter: WatchNowOfferFilter!,
  $first: Int!,
  $language: Language!,
  $popularTitlesSortBy: PopularTitlesSorting!
) {
  popularTitles(
    country: $country
    filter: $popularTitlesFilter
    first: $first
    sortBy: $popularTitlesSortBy
  ) {
    totalCount
    edges {
      node {
        id
        objectType
        content(country: $country, language: $language) {
          title
          scoring { imdbScore tmdbScore jwRating }
        }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          package { clearName shortName }
        }
      }
    }
  }
}
`;

const packages = ["tvg", "tvp", "tving", "tbi", "tiv", "tvc"];

for (const pkg of packages) {
  const res = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      "App-Version": "3.9.0-web-web",
    },
    body: JSON.stringify({
      operationName: "GetPopularTitles",
      variables: {
        country: "KR",
        language: "ko",
        first: 5,
        popularTitlesFilter: { objectTypes: ["MOVIE"], packages: [pkg] },
        watchNowFilter: { packages: [pkg] },
        popularTitlesSortBy: "POPULAR",
      },
      query,
    }),
  });
  const data = await res.json();
  const total = data.data?.popularTitles?.totalCount ?? 0;
  const titles = data.data?.popularTitles?.edges?.map((e) => e.node.content.title) ?? [];
  console.log(`[${pkg}] total=${total}`, titles.slice(0, 3).join(", "));
}

// Get all KR providers
const providersRes = await fetch("https://apis.justwatch.com/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    "App-Version": "3.9.0-web-web",
  },
  body: JSON.stringify({
    operationName: "GetPackages",
    variables: { country: "KR", language: "ko" },
    query: `query GetPackages($country: Country!) {
      packages(country: $country) {
        packageId
        clearName
        shortName
        technicalName
      }
    }`,
  }),
});
const providers = await providersRes.json();
const tvingLike = providers.data?.packages?.filter(
  (p) => p.clearName?.toLowerCase().includes("tving") || p.clearName?.includes("티빙")
);
console.log("\nTVING providers:", JSON.stringify(tvingLike, null, 2));
