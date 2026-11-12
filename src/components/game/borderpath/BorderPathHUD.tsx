"use client";

import React from "react";
import Link from "next/link";
import {
  BorderPathEntity,
  BorderPathPack,
  BorderPathMode,
} from "@/lib/games/borderpath/types";
import { BorderPathMapTheme } from "./BorderPathMap";
import {
  Compass,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  Flag,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";

interface BorderPathHUDProps {
  pack: BorderPathPack;
  mode: BorderPathMode;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  visitedEntities: BorderPathEntity[];
  minOptimalSteps: number;
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
  visitedEntities,
  minOptimalSteps,
  remainingSteps,
  theme,
  hideBorders,
  onToggleTheme,
  onToggleHideBorders,
  onOpenRules,
  onGiveUp,
  onRestart,
}) => {
  const currentStep = visitedEntities.length;
  const delta = currentStep - minOptimalSteps;

  const packLabels: Record<BorderPathPack, string> = {
    monde: "Monde Continental",
    europe: "Europe",
    france_departements: "France — 96 Départements",
    ameriques: "Amériques",
    afrique: "Afrique",
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 pointer-events-none flex flex-col gap-2.5">
      {/* Top Bar: Platform Header + Target Corridor + Quick Controls */}
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

        {/* Center: Mission Corridor Badge (Start -> Target) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
          {/* Start Pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg">{startEntity.flagEmoji || "🏁"}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                Départ
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                {startEntity.name}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Target Pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg">{targetEntity.flagEmoji || "🎯"}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                Arrivée
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                {targetEntity.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Metrics */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Step Counter Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-semibold backdrop-blur-md shadow-lg">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Étapes
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-sm">
                <span>{currentStep}</span>
                <span className="text-slate-500 font-normal">/ {minOptimalSteps}</span>
              </div>
            </div>

            {delta > 0 ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                +{delta}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                Parfait
              </span>
            )}
          </div>

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

      {/* Corridor Breadcrumb Trail (Visited Sequence) */}
      <div className="pointer-events-auto flex items-center justify-center overflow-x-auto py-1 px-3 max-w-4xl mx-auto scrollbar-none">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl text-xs">
          {/* Start entity badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold shrink-0">
            <span>{startEntity.flagEmoji || "🏁"}</span>
            <span>{startEntity.name}</span>
          </div>

          {/* Steps */}
          {visitedEntities.map((e, idx) => (
            <React.Fragment key={e.id}>
              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border shrink-0 ${
                  idx === visitedEntities.length - 1
                    ? "bg-blue-950/90 border-blue-400 text-white font-extrabold ring-2 ring-blue-500/30"
                    : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-medium"
                }`}
              >
                <span>{e.flagEmoji || "📍"}</span>
                <span>{e.name}</span>
              </div>
            </React.Fragment>
          ))}

          {/* Target teaser if not yet reached */}
          {visitedEntities.every((e) => e.id !== targetEntity.id) && (
            <>
              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-bold shrink-0 opacity-70">
                <span>{targetEntity.flagEmoji || "🎯"}</span>
                <span>{targetEntity.name}</span>
                {remainingSteps > 0 && (
                  <span className="text-[10px] text-amber-500/80 font-mono">
                    (~{remainingSteps} frontières)
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
