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
          fullPath
          originalReleaseYear
          posterUrl
          shortDescription
          scoring {
            imdbScore
            tmdbScore
            jwRating
          }
        }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          standardWebURL
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

const variables = {
  country: "KR",
  language: "ko",
  first: 5,
  popularTitlesFilter: {
    objectTypes: ["MOVIE"],
    packages: ["nfx"],
  },
  watchNowFilter: {
    packages: ["nfx"],
  },
  popularTitlesSortBy: "POPULAR",
};

const res = await fetch("https://apis.justwatch.com/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    "App-Version": "3.9.0-web-web",
  },
  body: JSON.stringify({ operationName: "GetPopularTitles", variables, query }),
});

console.log("Status:", res.status);
const data = await res.json();
console.log(JSON.stringify(data, null, 2).slice(0, 3000));
