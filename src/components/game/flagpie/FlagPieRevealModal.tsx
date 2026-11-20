"use client";

import React from "react";
import { ArrowRight, Trophy, Sparkles, XCircle, CheckCircle2, Globe, Building2 } from "lucide-react";

interface FlagPieRevealModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  scoreEarned: number;
  country: {
    id: string;
    name: string;
    flag: string;
    capital: string;
    continent: string;
    trivia?: string;
  };
  currentRound: number;
  totalRounds: number;
  onNextRound: () => void;
}

export const FlagPieRevealModal: React.FC<FlagPieRevealModalProps> = ({
  isOpen,
  isCorrect,
  scoreEarned,
  country,
  currentRound,
  totalRounds,
  onNextRound,
}) => {
  if (!isOpen) return null;

  const isLastRound = currentRound >= totalRounds;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isCorrect ? "bg-emerald-500/20" : "bg-rose-500/15"
          }`}
        />

        {/* Status header banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Trouvé !</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Manche terminée</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold font-mono">
            <span className={scoreEarned > 0 ? "text-emerald-400 font-black" : "text-slate-400"}>
              +{scoreEarned.toLocaleString("fr-FR")} pts
            </span>
          </div>
        </div>

        {/* Country Showcase Card */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-center space-y-3">
          <div className="text-6xl sm:text-7xl select-none filter drop-shadow-md">
            {country.flag}
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {country.name}
            </h3>
            <div className="flex items-center justify-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-violet-400" />
                <span>{country.continent}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{country.capital}</span>
              </span>
            </div>
          </div>

          {/* Vexillological Trivia */}
          {country.trivia && (
            <div className="p-3 rounded-xl bg-violet-950/25 border border-violet-500/30 text-xs text-violet-200/90 text-left leading-relaxed mt-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Secret vexillologique</span>
              </div>
              <p>{country.trivia}</p>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={onNextRound}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
        >
          <span>{isLastRound ? "Voir le résultat final" : "Manche suivante"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
