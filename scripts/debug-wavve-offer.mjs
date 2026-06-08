const query1 = `
query GetPopularTitles($country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!, $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy) {
    edges {
      node {
        content(country: $country, language: $language) { title }
        watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
          standardWebURL monetizationType
          package { shortName clearName }
        }
      }
    }
  }
}
`;

const vars = {
  country: "KR", language: "ko", first: 10,
  popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["wav"] },
  watchNowFilter: { packages: ["wav"] },
  popularTitlesSortBy: "POPULAR",
};

const res = await fetch("https://apis.justwatch.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
  body: JSON.stringify({ operationName: "GetPopularTitles", variables: vars, query: query1 }),
});
const data = await res.json();
for (const e of data.data?.popularTitles?.edges ?? []) {
  const n = e.node;
  const o = n.watchNowOffer;
  console.log(n.content.title, o ? `${o.package?.shortName} ${o.standardWebURL?.slice(0,50)}` : "NO_OFFER");
}
