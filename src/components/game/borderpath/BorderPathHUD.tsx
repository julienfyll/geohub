"use client";

import React from "react";
import Link from "next/link";
import {
  BorderPathEntity,
  BorderPathPack,
  BorderPathMode,
  BorderPathMapTheme,
} from "@/lib/games/borderpath/types";
import {
  Compass,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  Flag,
  RotateCcw,
} from "lucide-react";

interface BorderPathHUDProps {
  pack: BorderPathPack;
  mode: BorderPathMode;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  headA: BorderPathEntity;
  headB: BorderPathEntity;
  branchAEntities: BorderPathEntity[];
  branchBEntities: BorderPathEntity[];
  remainingSteps: number;
  theme: BorderPathMapTheme;
  hideBorders: boolean;
  onToggleTheme: () => void;
  onToggleHideBorders: () => void;
  onOpenRules: () => void;
  onGiveUp: () => void;
  onRestart: () => void;
}

export const BorderPathHUD: React.FC<BorderPathHUDProps> = ({
  pack,
  mode,
  startEntity,
  targetEntity,
  headA,
  headB,
  branchAEntities = [],
  branchBEntities = [],
  remainingSteps = 0,
  theme,
  hideBorders,
  onToggleTheme,
  onToggleHideBorders,
  onOpenRules,
  onGiveUp,
  onRestart,
}) => {
  const packLabels: Record<BorderPathPack, string> = {
    monde: "Monde Continental",
    europe: "Europe",
    france_departements: "France — 96 Départements",
    ameriques: "Amériques",
    afrique: "Afrique",
  };

  const hasMoves = (branchAEntities?.length || 0) > 1 || (branchBEntities?.length || 0) > 1;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 pointer-events-none flex flex-col gap-2.5">
      {/* Top Bar: Platform Header + Mission Corridor + Quick Controls */}
      <div className="flex items-center justify-between gap-3 w-full max-w-7xl mx-auto">
        {/* Left: Platform Logo & Mode Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-all group"
          >
            <Compass className="w-4 h-4 text-blue-400 group-hover:rotate-45 transition-transform" />
            <span className="font-bold text-xs tracking-tight">GeoHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-semibold backdrop-blur-md">
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
              BorderPath
            </span>
            <span className="text-slate-600">•</span>
            <span>{packLabels[pack]}</span>
            {mode === "daily" && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Défi du Jour
              </span>
            )}
          </div>
        </div>

        {/* Center: Mission Corridor Badge (Active Front A -> Active Front B) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
          {/* Front A Pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg">{headA.flagEmoji || "🏁"}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                {headA.id === startEntity.id ? "Départ" : "Front Départ"}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                {headA.name}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Front B Pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg">{headB.flagEmoji || "🎯"}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                {headB.id === targetEntity.id ? "Arrivée" : "Front Arrivée"}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                {headB.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Map theme switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-colors"
            title={`Changer de fond de carte (Actuel: ${theme})`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
          </button>

          {/* Carte Muette (Hide Borders) toggle */}
          <button
            type="button"
            onClick={onToggleHideBorders}
            className={`p-2 rounded-xl border shadow-lg backdrop-blur-md transition-colors ${
              hideBorders
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80"
            }`}
            title={hideBorders ? "Afficher les frontières" : "Masquer les frontières (Carte Muette)"}
          >
            {hideBorders ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={onRestart}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-colors"
            title="Recommencer ce défi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Give up button */}
          <button
            type="button"
            onClick={onGiveUp}
            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/60 shadow-lg backdrop-blur-md transition-colors"
            title="Abandonner & Voir la solution optimale"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Rules / Help */}
          <button
            type="button"
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-colors"
            title="Règles du jeu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Corridor Breadcrumb Trail - Displays the marching fronts when moves have started */}
      {hasMoves && (
        <div className="pointer-events-auto flex items-center justify-center overflow-x-auto py-1 px-3 max-w-4xl mx-auto scrollbar-none animate-slide-down">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl text-xs">
            {/* Branch A sequence */}
            {branchAEntities.map((e, idx) => (
              <React.Fragment key={`a-${e.id}`}>
                {idx > 0 && <ArrowRight className="w-3 h-3 text-cyan-600 shrink-0" />}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border shrink-0 ${
                    idx === branchAEntities.length - 1
                      ? "bg-cyan-950/90 border-cyan-400 text-white font-extrabold ring-2 ring-cyan-500/30"
                      : "bg-cyan-950/60 border-cyan-800 text-cyan-300 font-medium"
                  }`}
                >
                  <span>{e.flagEmoji || "📍"}</span>
                  <span>{e.name}</span>
                </div>
              </React.Fragment>
            ))}

            {/* Gap indicator */}
            <div className="px-2 py-1 text-slate-500 font-mono text-[11px] font-bold shrink-0 flex items-center gap-1">
              <span>···</span>
              {remainingSteps > 0 && (
                <span className="text-amber-400 text-[10px]">~{remainingSteps} fr.</span>
              )}
              <span>···</span>
            </div>

            {/* Branch B sequence (displayed in reverse order, marching inwards) */}
            {branchBEntities
              .slice()
              .reverse()
              .map((e, idx) => (
                <React.Fragment key={`b-${e.id}`}>
                  {idx > 0 && <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border shrink-0 ${
                      idx === 0
                        ? "bg-amber-950/90 border-amber-400 text-white font-extrabold ring-2 ring-amber-500/30"
                        : "bg-amber-950/60 border-amber-800 text-amber-300 font-medium"
                    }`}
                  >
                    <span>{e.flagEmoji || "📍"}</span>
                    <span>{e.name}</span>
                  </div>
                </React.Fragment>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
