// Simulate quality filter on TVING popular movies
const query = `
query GetPopularTitles(
  $country: Country!, $popularTitlesFilter: TitleFilter, $watchNowFilter: WatchNowOfferFilter!,
  $first: Int!, $language: Language!, $popularTitlesSortBy: PopularTitlesSorting!
) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: $popularTitlesSortBy) {
    edges {
      node {
        content(country: $country, language: $language) {
          title
          scoring { imdbScore tmdbScore }
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
      country: "KR", language: "ko", first: 40,
      popularTitlesFilter: { objectTypes: ["MOVIE"], packages: ["tvk"] },
      watchNowFilter: { packages: ["tvk"] },
      popularTitlesSortBy: "POPULAR",
    },
    query,
  }),
});
const data = await res.json();
const movies = data.data.popularTitles.edges.map((e) => e.node.content);

function quality(m) {
  const s = m.scoring;
  if (s.imdbScore) return Math.round(s.imdbScore * 10);
  if (s.tmdbScore) return Math.round(s.tmdbScore * 10);
  return null;
}

const curated = movies.filter((m) => { const q = quality(m); return q && q >= 75; });
const trash = movies.filter((m) => { const q = quality(m); return q && q <= 40; });

console.log("Total:", movies.length);
console.log("Curated (75+):", curated.length, curated.slice(0, 5).map((m) => m.title));
console.log("Trash (40-):", trash.length);
