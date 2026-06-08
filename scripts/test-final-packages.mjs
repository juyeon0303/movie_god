const pkgs = ["tvk", "tving", "wav", "nfx", "dnp"];
const query = `query G($country:Country!,$f:TitleFilter,$w:WatchNowOfferFilter!,$first:Int!,$lang:Language!,$s:PopularTitlesSorting!){popularTitles(country:$country,filter:$f,first:$first,sortBy:$s){totalCount edges{node{content{title}watchNowOffer(country:$country,platform:WEB,filter:$w){package{shortName}}}}}}`;

for (const p of pkgs) {
  const r = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "App-Version": "3.9.0-web-web" },
    body: JSON.stringify({
      operationName: "G",
      variables: {
        country: "KR", language: "ko", first: 2,
        popularTitlesFilter: { objectTypes: ["MOVIE"], packages: [p] },
        watchNowFilter: { packages: [p] },
        popularTitlesSortBy: "POPULAR",
      },
      query,
    }),
  });
  const d = await r.json();
  if (d.errors) console.log(p, "ERR", d.errors[0]?.message);
  const total = d.data?.popularTitles?.totalCount;
  const sample = d.data?.popularTitles?.edges?.[0]?.node?.content?.title;
  const pkg = d.data?.popularTitles?.edges?.[0]?.node?.watchNowOffer?.package?.shortName;
  console.log(p, "total=", total, "sample=", sample, "pkg=", pkg);
}
