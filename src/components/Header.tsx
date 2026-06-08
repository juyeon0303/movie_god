type HeaderMode = "curated" | "trash";

interface HeaderProps {
  mode?: HeaderMode;
}

export function Header({ mode = "curated" }: HeaderProps) {
  const isHell = mode === "trash";

  return (
    <header
      className={`border-b backdrop-blur-xl transition-colors duration-500 ${
        isHell
          ? "border-red-500/30 bg-red-950/40"
          : "border-white/10 bg-black/40"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-[0.3em] ${
              isHell ? "text-red-400/80" : "text-amber-400/80"
            }`}
          >
            {isHell ? "Enter At Your Own Risk" : "Negative Curation"}
          </p>
          <h1 className="mt-1 text-2xl font-light tracking-tight text-white">
            {isHell ? (
              <>
                <span className="glitch-text font-black text-red-400" data-text="지옥">
                  지옥
                </span>
                <span className="text-red-200/50"> · </span>
                <span className="font-semibold text-red-300/80">Trash Only</span>
              </>
            ) : (
              <>
                Curation <span className="font-semibold text-amber-300">Only</span>
              </>
            )}
          </h1>
        </div>
        <p
          className={`hidden max-w-xs text-right text-sm sm:block ${
            isHell ? "text-red-300/70" : "text-zinc-400"
          }`}
        >
          {isHell ? (
            <>
              돈과 시간을 버리시겠습니까?
              <br />
              <span className="text-red-400/60">MC 45↓ · RT Rotten · 핵쓰레기만</span>
            </>
          ) : (
            <>
              쓰레기는 걸러내고, 명작만 남긴다.
              <br />
              <span className="text-zinc-500">이동진·MC·RT 블렌드 · 75+</span>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
