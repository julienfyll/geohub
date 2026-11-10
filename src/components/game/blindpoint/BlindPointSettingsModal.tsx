"use client";

import React from "react";
import { X, Settings, RotateCcw, Map, Clock, HelpCircle, Image as ImageIcon, Type, Sparkles, Milestone, Trees } from "lucide-react";
import { BlindPointSettings } from "@/lib/games/blindpoint/types";

interface BlindPointSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BlindPointSettings;
  onUpdateSetting: <K extends keyof BlindPointSettings>(key: K, value: BlindPointSettings[K]) => void;
  onResetDefaults: () => void;
}

export const BlindPointSettingsModal: React.FC<BlindPointSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const handleTogglePhoto = () => {
    const nextPhoto = !settings.showTargetPhoto;
    if (!nextPhoto && !settings.showTargetName) {
      onUpdateSetting("showTargetName", true);
    }
    onUpdateSetting("showTargetPhoto", nextPhoto);
  };

  const handleToggleName = () => {
    const nextName = !settings.showTargetName;
    if (!nextName && !settings.showTargetPhoto) {
      onUpdateSetting("showTargetPhoto", true);
    }
    onUpdateSetting("showTargetName", nextName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Paramètres Blind Point
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basemap Style Theme Selector (3 vues : Sombre, Clair, Satellite) */}
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
                desc: "Fond ivoire naturel",
              },
              {
                id: "satellite" as const,
                label: "Satellite",
                icon: "🛰️",
                desc: "Photo réelle HD",
              },
            ].map((theme) => {
              const isSelected = (settings.mapTheme || "dark") === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onUpdateSetting("mapTheme", theme.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? "bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/60 shadow-lg shadow-blue-500/20"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg mb-1">{theme.icon}</span>
                  <span className="font-bold text-xs">{theme.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{theme.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-4 text-sm divide-y divide-slate-800/80">
          {/* Contextual Vector Toggles or Satellite Notice */}
          {settings.mapTheme === "satellite" ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-white mb-0.5">Mode Imagerie Réelle</p>
                <p className="text-slate-400 leading-relaxed">
                  La voirie, les ponts, cours d'eau et espaces verts sont directement intégrés dans la photographie satellite.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Voirie & Réseau routier Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-start gap-3 pr-2">
                  <Milestone className="w-4 h-4 text-sky-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Voirie & Réseau routier</p>
                    <p className="text-xs text-slate-400">
                      Affiche les rues, boulevards, avenues et ponts (sans aucun nom). Désactivez pour une carte vierge de routes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSetting("showRoads", !(settings.showRoads ?? true))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    (settings.showRoads ?? true) ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      (settings.showRoads ?? true) ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Espaces verts & Cours d'eau Toggle */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-start gap-3 pr-2">
                  <Trees className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Espaces verts & Cours d'eau</p>
                    <p className="text-xs text-slate-400">
                      Affiche les parcs, forêts, fleuves et canaux en teintes naturelles. Désactivez pour une silhouette épurée.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSetting("showNature", !(settings.showNature ?? true))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    (settings.showNature ?? true) ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      (settings.showNature ?? true) ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </>
          )}

          {/* Borders Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <Map className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Frontières politiques</p>
                <p className="text-xs text-slate-400">
                  Désactivez pour jouer en <span className="text-amber-400 font-semibold">Mode Pur Muet</span> sans aucune ligne frontalière.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSetting("showBorders", !settings.showBorders)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.showBorders ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.showBorders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Photo Learning Mode Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <ImageIcon className="w-4 h-4 text-cyan-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Photo du lieu (Apprentissage)</p>
                <p className="text-xs text-slate-400">
                  Affiche la photo du monument / château pendant la manche pour aider à l'identification visuelle.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePhoto}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.showTargetPhoto ? "bg-cyan-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.showTargetPhoto ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Target Name Toggle (Reconnaissance visuelle pure if off) */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <Type className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Nom du lieu</p>
                <p className="text-xs text-slate-400">
                  Désactivez pour jouer en <span className="text-cyan-400 font-semibold">Reconnaissance Visuelle Pure</span> (trouver la cible uniquement à partir de sa photo).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleName}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.showTargetName ? "bg-emerald-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.showTargetName ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Region Hints Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <HelpCircle className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Indices géographiques (Dép. / Région)</p>
                <p className="text-xs text-slate-400">
                  Affiche le département, la région ou le pays sous le nom de la cible (désactivé par défaut pour préserver le défi).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSetting("showRegionHints", !settings.showRegionHints)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.showRegionHints ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.showRegionHints ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Timer Selection */}
          <div className="flex flex-col gap-2 pt-3">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Chronomètre par manche</p>
                <p className="text-xs text-slate-400">
                  Ajoute de la tension : validation automatique à l'épuisement du temps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { label: "Désactivé", value: 0 },
                { label: "30 secondes", value: 30 },
                { label: "60 secondes", value: 60 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSetting("timerDurationSeconds", opt.value as 0 | 30 | 60)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    settings.timerDurationSeconds === opt.value
                      ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rétablir par défaut</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
