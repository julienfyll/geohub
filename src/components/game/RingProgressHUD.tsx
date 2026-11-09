"use client";

import React from "react";
import { CheckCircle2, XCircle, Target } from "lucide-react";

export interface RingStatus {
  index: number;
  innerRadiusKm: number;
  outerRadiusKm: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  triesUsed: number;
  targetCityName?: string;
}

interface RingProgressHUDProps {
  rings: RingStatus[];
  currentRingIndex: number;
  className?: string;
}

export const RingProgressHUD: React.FC<RingProgressHUDProps> = ({
  rings,
  className = "",
}) => {
  return (
    <aside
      aria-label="Progression des anneaux"
      className={`flex flex-col gap-2 p-2 bg-slate-950/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-200 pointer-events-auto max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar ${className}`}
    >
      <div className="px-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">
        Anneaux
      </div>

      <div className="flex flex-col gap-1.5">
        {rings.map((ring) => {
          const isCurrent = ring.isCurrent;
          const isCompleted = ring.isCompleted;
          const isFailed = ring.isFailed;

          let badgeStyle = "bg-slate-900/50 border-slate-800/80 text-slate-500";
          let icon = <span className="font-mono text-xs font-bold text-slate-500">#{ring.index + 1}</span>;

          if (isCompleted) {
            badgeStyle = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm";
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
          } else if (isFailed) {
            badgeStyle = "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm";
            icon = <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
          } else if (isCurrent) {
            badgeStyle = "bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500/60 shadow-lg shadow-blue-500/20";
            icon = <Target className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin-slow" />;
          }

          return (
            <div
              key={ring.index}
              className={`w-16 sm:w-20 py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${badgeStyle}`}
              title={
                isCompleted
                  ? `Anneau ${ring.index + 1} réussi (${ring.triesUsed} essai(s))`
                  : isFailed
                  ? `Anneau ${ring.index + 1} échoué`
                  : isCurrent
                  ? `Anneau ${ring.index + 1} en cours`
                  : `Anneau ${ring.index + 1}`
              }
            >
              <div className="flex items-center gap-1 mb-0.5">
                {icon}
                <span className="text-[10px] font-bold font-mono">#{ring.index + 1}</span>
              </div>
              <span className="text-[9px] font-semibold tracking-tight text-center truncate max-w-full leading-tight">
                {ring.index === 0
                  ? `< ${ring.outerRadiusKm}km`
                  : `${ring.innerRadiusKm}-${ring.outerRadiusKm}km`}
              </span>
              {isCompleted && (
                <span className="text-[8px] font-mono text-emerald-400 font-bold mt-0.5">
                  {ring.triesUsed > 0 ? `${ring.triesUsed}e` : "✓"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
