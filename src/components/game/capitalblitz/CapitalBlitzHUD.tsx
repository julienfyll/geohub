"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  RotateCcw,
  Settings,
  HelpCircle,
  ArrowLeft,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";

export interface CapitalBlitzHUDProps {
  timeLeftSeconds: number;
  totalDurationSeconds: number;
  score: number;
  comboMultiplier: number;
  correctCount: number;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export const CapitalBlitzHUD: React.FC<CapitalBlitzHUDProps> = ({
  timeLeftSeconds,
  totalDurationSeconds,
  score,
  comboMultiplier,
  correctCount,
  onOpenSettings,
  onOpenRules,
  onRestart,
  onBackToLobby,
}) => {
  const isUrgent = timeLeftSeconds <= 10;
  const timePercent = Math.max(
    0,
    Math.min(100, (timeLeftSeconds / totalDurationSeconds) * 100)
  );

  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 h-14 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md select-none">
      {/* Left: QuickMenu + Back + Title */}
      <div className="flex items-center gap-2 shrink-0">
        <QuickMenuDrawer />

        <button
          type="button"
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm cursor-pointer whitespace-nowrap"
          title="Retour au lobby"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-white hidden sm:block whitespace-nowrap">
            Capital Blitz
          </h1>
        </div>
      </div>

      {/* Center: Chrono timer & Found counter */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Chrono Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            isUrgent
              ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse shadow-lg shadow-rose-950/50"
              : "bg-slate-900/90 border-slate-700/80 text-amber-300"
          }`}
          title="Temps restant"
        >
          <Clock
            className={`w-4 h-4 ${
              isUrgent ? "text-rose-400 animate-spin" : "text-amber-400"
            }`}
          />
          <span className="font-mono font-black text-sm sm:text-base leading-none">
            {Math.floor(timeLeftSeconds / 60)
              .toString()
              .padStart(2, "0")}
            :
            {(timeLeftSeconds % 60).toString().padStart(2, "0")}
          </span>
        </div>

        {/* Found Capitals Pill */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold text-white">
            {correctCount}
          </span>
          <span className="text-slate-400 hidden sm:inline">trouvées</span>
        </div>
      </div>

      {/* Right: Live Score, Multiplier, Settings, Reset, Help, UserNav */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Live Score Pill */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-xs shadow-sm shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 hidden md:inline">
            Score :
          </span>
          <span className="font-black text-amber-300 text-xs sm:text-sm">
            {score.toLocaleString("fr-FR")}
          </span>
          <span className="text-[10px] text-amber-400/60 font-semibold hidden sm:inline">
            pts
          </span>
        </div>

        {/* Combo Multiplier Badge */}
        {comboMultiplier > 1.0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-600/30 border border-orange-500/40 text-[11px] font-black text-orange-300 shadow-sm animate-bounce shrink-0">
            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
            <span>x{comboMultiplier.toFixed(1)}</span>
          </div>
        )}

        {/* Reset button */}
        <button
          type="button"
          onClick={onRestart}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0 cursor-pointer"
          title="Recommencer le sprint"
          aria-label="Recommencer le sprint"
        >
          <RotateCcw className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 transition-all text-xs shrink-0 cursor-pointer"
          title="Paramètres de partie"
          aria-label="Paramètres de partie"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Rules button */}
        <button
          type="button"
          onClick={onOpenRules}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0 cursor-pointer"
          title="Règles du jeu"
          aria-label="Règles du jeu"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile UserNav (compact hides streak pill as per user rule) */}
        <UserNav compact />
      </div>
    </header>
  );
};
