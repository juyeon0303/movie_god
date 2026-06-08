const query = `
query GetPopularTitles($country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!, $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy) {
    totalCount
    edges { node { content { title } watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) { package { shortName } } } }
  }
}
`;

for (const mt of [undefined, ["FLATRATE"], ["flatrate"]]) {
  const watchNowFilter = mt
    ? { packages: ["nfx"], monetizationTypes: mt }
    : { packages: ["nfx"] };

  const res = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
    body: JSON.stringify({
      operationName: "GetPopularTitles",
      variables: {
        country: "KR", language: "ko", first: 3,
        popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["nfx"] },
        watchNowFilter,
        popularTitlesSortBy: "POPULAR",
      },
      query,
    }),
  });
  const data = await res.json();
  console.log("mt=", mt, "total=", data.data?.popularTitles?.totalCount, "err=", data.errors?.[0]?.message);
}
