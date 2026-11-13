"use client";

import React from "react";
import Link from "next/link";
import {
  BorderPathEntity,
  BorderPathPack,
  BorderPathMode,
} from "@/lib/games/borderpath/types";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Layers,
  Settings,
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
  onOpenRules: () => void;
  onOpenSettings: () => void;
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
  onOpenRules,
  onOpenSettings,
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
      {/* Left: QuickMenuDrawer + Back to Lobby + Game Branding */}
      <div className="flex items-center gap-2 shrink-0">
        <QuickMenuDrawer />

        <Link
          href="/play/borderpath"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm whitespace-nowrap"
          title="Retour au Lobby de sélection BorderPath"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lobby</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-white hidden sm:block whitespace-nowrap">
            BorderPath
          </h1>
        </div>
      </div>

      {/* Center: Mode Segmented Pill + Pack Selector + Compact Mission Corridor */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mode Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => onChangeMode?.("daily")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all whitespace-nowrap ${
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
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all whitespace-nowrap ${
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
          className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-xs transition-all shadow-sm cursor-pointer shrink-0"
          title="Changer de pack / territoire"
        >
          <span className="text-base shrink-0">{currentPackMeta.icon}</span>
          <span className="font-bold text-white group-hover:text-blue-300 transition-colors hidden sm:inline whitespace-nowrap">
            {currentPackMeta.shortName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform shrink-0" />
        </button>

        {/* Compact Mission Corridor (Start -> Target) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner whitespace-nowrap shrink-0">
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

      {/* Right: Actions, Settings (Gear) & UserNav */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Restart Button - Non disponible pour les défis du jour */}
        {mode !== "daily" && (
          <button
            type="button"
            onClick={onRestart}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
            title="Recommencer la partie"
            aria-label="Recommencer la partie"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        )}

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

        {/* Settings Button (Roue crantée standard GeoHub) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
          title="Paramètres de jeu (Fond de carte, Carte Muette...)"
          aria-label="Paramètres de jeu"
        >
          <Settings className="w-4 h-4 text-slate-400 hover:text-white" />
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
