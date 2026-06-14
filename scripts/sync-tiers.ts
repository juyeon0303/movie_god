import { ensureLeeDongjinIndex } from "../src/lib/lee-dongjin";
import { buildTierSnapshot } from "../src/lib/pipeline-build";
import { setLeeDongjinIndex } from "../src/lib/ratings";
import { initSnapshotStore, saveTierSnapshot } from "../src/lib/snapshot-store";
import { ALL_PLATFORMS } from "../src/lib/snapshot-types";
import type { OTTPlatform } from "../src/lib/types";

async function syncPlatform(platform: OTTPlatform): Promise<void> {
  const snapshot = await buildTierSnapshot(platform);
  await saveTierSnapshot(snapshot);
  console.log(
    `[sync] saved ${platform}: curated=${snapshot.curated.length} trash=${snapshot.trash.length} all=${snapshot.all.length}`
  );
}

async function main() {
  console.log("[sync] starting tier snapshot build...");
  console.log(`[sync] CI=${process.env.CI ?? "false"}`);

  await initSnapshotStore();

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

  console.log("[sync] done");
}

main().catch((err) => {
  console.error("[sync] failed:", err);
  process.exit(1);
});
