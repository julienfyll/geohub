"use client";

import React from "react";
import { Target, CheckCircle2, Route } from "lucide-react";

export interface BorderPathTargetCardProps {
  optimalCountries: number;
  totalAttempts: number;
  uniquePlacedCount: number;
  errorCount?: number;
  remainingSteps: number;
}

export const BorderPathTargetCard: React.FC<BorderPathTargetCardProps> = ({
  optimalCountries,
  totalAttempts,
  uniquePlacedCount,
  errorCount = 0,
  remainingSteps,
}) => {
  const delta = totalAttempts - optimalCountries;
  const isOptimal = delta <= 0 && errorCount === 0;

  return (
    <div className="absolute bottom-8 left-4 sm:left-6 z-20 pointer-events-auto">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 w-80 sm:w-88 transition-all">
        {/* Header: Title + Explicit Optimal Status Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider shrink-0">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Objectif</span>
          </div>

          <div className="shrink-0">
            {isOptimal ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold font-mono whitespace-nowrap">
                🎯 Optimal (0)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold font-mono whitespace-nowrap">
                +{delta} {delta > 1 ? "coups" : "coup"}
              </span>
            )}
          </div>
        </div>

        {/* Primary Metrics: Optimal Target vs Player Attempts (Stacked vertically, 100% immune to overflow) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Chemin direct */}
          <div className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Chemin direct
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400 my-0.5 leading-none">
              {optimalCountries}
            </span>
            <span className="text-[11px] font-medium text-emerald-300/80 mt-0.5">
              pays minimum
            </span>
          </div>

          {/* Coups joués */}
          <div className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Coups joués
            </span>
            <span className="text-2xl font-black font-mono text-white my-0.5 leading-none">
              {totalAttempts}
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              pays + erreurs
            </span>
          </div>
        </div>

        {/* Transparent Breakdown of attempts (Explains placed + errors) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs">Pays validés sur la carte :</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-xs">
              {uniquePlacedCount}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  errorCount > 0 ? "bg-rose-400" : "bg-slate-600"
                }`}
              />
              <span className="text-xs">Erreurs (non limitrophes) :</span>
            </div>
            <span
              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                errorCount > 0
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-slate-500"
              }`}
            >
              {errorCount}
            </span>
          </div>

          {delta > 0 && (
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-xs text-amber-300/90 font-medium">
              <span>Écart vs chemin optimal :</span>
              <span className="font-mono font-bold">
                +{delta} {delta > 1 ? "coups" : "coup"}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Remaining BFS distance hint or Connected status */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {remainingSteps > 0 ? (
            <>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Route className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Distance restante :</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-xs">
                ~{remainingSteps} {remainingSteps > 1 ? "frontières" : "frontière"}
              </span>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Jonction établie !</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
