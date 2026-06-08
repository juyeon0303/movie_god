import { promises as fs } from "fs";
import path from "path";
import type { OTTPlatform } from "./types";
import { EMBEDDING_DIMENSION } from "./embeddings";

export interface StoredEmbedding {
  id: string;
  embedding: number[];
}

export interface PlatformEmbeddings {
  platform: OTTPlatform;
  model: string;
  dimension: number;
  updatedAt: string;
  movies: StoredEmbedding[];
}

const EMBEDDING_DIR = path.join(process.cwd(), "data", "embeddings");

function embeddingFile(platform: OTTPlatform): string {
  return path.join(EMBEDDING_DIR, `${platform}.json`);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(EMBEDDING_DIR, { recursive: true });
}

async function getPgPool() {
  const { Pool } = await import("pg");
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });
}

function usePgVector(): boolean {
  return Boolean(process.env.DATABASE_URL) && process.env.USE_PGVECTOR === "true";
}

export async function initVectorStore(): Promise<void> {
  await ensureDir();

  if (!usePgVector()) return;

  const pool = await getPgPool();
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movie_embeddings (
        movie_id TEXT NOT NULL,
        platform VARCHAR(8) NOT NULL,
        embedding vector(${EMBEDDING_DIMENSION}) NOT NULL,
        document_text TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (movie_id, platform)
      )
    `);
  } catch (err) {
    console.warn("[vector] pgvector init skipped:", err);
  } finally {
    await pool.end();
  }
}

export async function savePlatformEmbeddings(
  platform: OTTPlatform,
  movies: StoredEmbedding[],
  documents: Map<string, string>
): Promise<void> {
  await ensureDir();

  const payload: PlatformEmbeddings = {
    platform,
    model: "text-embedding-3-small",
    dimension: EMBEDDING_DIMENSION,
    updatedAt: new Date().toISOString(),
    movies,
  };

  await fs.writeFile(embeddingFile(platform), JSON.stringify(payload), "utf-8");

  if (!usePgVector()) return;

  const pool = await getPgPool();
  try {
    for (const item of movies) {
      const doc = documents.get(item.id) ?? "";
      await pool.query(
        `INSERT INTO movie_embeddings (movie_id, platform, embedding, document_text, updated_at)
         VALUES ($1, $2, $3::vector, $4, NOW())
         ON CONFLICT (movie_id, platform)
         DO UPDATE SET embedding = EXCLUDED.embedding, document_text = EXCLUDED.document_text, updated_at = NOW()`,
        [item.id, platform, `[${item.embedding.join(",")}]`, doc]
      );
    }
  } catch (err) {
    console.warn("[vector] pgvector upsert failed, file store only:", err);
  } finally {
    await pool.end();
  }
}

export async function loadPlatformEmbeddings(
  platform: OTTPlatform
): Promise<PlatformEmbeddings | null> {
  if (usePgVector()) {
    const pool = await getPgPool();
    try {
      const result = await pool.query<{
        movie_id: string;
        embedding: string;
      }>(
        `SELECT movie_id, embedding::text FROM movie_embeddings WHERE platform = $1`,
        [platform]
      );
      if (result.rows.length > 0) {
        return {
          platform,
          model: "text-embedding-3-small",
          dimension: EMBEDDING_DIMENSION,
          updatedAt: new Date().toISOString(),
          movies: result.rows.map((row) => ({
            id: row.movie_id,
            embedding: JSON.parse(row.embedding) as number[],
          })),
        };
      }
    } catch {
      // fall through to file
    } finally {
      await pool.end();
    }
  }

  try {
    const raw = await fs.readFile(embeddingFile(platform), "utf-8");
    return JSON.parse(raw) as PlatformEmbeddings;
  } catch {
    return null;
  }
}
