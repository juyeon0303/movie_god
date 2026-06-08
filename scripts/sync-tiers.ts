import { embedMovies, embeddingsEnabled, movieDocument } from "../src/lib/embeddings";
import { ensureLeeDongjinIndex } from "../src/lib/lee-dongjin";
import { buildTierSnapshot } from "../src/lib/pipeline-build";
import { setLeeDongjinIndex } from "../src/lib/ratings";
import { initSnapshotStore, saveTierSnapshot } from "../src/lib/snapshot-store";
import { ALL_PLATFORMS } from "../src/lib/snapshot-types";
import type { OTTPlatform } from "../src/lib/types";
import { initVectorStore, savePlatformEmbeddings } from "../src/lib/vector-store";

async function syncPlatform(platform: OTTPlatform): Promise<void> {
  const snapshot = await buildTierSnapshot(platform);
  await saveTierSnapshot(snapshot);
  console.log(
    `[sync] saved ${platform}: curated=${snapshot.curated.length} trash=${snapshot.trash.length} all=${snapshot.all.length}`
  );

  if (!embeddingsEnabled() || snapshot.curated.length === 0) return;

  try {
    console.log(`[sync] embedding ${snapshot.curated.length} movies for ${platform}...`);
    const vectors = await embedMovies(snapshot.curated);
    const documents = new Map(snapshot.curated.map((m) => [m.id, movieDocument(m)]));
    await savePlatformEmbeddings(
      platform,
      [...vectors.entries()].map(([id, embedding]) => ({ id, embedding })),
      documents
    );
    console.log(`[sync] embeddings saved for ${platform}`);
  } catch (embedErr) {
    console.warn(`[sync] embedding failed for ${platform}:`, embedErr);
  }
}

async function main() {
  console.log("[sync] starting tier snapshot build...");
  console.log(`[sync] CI=${process.env.CI ?? "false"}`);

  await initSnapshotStore();
  await initVectorStore();

  const ldjIndex = await ensureLeeDongjinIndex();
  setLeeDongjinIndex(ldjIndex);

  const failures: string[] = [];

  for (const platform of ALL_PLATFORMS) {
    try {
      await syncPlatform(platform);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[sync] platform ${platform} failed:`, msg);
      failures.push(`${platform}: ${msg}`);
    }
  }

  if (failures.length === ALL_PLATFORMS.length) {
    throw new Error(`All platforms failed:\n${failures.join("\n")}`);
  }

  if (failures.length > 0) {
    console.warn(`[sync] partial success, failed: ${failures.join("; ")}`);
  }

  if (!embeddingsEnabled()) {
    console.warn("[sync] OPENAI_API_KEY 없음 — RAG 임베딩 스킵");
  }

  console.log("[sync] done");
}

main().catch((err) => {
  console.error("[sync] failed:", err);
  process.exit(1);
});
