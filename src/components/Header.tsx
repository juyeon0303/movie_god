export function Header() {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-400/80">
            Negative Curation
          </p>
          <h1 className="mt-1 text-2xl font-light tracking-tight text-white">
            Curation <span className="font-semibold text-amber-300">Only</span>
          </h1>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-zinc-400 sm:block">
          쓰레기는 걸러내고, 명작만 남긴다.
          <br />
          <span className="text-zinc-500">평론가 점수만 · MC/RT 75+</span>
        </p>
      </div>
    </header>
  );
}
