"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PieChart as PieIcon,
  HelpCircle,
  Settings,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { FlagPiePack, FlagPieMode } from "@/lib/games/flagpie/types";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";

interface FlagPieHUDProps {
  pack: FlagPiePack;
  mode: FlagPieMode;
  currentRound: number; // 1 to 5
  totalRounds: number;  // 5
  totalScore: number;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onRestart: () => void;
}

export const FlagPieHUD: React.FC<FlagPieHUDProps> = ({
  pack,
  mode,
  currentRound,
  totalRounds,
  totalScore,
  onOpenRules,
  onOpenSettings,
  onRestart,
}) => {
  const packLabels: Record<FlagPiePack, string> = {
    monde: "Monde Entier",
    europe: "Europe",
    afrique: "Afrique",
    ameriques: "Amériques",
    asie: "Asie & Océanie",
  };

  return (
    <header className="h-14 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: QuickMenu + Back to Lobby + Logo */}
      <div className="flex items-center gap-2.5">
        <QuickMenuDrawer />

        <Link
          href="/play/flagpie"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-semibold"
          title="Retour au lobby FlagPie"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby</span>
        </Link>

        <div className="flex items-center gap-2 pl-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-400 shadow-sm">
            <PieIcon className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white hidden md:inline">
            FlagPie
          </span>
        </div>
      </div>

      {/* Center: Mode Badge & Round Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm border ${
            mode === "daily"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-violet-500/20 text-violet-300 border-violet-500/40"
          }`}
        >
          <span>{mode === "daily" ? "📅 Du Jour" : "⚡ Libre"}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">{packLabels[pack]}</span>
        </span>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white shadow-sm">
          <span className="text-slate-400">Manche</span>
          <span className="text-violet-400 font-mono font-black">{currentRound}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400 font-mono">{totalRounds}</span>
        </div>
      </div>

      {/* Right: Score + Actions + UserNav */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-white text-xs sm:text-sm">
            {totalScore.toLocaleString("fr-FR")}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">pts</span>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Recommencer la partie"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenRules}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Règles du jeu"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Paramètres de jeu"
        >
          <Settings className="w-4 h-4" />
        </button>

        <LeaderboardTriggerButton
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
          label="Top"
          initialGame="flagpie"
        />

        <UserNav />
      </div>
    </header>
  );
};
