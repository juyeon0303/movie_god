"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Loader2, Moon, Zap } from "lucide-react";
import {
  pickWakeMessage,
  pickWakeTip,
  wakeProgress,
} from "@/lib/wake-messages";

const REVEAL_DELAY_MS = 1200;
const MESSAGE_INTERVAL_MS = 4800;
const TIP_INTERVAL_MS = 6200;

interface WakeUpWaitProps {
  active: boolean;
  variant?: "page" | "inline";
  accent?: "gold" | "laser";
}

export function WakeUpWait({
  active,
  variant = "page",
  accent = "gold",
}: WakeUpWaitProps) {
  const [elapsed, setElapsed] = useState(0);
  const [msgTick, setMsgTick] = useState(0);
  const [tipTick, setTipTick] = useState(0);

  const accentText = accent === "laser" ? "text-laser" : "text-gold";
  const accentBorder = accent === "laser" ? "border-laser/35" : "border-gold/40";
  const accentBg = accent === "laser" ? "bg-laser/12" : "bg-gold/12";
  const accentFill = accent === "laser" ? "bg-laser" : "bg-gold";

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      setMsgTick(0);
      setTipTick(0);
      return;
    }

    const start = Date.now();

    const tick = window.setInterval(() => {
      setElapsed(Date.now() - start);
    }, 200);

    return () => window.clearInterval(tick);
  }, [active]);

  useEffect(() => {
    if (!active || elapsed < REVEAL_DELAY_MS) return;
    const id = window.setInterval(() => setMsgTick((t) => t + 1), MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, elapsed]);

  useEffect(() => {
    if (!active || elapsed < REVEAL_DELAY_MS) return;
    const id = window.setInterval(() => setTipTick((t) => t + 1), TIP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, elapsed]);

  if (!active) return null;

  const showRich = elapsed >= REVEAL_DELAY_MS;
  const message = pickWakeMessage(elapsed, msgTick);
  const tip = pickWakeTip(tipTick);
  const progress = wakeProgress(elapsed);
  const seconds = Math.floor(elapsed / 1000);

  if (!showRich) {
    return (
      <div
        className={
          variant === "page"
            ? "flex items-center justify-center gap-3 py-24"
            : "mt-6 flex items-center justify-center gap-2 py-8"
        }
      >
        <Loader2 className={`h-5 w-5 animate-spin ${accentText}`} />
        <span className="font-ui text-sm text-silver">로딩…</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`mt-6 border ${accentBorder} bg-surface p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center border ${accentBorder} ${accentBg}`}>
            <Moon className={`h-4 w-4 ${accentText}`} />
          </div>
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={message.headline}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className={`font-ui text-sm font-semibold ${accentText}`}
              >
                {message.headline}
              </motion.p>
            </AnimatePresence>
            {message.sub && (
              <p className="font-ui mt-1 text-xs leading-relaxed text-panel-muted">{message.sub}</p>
            )}
            <div className="mt-3 h-1 overflow-hidden bg-panel-border">
              <motion.div
                className={`h-full ${accentFill}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="font-ui mt-2 text-[11px] text-panel-muted/90">
              {seconds >= 20 ? `${seconds}s 대기 · ` : ""}
              {tip}
            </p>
          </div>
          <Loader2 className={`h-4 w-4 shrink-0 animate-spin ${accentText}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-lg border border-panel-border bg-surface p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Moon className={`h-5 w-5 ${accentText}`} strokeWidth={2} />
            <span className={`font-ui text-xs font-semibold uppercase tracking-widest ${accentText}`}>
              서버 준비 중
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-panel-muted">
            <Coffee className="h-3.5 w-3.5" />
            <span className="font-ui text-[11px]">
              {seconds > 0 ? `${seconds}s` : "…"}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={message.headline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-ui text-lg font-semibold leading-snug text-panel-ink sm:text-xl">
              {message.headline}
            </h3>
            {message.sub && (
              <p className="font-ui mt-2 text-sm leading-relaxed text-panel-muted">{message.sub}</p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-ui text-[11px] text-panel-muted">로딩 중</span>
            <span className={`font-mono text-[11px] font-medium ${accentText}`}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden bg-panel-border">
            <motion.div
              className={`h-full ${accentFill}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={tip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-ui mt-5 flex items-start gap-2 border-t border-panel-border pt-4 text-xs leading-relaxed text-panel-muted"
          >
            <Zap className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accentText}`} />
            <span>{tip}</span>
          </motion.p>
        </AnimatePresence>

        <p className="font-ui mt-4 text-center text-[11px] text-panel-muted/80">
          첫 접속은 조금 걸릴 수 있어요
        </p>
      </div>
    </div>
  );
}
