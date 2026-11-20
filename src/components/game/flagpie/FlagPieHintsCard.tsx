"use client";

import React from "react";
import { Globe2, Type, Sparkles, AlertCircle, HelpCircle } from "lucide-react";

interface FlagPieHintsCardProps {
  attemptNumber: number; // 1, 2, or 3
  revealedContinent?: string;
  revealedFirstLetter?: string;
  currentScoreValue: number; // 5000, 3000, 1000
}

export const FlagPieHintsCard: React.FC<FlagPieHintsCardProps> = ({
  attemptNumber,
  revealedContinent,
  revealedFirstLetter,
  currentScoreValue,
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
      {/* Top Header with Attempt Status & Potential Score */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Essai {Math.min(attemptNumber, 3)} / 3
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                attemptNumber >= 1 ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-700"
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full ${
                attemptNumber >= 2 ? "bg-amber-400 shadow-sm shadow-amber-400/50" : "bg-slate-700"
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full ${
                attemptNumber >= 3 ? "bg-rose-400 shadow-sm shadow-rose-400/50" : "bg-slate-700"
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>+{currentScoreValue.toLocaleString("fr-FR")} pts</span>
        </div>
      </div>

      {/* Progressive Hints List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Indice 1: Continent (Débloqué au 2e essai) */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
            revealedContinent
              ? "bg-violet-950/30 border-violet-500/50 text-white shadow-sm"
              : "bg-slate-950/40 border-slate-800/80 text-slate-500"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              revealedContinent
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/40"
                : "bg-slate-800/60 text-slate-600"
            }`}
          >
            <Globe2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Continent
            </span>
            <span className="font-bold text-xs truncate block">
              {revealedContinent ? (
                <span className="text-violet-300 font-extrabold">{revealedContinent}</span>
              ) : (
                <span className="text-slate-600 font-mono">Débloqué au 2ᵉ essai</span>
              )}
            </span>
          </div>
        </div>

        {/* Indice 2: Première lettre (Débloquée au 3e essai) */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
            revealedFirstLetter
              ? "bg-amber-950/30 border-amber-500/50 text-white shadow-sm"
              : "bg-slate-950/40 border-slate-800/80 text-slate-500"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              revealedFirstLetter
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/40"
                : "bg-slate-800/60 text-slate-600"
            }`}
          >
            <Type className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              1ʳᵉ Lettre
            </span>
            <span className="font-bold text-xs truncate block">
              {revealedFirstLetter ? (
                <span className="text-amber-300 font-extrabold">
                  Commence par &ldquo;{revealedFirstLetter}&rdquo;...
                </span>
              ) : (
                <span className="text-slate-600 font-mono">Débloquée au 3ᵉ essai</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
