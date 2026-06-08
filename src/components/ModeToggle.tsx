"use client";

import { motion } from "framer-motion";
import { Scissors, Sparkles } from "lucide-react";

export type ViewMode = "curated" | "trash";

interface ModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const isTrash = mode === "trash";

  return (
    <div
      className={`relative grid grid-cols-2 gap-0 border-2 bg-surface p-1 font-ui text-xs font-semibold uppercase tracking-wide sm:text-sm ${
        isTrash ? "border-laser/40" : "border-gold/40"
      }`}
      role="tablist"
      aria-label="Curation mode"
    >
      <motion.div
        layoutId="mode-pill"
        className={`absolute inset-y-1 w-[calc(50%-2px)] border ${
          isTrash
            ? "left-[calc(50%+1px)] border-laser/35 bg-laser/14"
            : "left-1 border-emerald/30 bg-emerald/14"
        }`}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      />

      <button
        type="button"
        role="tab"
        aria-selected={!isTrash}
        onClick={() => onChange("curated")}
        className={`btn-focus-ring relative z-10 flex items-center justify-center gap-2 px-3 py-4 transition-all sm:py-5 ${
          !isTrash
            ? "font-bold text-emerald"
            : "text-panel-muted hover:text-panel-ink"
        }`}
      >
        <Sparkles className={`h-4 w-4 shrink-0 ${!isTrash ? "text-gold" : ""}`} strokeWidth={2} />
        <span className="hidden sm:inline">Approved Masterpieces</span>
        <span className="sm:hidden">Approved</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={isTrash}
        onClick={() => onChange("trash")}
        className={`btn-focus-ring relative z-10 flex items-center justify-center gap-2 px-3 py-4 transition-all sm:py-5 ${
          isTrash ? "font-bold text-laser" : "text-panel-muted hover:text-panel-ink"
        }`}
      >
        <Scissors
          className={`h-4 w-4 shrink-0 ${isTrash ? "text-laser" : "text-laser/70"}`}
          strokeWidth={2}
        />
        <span>
          Trash <span className={isTrash ? "font-bold text-laser" : ""}>Cut</span>
        </span>
      </button>
    </div>
  );
}
