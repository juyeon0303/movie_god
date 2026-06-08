const query = `
query GetPopularTitles($country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!, $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy) {
    edges {
      node {
        content(country: $country, language: $language) { title }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          standardWebURL monetizationType
          package { shortName }
        }
      }
    }
  }
}
`;

for (const flat of [false, true]) {
  const watchNowFilter = flat
    ? { packages: ["wav"], monetizationTypes: ["FLATRATE"] }
    : { packages: ["wav"] };

  const res = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
    body: JSON.stringify({
      operationName: "GetPopularTitles",
      variables: {
        country: "KR", language: "ko", first: 20,
        popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["wav"] },
        watchNowFilter,
        popularTitlesSortBy: "POPULAR",
      },
      query,
    }),
  });
  const data = await res.json();
  const edges = data.data?.popularTitles?.edges ?? [];
  const ok = edges.filter((e) => e.node.watchNowOffer?.package?.shortName === "wav").length;
  console.log(`flatrate=${flat}: total=${edges.length} with_offer=${ok}`);
}
