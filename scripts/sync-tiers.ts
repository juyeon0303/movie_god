import { buildTierSnapshot } from "../src/lib/pipeline-build";
import { initSnapshotStore, saveTierSnapshot } from "../src/lib/snapshot-store";
import { ALL_PLATFORMS } from "../src/lib/snapshot-types";

async function main() {
  console.log("[sync] starting tier snapshot build...");
  console.log(
    `[sync] storage: ${process.env.DATABASE_URL ? "postgresql" : "data/snapshots/*.json"}`
  );

  await initSnapshotStore();

  for (const platform of ALL_PLATFORMS) {
    const snapshot = await buildTierSnapshot(platform);
    await saveTierSnapshot(snapshot);
    console.log(
      `[sync] saved ${platform}: curated=${snapshot.curated.length} trash=${snapshot.trash.length} all=${snapshot.all.length}`
    );
  }

  console.log("[sync] done");
}

main().catch((err) => {
  console.error("[sync] failed:", err);
  process.exit(1);
});
