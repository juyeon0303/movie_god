import { embedMovies, embeddingsEnabled, movieDocument } from "../src/lib/embeddings";
import { buildTierSnapshot } from "../src/lib/pipeline-build";
import { initSnapshotStore, saveTierSnapshot } from "../src/lib/snapshot-store";
import { ALL_PLATFORMS } from "../src/lib/snapshot-types";
import { initVectorStore, savePlatformEmbeddings } from "../src/lib/vector-store";

async function main() {
  console.log("[sync] starting tier snapshot build...");
  console.log(
    `[sync] storage: ${process.env.DATABASE_URL ? "postgresql + files" : "data/snapshots/*.json"}`
  );

  await initSnapshotStore();
  await initVectorStore();

  for (const platform of ALL_PLATFORMS) {
    try {
      const snapshot = await buildTierSnapshot(platform);
      await saveTierSnapshot(snapshot);
      console.log(
        `[sync] saved ${platform}: curated=${snapshot.curated.length} trash=${snapshot.trash.length} all=${snapshot.all.length}`
      );

      if (embeddingsEnabled() && snapshot.curated.length > 0) {
        try {
          console.log(
            `[sync] embedding ${snapshot.curated.length} curated movies for ${platform}...`
          );
          const vectors = await embedMovies(snapshot.curated);
          const documents = new Map(
            snapshot.curated.map((m) => [m.id, movieDocument(m)])
          );
          await savePlatformEmbeddings(
            platform,
            [...vectors.entries()].map(([id, embedding]) => ({ id, embedding })),
            documents
          );
          console.log(`[sync] embeddings saved for ${platform}`);
        } catch (embedErr) {
          console.warn(`[sync] embedding failed for ${platform}, snapshot kept:`, embedErr);
        }
      }
    } catch (platformErr) {
      console.error(`[sync] platform ${platform} failed:`, platformErr);
      throw platformErr;
    }
  }

  if (!embeddingsEnabled()) {
    console.warn("[sync] OPENAI_API_KEY 없음 — RAG 임베딩 스킵, 키워드 매칭만 사용");
  }

  console.log("[sync] done");
}

main().catch((err) => {
  console.error("[sync] failed:", err);
  process.exit(1);
});
