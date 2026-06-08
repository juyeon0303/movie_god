import { cosineSimilarity, embedText, embeddingsEnabled, movieDocument } from "./embeddings";
import { filterByMood } from "./filters";
import { loadPlatformEmbeddings } from "./vector-store";
import type { CuratedMovie, OTTPlatform } from "./types";

export interface MoodSearchResult {
  movies: CuratedMovie[];
  fallback: boolean;
  method: "rag" | "keyword";
  topScore?: number;
}

export async function searchMoviesByMood(
  mood: string,
  curated: CuratedMovie[],
  platform: OTTPlatform,
  limit = 6
): Promise<MoodSearchResult> {
  if (!embeddingsEnabled()) {
    const { movies, fallback } = filterByMood(curated, mood, limit);
    return { movies, fallback, method: "keyword" };
  }

  const store = await loadPlatformEmbeddings(platform);
  if (!store || store.movies.length === 0) {
    const { movies, fallback } = filterByMood(curated, mood, limit);
    return { movies, fallback, method: "keyword" };
  }

  const curatedById = new Map(curated.map((m) => [m.id, m]));
  const queryVector = await embedText(
    `사용자 무드/상황: ${mood}\n이 감정에 맞는 명작 영화를 찾고 있습니다.`
  );

  const scored = store.movies
    .map((entry) => ({
      movie: curatedById.get(entry.id),
      similarity: cosineSimilarity(queryVector, entry.embedding),
    }))
    .filter((row): row is { movie: CuratedMovie; similarity: number } => !!row.movie)
    .sort((a, b) => b.similarity - a.similarity);

  const top = scored.slice(0, limit);
  const minSimilarity = 0.28;

  if (top.length === 0 || top[0].similarity < minSimilarity) {
    const { movies, fallback } = filterByMood(curated, mood, limit);
    return { movies, fallback, method: "keyword" };
  }

  return {
    movies: top.map((t) => t.movie),
    fallback: top[0].similarity < 0.38,
    method: "rag",
    topScore: top[0].similarity,
  };
}

export { movieDocument };
