const pkg = process.argv[2] ?? "tvk";
const query = `
query GetPopularTitles(
  $country: Country!,
  $popularTitlesFilter: TitleFilter,
  $watchNowFilter: WatchNowOfferFilter!,
  $first: Int!,
  $language: Language!,
  $popularTitlesSortBy: PopularTitlesSorting!
) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy) {
    edges {
      node {
        content(country: $country, language: $language) { title }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          package { shortName clearName }
        }
      }
    }
  }
}
`;

const res = await fetch("https://apis.justwatch.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
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
for (const e of data.data?.popularTitles?.edges ?? []) {
  const n = e.node;
  console.log(n.content.title, "->", n.watchNowOffer?.package?.clearName, n.watchNowOffer?.package?.shortName);
}
