"use client";

import React from "react";
import { Heart, CheckCircle2, XCircle, Target } from "lucide-react";

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
  triesLeft: number;
  totalTries: number;
}

export const RingProgressHUD: React.FC<RingProgressHUDProps> = ({
  rings,
  currentRingIndex,
  triesLeft,
  totalTries = 3,
}) => {
  const activeRing = rings[currentRingIndex];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 5 Rings Navigation Bar */}
      <div className="grid grid-cols-5 gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        {rings.map((ring) => {
          let ringBadgeBg = "bg-slate-800/60 border-slate-700/50 text-slate-400";
          let icon = <span className="text-xs font-bold font-mono">#{ring.index + 1}</span>;

          if (ring.isCompleted) {
            ringBadgeBg = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
          } else if (ring.isFailed) {
            ringBadgeBg = "bg-rose-500/20 border-rose-500/50 text-rose-300";
            icon = <XCircle className="w-4 h-4 text-rose-400" />;
          } else if (ring.isCurrent) {
            ringBadgeBg = "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/40";
            icon = <Target className="w-4 h-4 animate-spin-slow" />;
          }

          return (
            <div
              key={ring.index}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${ringBadgeBg}`}
            >
              <div className="flex items-center gap-1 mb-0.5">{icon}</div>
              <span className="text-[10px] font-semibold tracking-tight text-center truncate max-w-full">
                {ring.index === 0
                  ? `< ${ring.outerRadiusKm} km`
                  : `${ring.innerRadiusKm}-${ring.outerRadiusKm} km`}
              </span>
              {ring.isCompleted && (
                <span className="text-[9px] font-mono text-emerald-400/90 font-medium">
                  {ring.triesUsed}/3
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Ring Sub-HUD & Lives */}
      {activeRing && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-lg backdrop-blur-md text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px]">
              {activeRing.index + 1}
            </span>
            <span className="text-slate-200 font-medium">
              Trouvez la ville la plus peuplée{" "}
              {activeRing.index === 0 ? (
                <>dans un rayon de <b className="text-blue-400">{activeRing.outerRadiusKm} km</b></>
              ) : (
                <>entre <b className="text-blue-400">{activeRing.innerRadiusKm}</b> et <b className="text-blue-400">{activeRing.outerRadiusKm} km</b></>
              )}
            </span>
          </div>

          {/* Lives Counter */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Vies :</span>
            {Array.from({ length: totalTries }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-transform duration-300 ${
                  i < triesLeft
                    ? "text-rose-500 fill-rose-500 scale-100"
                    : "text-slate-700 fill-slate-800 scale-90"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
