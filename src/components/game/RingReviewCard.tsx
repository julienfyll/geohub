"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trophy, CheckCircle2, XCircle, Info, Sparkles } from "lucide-react";
import { TopCityItem } from "@/lib/games/types";

export interface GuessRecord {
  cityName: string;
  countryCode?: string;
  population?: number;
  isTarget: boolean;
  isInRing?: boolean;
  rank?: number;
}

interface RingReviewCardProps {
  ringIndex: number;
  innerRadiusKm: number;
  outerRadiusKm: number;
  guesses: GuessRecord[];
  topCities: TopCityItem[];
  className?: string;
}

export const RingReviewCard: React.FC<RingReviewCardProps> = ({
  ringIndex,
  innerRadiusKm,
  outerRadiusKm,
  guesses = [],
  topCities = [],
  className = "",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      aria-label={`Bilan pédagogique de l'anneau ${ringIndex + 1}`}
      className={`absolute top-20 left-4 z-30 w-72 sm:w-80 bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-200 overflow-hidden transition-all duration-200 flex flex-col pointer-events-auto ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold text-[10px]">
            {ringIndex + 1}
          </span>
          <span className="text-xs font-bold tracking-tight text-white uppercase">
            Vos Essais & Top 3
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? "Agrandir" : "Réduire"}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 flex flex-col gap-3.5 text-xs">
          {/* Section: Vos Essais */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Vos essais</span>
              <span className="text-slate-500 font-normal">
                {innerRadiusKm === 0 ? `< ${outerRadiusKm} km` : `${innerRadiusKm} - ${outerRadiusKm} km`}
              </span>
            </div>
            {guesses.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">Anneau passé sans essai.</p>
            ) : (
              <div className="space-y-1.5">
                {guesses.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {g.isTarget ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200 truncate">{g.cityName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {g.isTarget
                        ? "1ʳᵉ (Cible)"
                        : g.rank
                        ? `${g.rank}ᵉ`
                        : "Hors anneau"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Section: Top 3 Most Populous Cities */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Villes les plus peuplées</span>
            </div>

            {topCities.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">Aucune ville dans cet anneau.</p>
            ) : (
              <div className="space-y-2">
                {topCities.slice(0, 3).map((city) => {
                  const medal =
                    city.rank === 1
                      ? "🥇"
                      : city.rank === 2
                      ? "🥈"
                      : "🥉";

                  const badgeBorder =
                    city.rank === 1
                      ? "border-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800/80 bg-slate-900/40";

                  return (
                    <div
                      key={city.id}
                      className={`p-2 rounded-xl border ${badgeBorder} flex items-center justify-between gap-2 transition-all`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{medal}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-100 truncate text-[11px] leading-tight">
                            {city.name}
                            <span className="ml-1 text-[10px] font-mono text-slate-400">
                              ({city.countryCode})
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {city.population.toLocaleString("fr-FR")} hab.
                          </p>
                        </div>
                      </div>
                      {city.rank === 1 && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Cible
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Official Census Footer Note */}
          <div className="pt-1 flex items-start gap-1.5 text-[10px] text-slate-500 leading-tight">
            <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
            <span>Populations officielles au sein des limites administratives.</span>
          </div>
        </div>
      )}
    </aside>
  );
};
