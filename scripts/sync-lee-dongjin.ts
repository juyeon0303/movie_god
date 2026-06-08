import { fetchAllLeeDongjinRatings, saveLeeDongjinIndex } from "../src/lib/lee-dongjin";

async function main() {
  console.log("[ldj] fetching full Lee Dong-jin ratings...");
  const index = await fetchAllLeeDongjinRatings();
  await saveLeeDongjinIndex(index);
  console.log(`[ldj] saved ${index.count} ratings`);
}

main().catch((err) => {
  console.error("[ldj] failed:", err);
  process.exit(1);
});
