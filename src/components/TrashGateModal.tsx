"use client";

import { useEffect } from "react";
import { Scissors } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

interface TrashGateModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrashGateModal({ open, onConfirm, onCancel }: TrashGateModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay/70 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trash-gate-title"
        className="relative w-full max-w-md border-2 border-laser bg-surface p-8 shadow-xl"
      >
        <div className="mb-4 flex flex-col items-center gap-3">
          <BrandLogo size="md" className="text-panel-ink" />
          <Scissors className="h-8 w-8 text-laser" strokeWidth={2} />
        </div>
        <h2
          id="trash-gate-title"
          className="font-ui text-center text-xl font-semibold text-panel-ink sm:text-2xl"
        >
          Trash <span className="text-laser">Cut</span> 들어감?
        </h2>
        <p className="font-ui mt-4 text-center text-sm leading-relaxed text-panel-muted">
          LDJ · MC · RT 합쳐서 하위로 밀린 목록.
          <br />
          작품 깎아내리는 거 아님. 숫자만.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-focus-ring font-ui border border-panel-border py-3 text-xs font-semibold text-panel-ink hover:border-gold/45 hover:text-gold"
          >
            안 감
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-focus-ring font-ui border-2 border-laser bg-laser/12 py-3 text-xs font-bold text-laser hover:bg-laser/18"
          >
            들어가기
          </button>
        </div>
      </div>
    </div>
  );
}
