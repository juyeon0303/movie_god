const pkgs = ["wav", "wve", "wavve", "waa"];
const query = `query G($country:Country!,$f:TitleFilter,$w:WatchNowOfferFilter!,$first:Int!,$lang:Language!,$s:PopularTitlesSorting!){popularTitles(country:$country,filter:$f,first:$first,sortBy:$s){totalCount}}`;

for (const p of pkgs) {
  const r = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
    body: JSON.stringify({
      operationName: "G",
      variables: {
        country: "KR", language: "ko", first: 1,
        popularTitlesFilter: { objectTypes: ["MOVIE"], packages: [p] },
        watchNowFilter: { packages: [p] },
        popularTitlesSortBy: "POPULAR",
      },
      query,
    }),
  });
  const d = await r.json();
  console.log(p, d.data?.popularTitles?.totalCount ?? "err");
}
