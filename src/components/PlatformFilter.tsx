"use client";

import { motion } from "framer-motion";
import type { OTTPlatform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import type { ViewMode } from "./ModeToggle";

interface PlatformFilterProps {
  selected: OTTPlatform;
  onChange: (platform: OTTPlatform) => void;
  mode?: ViewMode;
}

function platformTint(color: string, alpha = 0.12): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

export function PlatformFilter({
  selected,
  onChange,
  mode = "curated",
}: PlatformFilterProps) {
  const isTrash = mode === "trash";

  return (
    <div
      className={`inline-flex flex-wrap gap-1 border bg-surface p-1 ${
        isTrash ? "border-laser/25" : "border-panel-border"
      }`}
      role="tablist"
      aria-label="OTT platform"
    >
      {(Object.keys(PLATFORMS) as OTTPlatform[]).map((id) => {
        const platform = PLATFORMS[id];
        const isActive = selected === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`btn-focus-ring font-ui relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive ? "" : "text-panel-muted hover:text-panel-ink"
            }`}
            style={isActive ? { color: platform.color } : undefined}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = platform.color;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "";
            }}
          >
            {isActive && (
              <motion.span
                layoutId="platform-pill"
                className="absolute inset-0 border-b-2"
                style={{
                  backgroundColor: platformTint(platform.color, 0.1),
                  borderBottomColor: platform.color,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{platform.name}</span>
          </button>
        );
      })}
    </div>
  );
}
