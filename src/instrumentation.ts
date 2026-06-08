export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") {
    return;
  }

  // 서버 기동 후 Netflix 캐시를 백그라운드에서 미리 채움
  setTimeout(() => {
    import("./lib/pipeline")
      .then((m) => m.fetchTieredMovies("nfx"))
      .catch((err) => console.warn("[warmup] nfx prefetch failed:", err));
  }, 3000);
}
