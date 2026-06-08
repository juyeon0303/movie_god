"use client";

import type { OTTPlatform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";

interface PlatformFilterProps {
  selected: OTTPlatform;
  onChange: (platform: OTTPlatform) => void;
}

export function PlatformFilter({ selected, onChange }: PlatformFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(PLATFORMS) as OTTPlatform[]).map((id) => {
        const platform = PLATFORMS[id];
        const isActive = selected === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "text-white shadow-lg"
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
            style={
              isActive
                ? { backgroundColor: platform.color, boxShadow: `0 4px 20px ${platform.color}40` }
                : undefined
            }
          >
            {platform.name}
          </button>
        );
      })}
    </div>
  );
}
