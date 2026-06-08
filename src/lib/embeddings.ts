import type { CuratedMovie } from "./types";
import { resolveCriticScore } from "./filters";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

export function movieDocument(movie: CuratedMovie): string {
  const score = resolveCriticScore(movie);
  const parts = [
    `제목: ${movie.title}`,
    movie.year ? `개봉: ${movie.year}` : "",
    movie.genres?.length ? `장르: ${movie.genres.join(", ")}` : "",
    movie.scores.leeDongjin !== undefined
      ? `이동진평점: ${movie.scores.leeDongjin}`
      : "",
    score !== null ? `종합평론가점수: ${score}` : "",
    movie.overview || movie.description
      ? `줄거리: ${(movie.overview || movie.description || "").slice(0, 400)}`
      : "",
  ].filter(Boolean);

  return parts.join("\n");
}

function getOpenAIKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export function embeddingsEnabled(): boolean {
  return Boolean(getOpenAIKey());
}

async function callEmbeddings(inputs: string[]): Promise<number[][]> {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY required for embeddings");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: inputs,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const sorted = [...data.data].sort(
    (a: { index: number }, b: { index: number }) => a.index - b.index
  );
  return sorted.map((item: { embedding: number[] }) => item.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await callEmbeddings([text]);
  return vector;
}

export async function embedMovies(
  movies: CuratedMovie[],
  batchSize = 20
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    const docs = batch.map(movieDocument);
    const vectors = await callEmbeddings(docs);
    batch.forEach((movie, idx) => result.set(movie.id, vectors[idx]));
    if (i + batchSize < movies.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return result;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export const EMBEDDING_DIMENSION = EMBEDDING_DIM;
