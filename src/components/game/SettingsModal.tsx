"use client";

import React from "react";
import { X, Settings, RotateCcw, Map, Compass, Search, Globe } from "lucide-react";
import { GameSettings } from "@/lib/settings/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Réglages de Jeu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggles list */}
        <div className="flex flex-col gap-4 text-sm divide-y divide-slate-800/80">
          {/* Borders */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-start gap-3 pr-2">
              <Map className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Frontières politiques</p>
                <p className="text-xs text-slate-400">
                  Désactivez pour jouer en <span className="text-amber-400 font-semibold">Mode Hardcore</span> sans aucun repère national.
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

          {/* Direction Hint */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <Compass className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Indicateur de direction (Boussole)</p>
                <p className="text-xs text-slate-400">
                  Affiche le cap de la ville cible depuis la ville essayée (ex: <i>« Plus à l'Ouest »</i>).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSetting("showDirectionHints", !settings.showDirectionHints)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.showDirectionHints ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.showDirectionHints ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <Search className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Menu d'autocomplétion</p>
                <p className="text-xs text-slate-400">
                  Désactivez pour jouer en saisie 100% aveugle (validation directe sans liste visible).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSetting("showAutocompleteDropdown", !settings.showAutocompleteDropdown)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.showAutocompleteDropdown ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.showAutocompleteDropdown ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* French exonyms */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-start gap-3 pr-2">
              <Globe className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-white">Noms français prioritaires</p>
                <p className="text-xs text-slate-400">
                  Affiche <i>Pékin (Beijing)</i> ou <i>Londres (London)</i> plutôt que le nom local seul.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSetting("preferFrenchNames", !settings.preferFrenchNames)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.preferFrenchNames ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.preferFrenchNames ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
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
