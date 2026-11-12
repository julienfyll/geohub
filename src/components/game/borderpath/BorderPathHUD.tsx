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
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Flag,
  HelpCircle,
  Zap,
} from "lucide-react";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";

interface BorderPathHUDProps {
  pack: BorderPathPack;
  mode: BorderPathMode;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  theme: BorderPathMapTheme;
  hideBorders: boolean;
  onToggleTheme: () => void;
  onToggleHideBorders: () => void;
  onOpenRules: () => void;
  onOpenPackModal: () => void;
  onChangeMode?: (mode: BorderPathMode) => void;
  onGiveUp: () => void;
  onRestart: () => void;
}

export const BorderPathHUD: React.FC<BorderPathHUDProps> = ({
  pack,
  mode,
  startEntity,
  targetEntity,
  theme,
  hideBorders,
  onToggleTheme,
  onToggleHideBorders,
  onOpenRules,
  onOpenPackModal,
  onChangeMode,
  onGiveUp,
  onRestart,
}) => {
  const packMetaMap: Record<BorderPathPack, { name: string; shortName: string; icon: string }> = {
    monde: { name: "Monde Continental", shortName: "Monde", icon: "🌍" },
    europe: { name: "Europe", shortName: "Europe", icon: "🇪🇺" },
    france_departements: { name: "France — 96 Départements", shortName: "France Dép.", icon: "🇫🇷" },
    ameriques: { name: "Amériques", shortName: "Amériques", icon: "🌎" },
    afrique: { name: "Afrique", shortName: "Afrique", icon: "🌍" },
  };

  const currentPackMeta = packMetaMap[pack] || packMetaMap.monde;

  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 h-14 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
      {/* Left: QuickMenuDrawer + Back to Hub + Game Branding */}
      <div className="flex items-center gap-2">
        <QuickMenuDrawer />

        <Link
          href="/"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm"
          title="Retour au Hub d'accueil"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Hub</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-white hidden sm:block">
            BorderPath
          </h1>
        </div>
      </div>

      {/* Center: Mode Segmented Pill + Pack Selector + Compact Mission Corridor */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => onChangeMode?.("daily")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              mode === "daily"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Défi officiel du jour (tirage identique pour tous)"
          >
            <span>📅 Du Jour</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode?.("free")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              mode === "free"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Partie libre illimitée avec tirage aléatoire"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Aléatoire</span>
          </button>
        </div>

        {/* Territory / Pack Selector */}
        <button
          type="button"
          onClick={onOpenPackModal}
          className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-xs transition-all shadow-sm cursor-pointer"
          title="Changer de pack / territoire"
        >
          <span className="text-base">{currentPackMeta.icon}</span>
          <span className="font-bold text-white group-hover:text-blue-300 transition-colors hidden sm:inline">
            {currentPackMeta.shortName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
        </button>

        {/* Compact Mission Corridor (Start -> Target) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Mission :
          </span>
          <span className="text-sm">{startEntity.flagEmoji || "🏁"}</span>
          <span className="font-bold text-cyan-300">{startEntity.name}</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{targetEntity.flagEmoji || "🎯"}</span>
          <span className="font-bold text-amber-300">{targetEntity.name}</span>
        </div>
      </div>

      {/* Right: Map & Game Controls + UserNav */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Map Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
          title={`Changer de fond de carte (Actuel: ${theme})`}
          aria-label="Changer de fond de carte"
        >
          <Layers className="w-4 h-4 text-blue-400" />
        </button>

        {/* Carte Muette Toggle */}
        <button
          type="button"
          onClick={onToggleHideBorders}
          className={`p-2 rounded-lg border transition-all text-xs ${
            hideBorders
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80"
          }`}
          title={hideBorders ? "Afficher les frontières" : "Masquer les frontières (Carte Muette)"}
          aria-label="Mode Carte Muette"
        >
          {hideBorders ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Restart Button */}
        <button
          type="button"
          onClick={onRestart}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
          title="Recommencer la partie"
          aria-label="Recommencer la partie"
        >
          <RotateCcw className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>

        {/* Give Up Button */}
        <button
          type="button"
          onClick={onGiveUp}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-700/80 transition-all text-xs"
          title="Abandonner la partie"
          aria-label="Abandonner la partie"
        >
          <Flag className="w-4 h-4 text-rose-400" />
        </button>

        {/* Rules Modal Button */}
        <button
          type="button"
          onClick={onOpenRules}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
          title="Règles du jeu"
          aria-label="Règles du jeu"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </button>

        {/* User Navigation / Profile */}
        <UserNav compact />
      </div>
    </header>
  );
};
