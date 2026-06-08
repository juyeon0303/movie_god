import { readFileSync } from "fs";
import { pathToFileURL } from "url";

// Inline test - simulate Punisher scores that caused the bug
const movies = [
  {
    id: "tm1",
    title: "퍼니셔: 원 라스트 킬",
    scores: { imdb: 4.2, tmdb: 55, jwRating: 0.88 },
    platform: "nfx",
  },
  {
    id: "tm2",
    title: "좋은 영화",
    scores: { imdb: 8.5, tmdb: 85, jwRating: 0.92 },
    platform: "nfx",
  },
];

function resolveQualityScore(movie) {
  const { metacritic, rottenTomatoes, imdb, tmdb } = movie.scores;
  if (metacritic !== undefined) return metacritic;
  if (rottenTomatoes !== undefined) return rottenTomatoes;
  if (imdb !== undefined) return Math.round(imdb * 10);
  if (tmdb !== undefined) return tmdb;
  return null;
}

function passes(m) {
  const s = resolveQualityScore(m);
  return s !== null && s >= 75;
}

function trash(m) {
  const s = resolveQualityScore(m);
  return s !== null && s <= 40;
}

for (const m of movies) {
  const q = resolveQualityScore(m);
  console.log(m.title, {
    quality: q,
    curated: passes(m) && !trash(m),
    trash: trash(m) && !passes(m),
    jwIgnored: m.scores.jwRating,
  });
}
