"use client";

import React from "react";
import { X, Settings, Eye, Sparkles } from "lucide-react";

interface FlagPieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hidePercentages: boolean;
  onToggleHidePercentages: () => void;
}

export const FlagPieSettingsModal: React.FC<FlagPieSettingsModalProps> = ({
  isOpen,
  onClose,
  hidePercentages,
  onToggleHidePercentages,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center font-bold text-sm shadow-sm">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Paramètres</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings options */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5 pr-2">
              <Eye className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Mode Hardcore (Sans %)</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Masque les pourcentages exacts des tranches pour corser le défi
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleHidePercentages}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                hidePercentages ? "bg-violet-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  hidePercentages ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
