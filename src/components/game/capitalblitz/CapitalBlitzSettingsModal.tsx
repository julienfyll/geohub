"use client";

import React from "react";
import { X, Settings, Clock, Globe } from "lucide-react";
import {
  CapitalBlitzSettings,
  CapitalBlitzContinent,
} from "@/lib/games/capitalblitz/types";

export interface CapitalBlitzSettingsModalProps {
  isOpen: boolean;
  settings: CapitalBlitzSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: CapitalBlitzSettings) => void;
}

export const CapitalBlitzSettingsModal: React.FC<CapitalBlitzSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const CONTINENT_OPTIONS: { id: CapitalBlitzContinent; label: string; icon: string }[] = [
    { id: "all", label: "Monde entier", icon: "🌍" },
    { id: "Europe", label: "Europe", icon: "🇪🇺" },
    { id: "Africa", label: "Afrique", icon: "🌍" },
    { id: "Americas", label: "Amériques", icon: "🌎" },
    { id: "Asia", label: "Asie", icon: "🌏" },
    { id: "Oceania", label: "Océanie", icon: "🏝️" },
  ];

  const DURATION_OPTIONS = [
    { seconds: 30, label: "30s Blitz" },
    { seconds: 60, label: "60s Standard" },
    { seconds: 90, label: "90s Étendu" },
    { seconds: 120, label: "120s Marathon" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Réglages du Sprint</h3>
              <p className="text-[11px] text-slate-400">Durée et filtres géographiques</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Duration Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Durée du Sprint</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((d) => {
                const isSelected = settings.durationSeconds === d.seconds;
                return (
                  <button
                    key={d.seconds}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, durationSeconds: d.seconds })
                    }
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continent Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Filtre Territorial</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONTINENT_OPTIONS.map((c) => {
                const isSelected = settings.continent === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, continent: c.id })
                    }
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="font-bold text-xs">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-500/25 cursor-pointer"
        >
          Enregistrer et Fermer
        </button>
      </div>
    </div>
  );
};
