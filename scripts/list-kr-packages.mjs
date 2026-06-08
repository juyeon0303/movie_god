const res = await fetch("https://apis.justwatch.com/content/providers/locale/ko_KR");
const data = await res.json();
console.log(JSON.stringify(data.filter(p => 
  /wav|tiv|wet|watch|wave|쿠팡|coupang|disney|netflix/i.test(p.clear_name + p.short_name + p.technical_name)
), null, 2));
