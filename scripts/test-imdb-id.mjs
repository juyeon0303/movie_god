const query = `
query GetPopularTitles($country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!, $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy) {
    edges {
      node {
        content(country: $country, language: $language) {
          title
          fullPath
          externalIds { imdbId }
          scoring { imdbScore tmdbScore jwRating }
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
      country: "KR", language: "ko", first: 5,
      popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["nfx"] },
      watchNowFilter: { packages: ["nfx"] },
      popularTitlesSortBy: "POPULAR",
    },
    query,
  }),
});
console.log(JSON.stringify(await res.json(), null, 2).slice(0, 2000));
