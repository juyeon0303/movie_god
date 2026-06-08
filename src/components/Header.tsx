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
              "평론 점수 하위 구간"
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
              <span className="font-medium text-panel-muted">평론 점수 기준</span>
              <br />
              <span className="font-semibold text-laser">Trash Cut 목록</span>
            </>
          ) : (
            <>
              <span className="font-medium text-gold">이동진 · MC · RT</span>
              <br />
              <span className="font-semibold text-gold">블렌드 75+ 명작만</span>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
