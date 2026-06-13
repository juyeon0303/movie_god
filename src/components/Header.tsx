"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";
import type { ViewMode } from "./ModeToggle";

interface HeaderProps {
  mode?: ViewMode;
}

export function Header({ mode = "curated" }: HeaderProps) {
  const isTrash = mode === "trash";

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        isTrash ? "border-laser/30 bg-surface/95" : "border-panel-border bg-surface/95"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <motion.div layout="position" className="min-w-0">
          <p
            className={`font-ui text-xs font-medium uppercase tracking-[0.2em] ${
              isTrash ? "text-laser/90" : "text-panel-muted"
            }`}
          >
            {isTrash ? (
              "하위 점수대"
            ) : (
              <>
                <span className="text-laser font-semibold">Cut</span> The Trash
              </>
            )}
          </p>
          <h1 className="mt-1.5">
            <BrandLogo className="text-panel-ink" />
          </h1>
        </motion.div>

        <p
          className="font-ui hidden max-w-[260px] text-right text-sm leading-relaxed text-panel-muted lg:block"
        >
          {isTrash ? (
            <>
              <span className="font-medium text-panel-muted">숫자로 걸러진 구간</span>
              <br />
              <span className="font-semibold text-laser">Trash Cut</span>
            </>
          ) : (
            <>
              <span className="font-medium text-gold">LDJ · MC · RT</span>
              <br />
              <span className="font-semibold text-gold">75+만 통과</span>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
