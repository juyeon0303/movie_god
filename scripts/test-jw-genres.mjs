const query = `
query GetPopularTitles(
  $country: Country!,
  $popularTitlesFilter: TitleFilter,
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
    edges {
      node {
        id
        content(country: $country, language: $language) {
          title
          shortDescription
          genres {
            translation(language: $language)
            shortName
          }
        }
      }
    }
  }
}
`;

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
      first: 3,
      popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["nfx"] },
      popularTitlesSortBy: "POPULAR",
    },
    query,
  }),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2).slice(0, 2500));
