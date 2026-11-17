"use client";

import React, { useState } from "react";
import {
  Trophy,
  Share2,
  RotateCcw,
  Check,
  CheckCircle2,
  XCircle,
  Zap,
  Flame,
  ArrowLeft,
  Home,
} from "lucide-react";
import Link from "next/link";
import { CapitalBlitzResult } from "@/lib/games/capitalblitz/types";
import { generateShareText } from "@/lib/games/capitalblitz/engine";

export interface CapitalBlitzSummaryModalProps {
  isOpen: boolean;
  result: CapitalBlitzResult;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export const CapitalBlitzSummaryModal: React.FC<CapitalBlitzSummaryModalProps> = ({
  isOpen,
  result,
  onRestart,
  onBackToLobby,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = generateShareText(
      result.score,
      result.correctCount,
      result.durationSeconds,
      result.maxCombo
    );

    try {
      if (navigator.share) {
        await navigator.share({ title: "Capital Blitz", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-center text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Trophy / Header badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Zap className="w-8 h-8 fill-amber-400 animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sprint Terminé !
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {result.correctCount >= 10
              ? "Excellente performance ! Vos réflexes géographiques sont affûtés."
              : "Beau sprint ! Entraînez-vous pour faire grimper votre combo."}
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="p-2 rounded-xl bg-slate-900/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Score
            </span>
            <span className="text-lg font-black text-amber-400">
              {result.score.toLocaleString("fr-FR")}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Capitales
            </span>
            <span className="text-lg font-black text-emerald-400">
              {result.correctCount}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Précision
            </span>
            <span className="text-lg font-black text-blue-400">
              {result.accuracyPercent}%
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Combo Max
            </span>
            <span className="text-lg font-black text-orange-400">
              x{result.maxCombo.toFixed(1)}
            </span>
          </div>
        </div>

        {/* List of Played Countries & Revealed Answers */}
        <div className="flex flex-col gap-2 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Récapitulatif des Pays ({result.attempts.length})
          </span>
          <div
            className="space-y-1.5 max-h-48 overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {result.attempts.map((attempt, index) => (
              <div
                key={`${attempt.countryId}-${index}`}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  attempt.isCorrect
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                    : "bg-rose-950/30 border-rose-500/30 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{attempt.flag}</span>
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-white block truncate">
                      {attempt.countryName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Capitale : <strong className="text-slate-200">{attempt.capital}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {attempt.isCorrect ? (
                    <span className="font-black text-emerald-400 text-xs">
                      +{attempt.points} pts
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-400">
                      {attempt.isSkipped ? "Passé" : "Erreur"}
                    </span>
                  )}
                  {attempt.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Résultat copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Partager mon score</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejouer un sprint</span>
            </button>

            <Link
              href="/"
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Retour Hub</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
