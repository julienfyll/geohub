"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import { BlindPointRoundResult } from "@/lib/games/blindpoint/types";
import { formatDistance } from "@/lib/games/blindpoint/scoring";

interface BlindPointResultModalProps {
  isOpen: boolean;
  roundResult: BlindPointRoundResult | null;
  roundIndex: number;
  totalRounds: number;
  onNextRound: () => void;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: (val: boolean) => void;
  autoAdvanceDelayMs?: number;
}

export const BlindPointResultModal: React.FC<BlindPointResultModalProps> = ({
  isOpen,
  roundResult,
  roundIndex,
  totalRounds,
  onNextRound,
  autoAdvance = false,
  onToggleAutoAdvance,
  autoAdvanceDelayMs = 1500,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState(autoAdvanceDelayMs);

  // Auto-advance countdown timer (1.5s - identique GeoRings)
  useEffect(() => {
    if (!isOpen || !autoAdvance) {
      setTimeLeftMs(autoAdvanceDelayMs);
      return;
    }

    setTimeLeftMs(autoAdvanceDelayMs);
    const intervalMs = 100;
    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= intervalMs) {
          clearInterval(timer);
          onNextRound();
          return 0;
        }
        return prev - intervalMs;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, autoAdvance, autoAdvanceDelayMs, onNextRound]);

  // Space / Enter advances to next round seamlessly
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.code === "Space") {
        e.preventDefault();
        onNextRound();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNextRound]);

  if (!isOpen || !roundResult) return null;

  const isFinalRound = roundIndex >= totalRounds - 1;
  const isBullseye = roundResult.distanceKm <= 1.0;
  const progressPercent = Math.max(
    0,
    Math.min(100, ((autoAdvanceDelayMs - timeLeftMs) / autoAdvanceDelayMs) * 100)
  );
  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div className="fixed bottom-6 inset-x-0 z-30 pointer-events-none flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="pointer-events-auto max-w-2xl w-full bg-slate-950/95 border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Rating Emoji, Target & Distance */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-2xl shrink-0 shadow-md">
            {roundResult.ratingEmoji}
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white break-words">
                {roundResult.target.name}
              </h2>
              {isBullseye && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider shrink-0">
                  Bullseye !
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Écart :</span>
              <span className="font-mono font-bold text-white">
                {formatDistance(roundResult.distanceKm)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{roundResult.ratingLabel}</span>
            </p>
          </div>
        </div>

        {/* Right: Score Pill & Next Button + Auto-advance switch */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {/* Score Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-center">
            <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block leading-none mb-1">
              Score
            </span>
            <span className="text-lg font-black text-blue-400 font-mono leading-none">
              +{roundResult.score.toLocaleString("fr-FR")}
            </span>
          </div>

          {/* Next Round CTA */}
          <button
            type="button"
            onClick={onNextRound}
            className="relative overflow-hidden flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-600/30 border border-blue-400 transition-all active:scale-95 whitespace-nowrap cursor-pointer group"
          >
            {autoAdvance && (
              <span
                className="absolute left-0 top-0 bottom-0 bg-blue-400/35 transition-all pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
            )}
            <span className="relative z-10">
              {isFinalRound ? "Bilan Final" : "Suivant"}
            </span>
            <span className="relative z-10 hidden sm:inline-block px-1.5 py-0.5 rounded bg-blue-700/80 text-[10px] font-mono text-blue-200">
              {autoAdvance ? `${secondsLeft}s` : "Espace"}
            </span>
            <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Auto-Advance Toggle Switch */}
          {onToggleAutoAdvance && (
            <div className="flex items-center gap-1.5 pl-1">
              <label
                htmlFor="blindpoint-auto-advance"
                className="text-xs text-slate-400 font-medium select-none cursor-pointer hidden sm:inline"
              >
                Auto
              </label>
              <button
                type="button"
                id="blindpoint-auto-advance"
                role="switch"
                aria-checked={autoAdvance}
                onClick={() => onToggleAutoAdvance(!autoAdvance)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-slate-700 transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoAdvance ? "bg-emerald-600" : "bg-slate-800"
                }`}
                title={autoAdvance ? "Passage automatique actif (1.5s)" : "Activer le passage automatique (1.5s)"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    autoAdvance ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
