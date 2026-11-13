"use client";

import React from "react";
import { X, Settings, Map } from "lucide-react";
import { BorderPathMapTheme } from "@/lib/games/borderpath/types";

interface BorderPathSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: BorderPathMapTheme;
  onChangeTheme: (theme: BorderPathMapTheme) => void;
  hideBorders: boolean;
  onToggleHideBorders: () => void;
}

export const BorderPathSettingsModal: React.FC<BorderPathSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  hideBorders,
  onToggleHideBorders,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-5 text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Paramètres BorderPath
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basemap Style Theme Selector */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Calque visuel de la carte
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: "dark" as const,
                label: "Sombre",
                icon: "🌑",
                desc: "Fond nuit & reliefs",
              },
              {
                id: "voyager" as const,
                label: "Clair",
                icon: "☀️",
                desc: "Atlas épuré",
              },
              {
                id: "satellite" as const,
                label: "Satellite",
                icon: "🛰️",
                desc: "Photo réelle HD",
              },
            ].map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? "bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/60 shadow-lg shadow-blue-500/20"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg mb-1">{t.icon}</span>
                  <span className="font-bold text-xs">{t.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map options: Frontiers / Carte Muette */}
        <div className="flex flex-col gap-4 text-sm divide-y divide-slate-800/80">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-start gap-3 pr-2">
              <Map className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Frontières politiques</p>
                <p className="text-xs text-slate-400">
                  Désactivez pour jouer en <span className="text-amber-400 font-semibold">Mode Carte Muette</span> sans contours des pays non posés.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleHideBorders}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !hideBorders ? "bg-blue-600" : "bg-slate-700"
              }`}
              title={hideBorders ? "Afficher les frontières" : "Masquer les frontières"}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  !hideBorders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-700/60"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
