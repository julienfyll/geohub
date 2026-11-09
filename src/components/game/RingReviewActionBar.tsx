"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCw } from "lucide-react";

interface RingReviewActionBarProps {
  isLastRing: boolean;
  autoAdvance: boolean;
  onNextRing: () => void;
  onToggleAutoAdvance: (val: boolean) => void;
  autoAdvanceDelayMs?: number;
}

export const RingReviewActionBar: React.FC<RingReviewActionBarProps> = ({
  isLastRing,
  autoAdvance,
  onNextRing,
  onToggleAutoAdvance,
  autoAdvanceDelayMs = 1500,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState(autoAdvanceDelayMs);

  useEffect(() => {
    if (!autoAdvance) {
      setTimeLeftMs(autoAdvanceDelayMs);
      return;
    }

    setTimeLeftMs(autoAdvanceDelayMs);
    const intervalMs = 100;
    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= intervalMs) {
          clearInterval(timer);
          onNextRing();
          return 0;
        }
        return prev - intervalMs;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoAdvance, autoAdvanceDelayMs, onNextRing]);

  const progressPercent = Math.max(0, Math.min(100, ((autoAdvanceDelayMs - timeLeftMs) / autoAdvanceDelayMs) * 100));
  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
      {/* Keyboard Shortcut Hint */}
      <span className="text-[11px] font-medium text-slate-400 backdrop-blur-md px-2.5 py-0.5 rounded-full bg-slate-950/70 border border-slate-800/80 shadow-md">
        {isLastRing ? "Terminer la partie" : "Question suivante"}{" "}
        <span className="text-slate-200 font-semibold font-mono">Entrée</span> ou{" "}
        <span className="text-slate-200 font-semibold font-mono">Espace</span>
      </span>

      {/* Main Bar with Action Button & Auto-advance Switch */}
      <div className="flex items-center gap-3 p-1.5 pl-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl">
        {/* Next Question / Finish Button */}
        <button
          type="button"
          onClick={onNextRing}
          className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/25 active:scale-95 group"
        >
          {autoAdvance && (
            <span
              className="absolute left-0 top-0 bottom-0 bg-blue-400/30 transition-all pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
          )}
          <span className="relative z-10">
            {isLastRing ? "Voir le bilan final" : "Anneau suivant"}
          </span>
          <kbd className="relative z-10 px-1.5 py-0.5 rounded bg-blue-700/80 border border-blue-400/40 font-mono text-[9px] text-blue-100">
            {autoAdvance ? `${secondsLeft}s` : "Espace"}
          </kbd>
          <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="h-6 w-px bg-slate-800" />

        {/* Auto-Advance Toggle Switch */}
        <div className="flex items-center gap-2 pr-2.5">
          <label
            htmlFor="auto-advance-toggle"
            className="text-xs text-slate-300 font-medium select-none cursor-pointer flex items-center gap-1.5"
          >
            <span>Passage auto</span>
          </label>
          <button
            type="button"
            id="auto-advance-toggle"
            role="switch"
            aria-checked={autoAdvance}
            onClick={() => onToggleAutoAdvance(!autoAdvance)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-slate-700 transition-colors duration-200 ease-in-out focus:outline-none ${
              autoAdvance ? "bg-emerald-600" : "bg-slate-800"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                autoAdvance ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
