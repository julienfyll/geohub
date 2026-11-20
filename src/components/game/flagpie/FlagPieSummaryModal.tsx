"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Trophy,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  ArrowRight,
  X,
  Globe2,
  Home,
} from "lucide-react";
import { FlagPiePack, FlagPieMode } from "@/lib/games/flagpie/types";
import { generateShareText } from "@/lib/games/flagpie/engine";
import { recordGameSession } from "@/lib/stats/statsService";
import { useAuth } from "@/lib/auth/AuthContext";

export interface FlagPieRoundSummary {
  roundNumber: number;
  countryName: string;
  flag: string;
  score: number;
  attemptsUsed: number;
  isCorrect: boolean;
}

interface FlagPieSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: FlagPiePack;
  mode: FlagPieMode;
  totalScore: number;
  maxScore?: number;
  roundsSummary: FlagPieRoundSummary[];
  onReplaySame: () => void;
  onNewChallenge: () => void;
}

export const FlagPieSummaryModal: React.FC<FlagPieSummaryModalProps> = ({
  isOpen,
  onClose,
  pack,
  mode,
  totalScore,
  maxScore = 25000,
  roundsSummary,
  onReplaySame,
  onNewChallenge,
}) => {
  const [copied, setCopied] = useState(false);
  const hasSavedRef = useRef(false);
  const { user } = useAuth();

  const correctCount = roundsSummary.filter((r) => r.isCorrect).length;
  const accuracyPercent = Math.round((totalScore / maxScore) * 100);

  // Trigger confetti on high performance
  useEffect(() => {
    if (isOpen && accuracyPercent >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
      });
    }
  }, [isOpen, accuracyPercent]);

  // Record session to statsService
  useEffect(() => {
    if (!isOpen) {
      hasSavedRef.current = false;
      return;
    }

    if (isOpen && !hasSavedRef.current) {
      hasSavedRef.current = true;
      recordGameSession(
        {
          game_mode: "flagpie",
          variant: pack,
          difficulty: pack,
          score: totalScore,
          max_score: maxScore,
          accuracy_percent: accuracyPercent,
          summary_data: {
            mode,
            correctCount,
            roundsCount: roundsSummary.length,
          },
        },
        user?.id
      );
    }
  }, [isOpen, totalScore, maxScore, accuracyPercent, pack, mode, correctCount, roundsSummary.length, user?.id]);

  if (!isOpen) return null;

  const handleCopyShare = () => {
    const scores = roundsSummary.map((r) => r.score);
    const text = generateShareText(scores, totalScore, mode);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Glow ambient background */}
        <div className="absolute -top-28 -right-28 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center font-bold text-lg shadow-sm">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                Bilan de la Partie
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                FlagPie • {mode === "daily" ? "Défi Quotidien" : "Entraînement Libre"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Accuracy Hero */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-violet-950/40 to-slate-950/80 border border-violet-500/30 text-center space-y-2 shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 block">
            Score Total Obtenu
          </span>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
              {totalScore.toLocaleString("fr-FR")}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">
              / {maxScore.toLocaleString("fr-FR")} pts
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 font-bold">
              🎯 {correctCount} / {roundsSummary.length} réussis
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 font-bold text-amber-300">
              ⚡ {accuracyPercent}% de réussite
            </span>
          </div>
        </div>

        {/* 5 Rounds Breakdown */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
            Détail des 5 Manches
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {roundsSummary.map((r) => (
              <div
                key={r.roundNumber}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 font-mono text-slate-500 font-bold">
                    #{r.roundNumber}
                  </span>
                  <span className="text-xl select-none">{r.flag}</span>
                  <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {r.countryName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    {r.isCorrect ? `${r.attemptsUsed}ᵉ essai` : "Non trouvé"}
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      r.score === 5000
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : r.score === 3000
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : r.score === 1000
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    +{r.score.toLocaleString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopyShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Résultat copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Partager mon score (Wordle-style)</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReplaySame}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
              <span>Rejouer</span>
            </button>

            <button
              type="button"
              onClick={onNewChallenge}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Autre partie</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>

          <div className="flex justify-center pt-1">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Retourner au Hub principal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
