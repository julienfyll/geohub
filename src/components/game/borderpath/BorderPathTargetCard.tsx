"use client";

import React from "react";
import { Target } from "lucide-react";

interface BorderPathTargetCardProps {
  minOptimalSteps: number;
  currentSteps: number;
  remainingSteps: number;
}

export const BorderPathTargetCard: React.FC<BorderPathTargetCardProps> = ({
  minOptimalSteps,
  currentSteps,
  remainingSteps,
}) => {
  const delta = currentSteps - minOptimalSteps;

  return (
    <div className="absolute bottom-8 left-4 sm:left-6 z-20 pointer-events-auto">
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl flex flex-col gap-2 min-w-[190px]">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Objectif Optimal</span>
          </div>
          {delta <= 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
              Par
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
              +{delta}
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-center py-0.5">
          <div className="flex flex-col items-center p-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-semibold">Cible (Pays)</span>
            <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-400">
              {minOptimalSteps}
            </span>
          </div>

          <div className="flex flex-col items-center p-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-semibold">Vos Pays</span>
            <span className="text-base sm:text-lg font-extrabold font-mono text-white">
              {currentSteps}
            </span>
          </div>
        </div>

        {/* Remaining distance hint */}
        {remainingSteps > 0 && (
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/60">
            <span>Distance restante :</span>
            <span className="font-mono font-bold text-amber-400">
              ~{remainingSteps} {remainingSteps > 1 ? "frontières" : "frontière"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
