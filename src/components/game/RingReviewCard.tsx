"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trophy, CheckCircle2, XCircle, Info, MapPin, Eye, Plane } from "lucide-react";
import { GameMetric, TopCityItem } from "@/lib/games/types";

export interface GuessRecord {
  id?: string;
  cityName: string;
  countryCode?: string;
  population?: number;
  passengerCount?: number;
  iata?: string;
  isTarget: boolean;
  isInRing?: boolean;
  rank?: number;
  latitude?: number;
  longitude?: number;
}

interface RingReviewCardProps {
  ringIndex: number;
  innerRadiusKm: number;
  outerRadiusKm: number;
  guesses: GuessRecord[];
  topCities: TopCityItem[];
  metric?: GameMetric;
  className?: string;
  pinnedCityIds?: Set<string>;
  hoveredCityId?: string | null;
  onCityHover?: (city: TopCityItem | GuessRecord | null) => void;
  onCityClick?: (city: TopCityItem | GuessRecord) => void;
}

function formatMetricValue(value: number | undefined, metric: GameMetric = "population"): string {
  if (value === undefined || value === null) return "";
  if (metric === "airports") {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M passagers / an`;
    }
    if (value >= 1_000) {
      return `${Math.round(value / 1_000).toLocaleString("fr-FR")}k passagers / an`;
    }
    return `${value.toLocaleString("fr-FR")} passagers / an`;
  }
  return `${value.toLocaleString("fr-FR")} hab.`;
}

export const RingReviewCard: React.FC<RingReviewCardProps> = ({
  ringIndex,
  innerRadiusKm,
  outerRadiusKm,
  guesses = [],
  topCities = [],
  metric = "population",
  className = "",
  pinnedCityIds,
  hoveredCityId,
  onCityHover,
  onCityClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAirports = metric === "airports";

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
          <span className="text-xs font-bold tracking-tight text-white uppercase flex items-center gap-1.5">
            {isAirports ? <Plane className="w-3.5 h-3.5 text-sky-400" /> : null}
            <span>Vos Essais & Top 3 {isAirports ? "Aéroports" : "Villes"}</span>
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
                {guesses.map((g, idx) => {
                  const guessId = g.id || `guess_${g.cityName}`;
                  const isPinned = pinnedCityIds?.has(guessId);
                  const isHovered = hoveredCityId === guessId;
                  const hasCoords = g.latitude !== undefined && g.longitude !== undefined;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => hasCoords && onCityHover?.(g)}
                      onMouseLeave={() => hasCoords && onCityHover?.(null)}
                      onClick={() => hasCoords && onCityClick?.(g)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
                        hasCoords ? "cursor-pointer group" : ""
                      } ${
                        isPinned
                          ? "bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/50"
                          : isHovered
                          ? "bg-slate-900 border-sky-500/60"
                          : "bg-slate-900/60 border-slate-800/60 hover:bg-slate-900/90 hover:border-slate-700"
                      }`}
                      title={hasCoords ? "Cliquez ou survolez pour localiser sur la carte" : undefined}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {g.isTarget ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-200 truncate">
                          {isAirports && g.iata ? `${g.cityName} (${g.iata})` : g.cityName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {g.isTarget
                            ? "1ᵉʳ (Cible)"
                            : g.rank
                            ? `${g.rank}ᵉ`
                            : "Hors anneau"}
                        </span>
                        {isPinned && (
                          <MapPin className="w-3 h-3 text-sky-400 fill-sky-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Section: Top 3 Most Populous Cities or Busiest Airports */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isAirports ? (
                  <Plane className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isAirports ? "Aéroports les plus fréquentés" : "Villes les plus peuplées"}</span>
              </div>
              <span className="text-[9px] text-sky-400/80 font-normal">Survol / Clic</span>
            </div>

            {topCities.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                {isAirports ? "Aucun aéroport commercial dans cet anneau." : "Aucune ville dans cet anneau."}
              </p>
            ) : (
              <div className="space-y-2">
                {topCities.slice(0, 3).map((city) => {
                  const medal =
                    city.rank === 1
                      ? "🥇"
                      : city.rank === 2
                      ? "🥈"
                      : "🥉";

                  const isPinned = pinnedCityIds?.has(city.id);
                  const isHovered = hoveredCityId === city.id;

                  const badgeBorder = isPinned
                    ? "border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/50 shadow-md shadow-sky-950/50"
                    : isHovered
                    ? "border-sky-500/70 bg-slate-900/90"
                    : city.rank === 1
                    ? "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60"
                    : "border-slate-800/80 bg-slate-900/40 hover:border-sky-500/50 hover:bg-slate-900/80";

                  const countValue = isAirports ? (city.passengerCount ?? city.population) : city.population;

                  return (
                    <div
                      key={city.id}
                      onMouseEnter={() => onCityHover?.(city)}
                      onMouseLeave={() => onCityHover?.(null)}
                      onClick={() => onCityClick?.(city)}
                      className={`p-2 rounded-xl border ${badgeBorder} flex items-center justify-between gap-2 transition-all cursor-pointer group`}
                      title={`Survolez ou cliquez pour afficher ${isAirports ? "cet aéroport" : "cette ville"} sur la carte`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{medal}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-100 truncate text-[11px] leading-tight flex items-center gap-1">
                            <span>{city.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({city.iata ? `${city.iata} · ` : ""}{city.countryCode})
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {formatMetricValue(countValue, metric)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isPinned ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-sky-300 bg-sky-950/90 border border-sky-500/60 px-1.5 py-0.5 rounded-full shadow-sm">
                            <MapPin className="w-2.5 h-2.5 fill-sky-400 text-sky-400" />
                            <span>Carte</span>
                          </span>
                        ) : city.rank === 1 ? (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Cible
                          </span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-sky-400 flex items-center gap-0.5 bg-slate-800/80 px-1.5 py-0.5 rounded border border-sky-500/30">
                            <Eye className="w-3 h-3" />
                            <span>Voir</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Hint & Official Census / Pax Note */}
          <div className="pt-1 flex flex-col gap-1 border-t border-slate-800/60 text-[10px] text-slate-500 leading-tight">
            <div className="flex items-center gap-1.5 text-sky-400/90 font-medium">
              <MapPin className="w-3 h-3 shrink-0 text-sky-400" />
              <span>
                {isAirports
                  ? "Survolez ou cliquez un aéroport pour le situer sur la carte"
                  : "Survolez ou cliquez une ville pour la situer sur la carte"}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {isAirports
                  ? "Trafic passagers annuel commercial officiel (DGAC / ACI / Eurostat)."
                  : "Populations officielles au sein des limites administratives."}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
