import { promises as fs } from "fs";
import path from "path";
import type { TierSnapshot } from "./snapshot-types";
import type { OTTPlatform } from "./types";

const SNAPSHOT_DIR = path.join(process.cwd(), "data", "snapshots");

function useDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function ensureSnapshotDir(): Promise<void> {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
}

function snapshotFile(platform: OTTPlatform): string {
  return path.join(SNAPSHOT_DIR, `${platform}.json`);
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

export async function initSnapshotStore(): Promise<void> {
  await ensureSnapshotDir();

  if (!useDatabase()) return;

  try {
    const pool = await getPgPool();
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tier_snapshots (
          platform VARCHAR(8) PRIMARY KEY,
          payload JSONB NOT NULL,
          fetched_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    } finally {
      await pool.end();
    }
  } catch (err) {
    console.warn("[snapshot] PostgreSQL init skipped, using files only:", err);
  }
}

export async function saveTierSnapshot(snapshot: TierSnapshot): Promise<void> {
  await ensureSnapshotDir();
  await fs.writeFile(
    snapshotFile(snapshot.platform),
    JSON.stringify(snapshot),
    "utf-8"
  );

  if (!useDatabase()) return;

  try {
    const pool = await getPgPool();
    try {
      await pool.query(
        `INSERT INTO tier_snapshots (platform, payload, fetched_at, updated_at)
         VALUES ($1, $2::jsonb, $3::timestamptz, NOW())
         ON CONFLICT (platform)
         DO UPDATE SET
           payload = EXCLUDED.payload,
           fetched_at = EXCLUDED.fetched_at,
           updated_at = NOW()`,
        [snapshot.platform, JSON.stringify(snapshot), snapshot.fetchedAt]
      );
    } finally {
      await pool.end();
    }
  } catch (err) {
    console.warn(`[snapshot] DB upsert skipped for ${snapshot.platform}:`, err);
  }
}

export async function loadTierSnapshot(
  platform: OTTPlatform
): Promise<TierSnapshot | null> {
  if (useDatabase()) {
    const pool = await getPgPool();
    try {
      const result = await pool.query<{ payload: TierSnapshot }>(
        `SELECT payload FROM tier_snapshots WHERE platform = $1`,
        [platform]
      );
      if (result.rows[0]?.payload) return result.rows[0].payload;
    } finally {
      await pool.end();
    }
  }

  try {
    const raw = await fs.readFile(snapshotFile(platform), "utf-8");
    return JSON.parse(raw) as TierSnapshot;
  } catch {
    return null;
  }
}
