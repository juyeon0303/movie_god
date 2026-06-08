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
        content(country: $country, language: $language) {
          title
          scoring { imdbScore tmdbScore jwRating }
        }
      }
    }
  }
}
`;

let cursor = null;
for (let page = 0; page < 20; page++) {
  const res = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
    body: JSON.stringify({
      operationName: "GetPopularTitles",
      variables: {
        country: "KR", language: "ko", first: 40,
        popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["nfx"] },
        watchNowFilter: { packages: ["nfx"] },
        popularTitlesSortBy: "POPULAR",
        popularAfterCursor: cursor,
      },
      query,
    }),
  });
  const data = await res.json();
  const block = data.data?.popularTitles;
  for (const e of block.edges) {
    const t = e.node.content.title;
    if (/보헤미안|bohemian|rhapsody/i.test(t)) {
      console.log(JSON.stringify({ title: t, id: e.node.id, scoring: e.node.content.scoring }, null, 2));
    }
  }
  if (!block.pageInfo.hasNextPage) break;
  cursor = block.pageInfo.endCursor;
}
