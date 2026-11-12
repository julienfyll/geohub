"use client";

import React from "react";
import { BorderPathPack, BorderPathMode } from "@/lib/games/borderpath/types";
import { X, Globe, MapPin, Sparkles, Zap, Check } from "lucide-react";

interface BorderPathPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPack: BorderPathPack;
  currentMode: BorderPathMode;
  onSelect: (pack: BorderPathPack, mode: BorderPathMode) => void;
}

export const BorderPathPackModal: React.FC<BorderPathPackModalProps> = ({
  isOpen,
  onClose,
  currentPack,
  currentMode,
  onSelect,
}) => {
  if (!isOpen) return null;

  const packs: {
    id: BorderPathPack;
    title: string;
    description: string;
    flag: string;
    count: string;
  }[] = [
    {
      id: "monde",
      title: "Monde Continental",
      description: "L'ensemble des continents reliés avec liaisons fixes (Øresund, Eurotunnel)",
      flag: "🌍",
      count: "167 pays",
    },
    {
      id: "europe",
      title: "Europe",
      description: "Du Portugal à l'Oural, traversez les frontières de l'Europe",
      flag: "🇪🇺",
      count: "46 pays",
    },
    {
      id: "france_departements",
      title: "France — 96 Départements",
      description: "Reliez les préfectures et départements métropolitains contigus",
      flag: "🇫🇷",
      count: "96 départements",
    },
    {
      id: "ameriques",
      title: "Amériques",
      description: "Le corridor panaméricain, du Canada à l'Argentine",
      flag: "🌎",
      count: "23 pays",
    },
    {
      id: "afrique",
      title: "Afrique",
      description: "Traversez le Sahara, le Sahel et le Rift continental",
      flag: "🌍",
      count: "48 pays",
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-slate-100"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Choisir un Pack & Mode de Jeu
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explorez les frontières du monde ou plongez dans les 96 départements français.
          </p>
        </div>

        {/* Mode Selector (Daily vs Free) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Mode de Jeu
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSelect(currentPack, "daily")}
              className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                currentMode === "daily"
                  ? "bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/20"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">Défi du Jour</span>
                <span className="text-[11px] text-slate-400">Un tirage quotidien unique pour tous</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelect(currentPack, "free")}
              className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                currentMode === "free"
                  ? "bg-blue-500/20 border-blue-500 text-blue-200 ring-2 ring-blue-500/20"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">Entraînement Libre</span>
                <span className="text-[11px] text-slate-400">Défis aléatoires illimités</span>
              </div>
            </button>
          </div>
        </div>

        {/* Packs list */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Territoire & Pack
          </span>
          <div className="space-y-2">
            {packs.map((p) => {
              const isSelected = p.id === currentPack;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id, currentMode)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/20"
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{p.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                          {p.count}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block">{p.description}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
