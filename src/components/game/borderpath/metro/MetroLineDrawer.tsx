"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Train,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  MetroStation,
  MetroLine,
} from "@/lib/games/borderpath/metroTypes";
import {
  METRO_LINES_MAP,
  getLineStationsCentered,
} from "@/lib/games/borderpath/metroEngine";

interface MetroLineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation: MetroStation;
  selectedLineId: string;
  onSelectLine: (lineId: string) => void;
  onSelectDestination: (lineId: string, destinationStationId: string) => void;
}

export const MetroLineDrawer: React.FC<MetroLineDrawerProps> = ({
  isOpen,
  onClose,
  currentStation,
  selectedLineId,
  onSelectLine,
  onSelectDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const centerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Active line object
  const activeLine: MetroLine | undefined = METRO_LINES_MAP[selectedLineId];

  // Available lines at current station
  const availableLines = useMemo(() => {
    return currentStation.lines
      .map((id) => METRO_LINES_MAP[id])
      .filter((l): l is MetroLine => Boolean(l));
  }, [currentStation.lines]);

  // Centered stations partition
  const { before, current, after } = useMemo(() => {
    if (!selectedLineId) return { before: [], current: null, after: [] };
    return getLineStationsCentered(selectedLineId, currentStation.id);
  }, [selectedLineId, currentStation.id]);

  // Auto-scroll to center on line change or drawer open
  useEffect(() => {
    if (isOpen && centerRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        centerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [isOpen, selectedLineId]);

  // Filtered stations for search
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filterStation = (st: MetroStation) => {
    if (!normalizedQuery) return true;
    return (
      st.name.toLowerCase().includes(normalizedQuery) ||
      st.normalizedName.includes(normalizedQuery)
    );
  };

  const filteredBefore = useMemo(() => before.filter(filterStation), [before, normalizedQuery]);
  const filteredAfter = useMemo(() => after.filter(filterStation), [after, normalizedQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 bottom-0 right-0 left-0 sm:left-auto sm:w-[420px] z-30 pointer-events-none flex justify-end">
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 top-14 bg-black/50 backdrop-blur-xs sm:hidden pointer-events-auto transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer Container: Stays strictly UNDER the top bar (top-14 h-[calc(100vh-3.5rem)]) */}
      <div
        className="pointer-events-auto w-full sm:w-[420px] h-full bg-slate-900/98 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col z-10 transition-transform duration-300 animate-in slide-in-from-right"
        style={{
          boxShadow: activeLine
            ? `-6px 0 28px -4px ${activeLine.bg}30`
            : undefined,
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/70 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Départ du tronçon
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  {currentStation.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer le volet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Line Switcher Tabs (Compartments) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {availableLines.map((line) => {
              const isSelected = line.id === selectedLineId;
              return (
                <button
                  key={line.id}
                  onClick={() => {
                    onSelectLine(line.id);
                    setSearchQuery("");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 border cursor-pointer ${
                    isSelected
                      ? "scale-105 shadow-md shadow-black/40"
                      : "opacity-65 hover:opacity-100 hover:scale-100 bg-slate-800/60 border-slate-700/60 text-slate-300"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: line.bg,
                          color: line.text,
                          borderColor: line.bg,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                    style={{
                      backgroundColor: isSelected ? "rgba(0,0,0,0.15)" : line.bg,
                      color: isSelected ? line.text : line.text,
                    }}
                  >
                    {line.num}
                  </span>
                  <span>{line.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subheader: Active Line Terminus & Search */}
        {activeLine && (
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/60 shrink-0">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium text-[11px]">Direction :</span>
              <span className="font-semibold text-slate-200 truncate max-w-[270px] text-[11px]">
                {activeLine.terminus[0]} ↔ {activeLine.terminus[1]}
              </span>
            </div>

            {/* Fast search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Rechercher sur la ${activeLine.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vertical Stations Scroller with Continuous Timeline Tracks */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 relative"
        >
          {/* Section 1: UPSTREAM (Vers Terminus A) */}
          {filteredBefore.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <ArrowUp className="w-3 h-3 text-cyan-400" />
                <span>Vers {activeLine?.terminus[0]}</span>
              </div>

              {filteredBefore.map((st, i) => {
                const distance = before.length - i;
                const isFirst = i === 0;
                return (
                  <StationRow
                    key={st.id}
                    station={st}
                    activeLine={activeLine!}
                    distanceLabel={`-${distance} st.`}
                    isFirst={isFirst}
                    isLast={false}
                    onSelect={() => onSelectDestination(activeLine!.id, st.id)}
                  />
                );
              })}
            </div>
          )}

          {/* Section 2: CURRENT ANCHOR STATION */}
          {current && (
            <div
              ref={centerRef}
              className="relative my-2 p-3 rounded-xl border bg-slate-800/95 shadow-xl z-10 transition-all"
              style={{
                borderColor: activeLine ? activeLine.bg : "#3b82f6",
                boxShadow: activeLine
                  ? `0 0 18px -2px ${activeLine.bg}45`
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ring-4 ring-slate-900"
                    style={{
                      backgroundColor: activeLine?.bg,
                      color: activeLine?.text,
                    }}
                  >
                    {activeLine?.num}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Station actuelle
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {current.name}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60">
                  Vous êtes ici
                </span>
              </div>
            </div>
          )}

          {/* Section 3: DOWNSTREAM (Vers Terminus B) */}
          {filteredAfter.length > 0 && (
            <div className="mt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <ArrowDown className="w-3 h-3 text-cyan-400" />
                <span>Vers {activeLine?.terminus[1]}</span>
              </div>

              {filteredAfter.map((st, i) => {
                const distance = i + 1;
                const isLast = i === filteredAfter.length - 1;
                return (
                  <StationRow
                    key={st.id}
                    station={st}
                    activeLine={activeLine!}
                    distanceLabel={`+${distance} st.`}
                    isFirst={false}
                    isLast={isLast}
                    onSelect={() => onSelectDestination(activeLine!.id, st.id)}
                  />
                );
              })}
            </div>
          )}

          {/* No results */}
          {filteredBefore.length === 0 && filteredAfter.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              Aucune station trouvée pour "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Progression irréversible : chaque trajet compte</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeLine?.stations.length} stations
          </span>
        </div>
      </div>
    </div>
  );
};

interface StationRowProps {
  station: MetroStation;
  activeLine: MetroLine;
  distanceLabel: string;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}

const StationRow: React.FC<StationRowProps> = ({
  station,
  activeLine,
  distanceLabel,
  isFirst,
  isLast,
  onSelect,
}) => {
  // Connecting lines at this station (excluding the current active line)
  const connectingLines = useMemo(() => {
    return station.lines
      .filter((l) => l !== activeLine.id)
      .map((id) => METRO_LINES_MAP[id])
      .filter((l): l is MetroLine => Boolean(l));
  }, [station.lines, activeLine.id]);

  return (
    <div
      onClick={onSelect}
      className="group relative flex items-stretch justify-between px-2.5 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer select-none"
    >
      {/* Continuous Timeline Track Column: Never cuts off regardless of scroll position */}
      <div className="relative flex flex-col items-center justify-center w-6 shrink-0 self-stretch mr-2.5">
        {/* Top Track Segment */}
        <div
          className="w-1 flex-1 transition-opacity"
          style={{
            backgroundColor: activeLine.bg,
            opacity: isFirst ? 0 : 0.45,
          }}
        />

        {/* Station Node Dot */}
        <div
          className="w-3.5 h-3.5 rounded-full border-2 bg-slate-900 group-hover:scale-125 transition-transform shrink-0 z-10 shadow-sm"
          style={{ borderColor: activeLine.bg }}
        />

        {/* Bottom Track Segment */}
        <div
          className="w-1 flex-1 transition-opacity"
          style={{
            backgroundColor: activeLine.bg,
            opacity: isLast ? 0 : 0.45,
          }}
        />
      </div>

      {/* Station Name & Transfer Badges */}
      <div className="py-2.5 flex-1 min-w-0 pr-2">
        <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
          {station.name}
        </div>

        {/* Transfer badges */}
        {connectingLines.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] text-slate-400 font-medium mr-0.5">
              Corr.
            </span>
            {connectingLines.map((line) => (
              <span
                key={line.id}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 shadow-xs"
                style={{
                  backgroundColor: line.bg,
                  color: line.text,
                }}
                title={`Correspondance ${line.name}`}
              >
                {line.num}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Distance and Arrow Action */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-300 font-mono">
          {distanceLabel}
        </span>

        <div className="w-5 h-5 rounded-lg bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-all opacity-60 group-hover:opacity-100">
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
