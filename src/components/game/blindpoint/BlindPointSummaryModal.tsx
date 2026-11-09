"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Trophy,
  Share2,
  Check,
  RotateCcw,
  Eye,
  Sparkles,
  MapPin,
  X,
  Flame,
  ArrowRight,
} from "lucide-react";
import { BlindPointRoundResult, BlindPointPack, BlindPointDifficulty } from "@/lib/games/blindpoint/types";
import { formatDistance } from "@/lib/games/blindpoint/scoring";

interface BlindPointSummaryModalProps {
  isOpen: boolean;
  pack: BlindPointPack;
  mode: "daily" | "free";
  difficulty?: BlindPointDifficulty;
  seed: string;
  rounds: BlindPointRoundResult[];
  onRestartGame: () => void;
  onCloseToMap: () => void;
  onBackToLobby?: () => void;
}

export const BlindPointSummaryModal: React.FC<BlindPointSummaryModalProps> = ({
  isOpen,
  pack,
  mode,
  difficulty = "moyen",
  seed,
  rounds,
  onRestartGame,
  onCloseToMap,
  onBackToLobby,
}) => {
  const [copied, setCopied] = useState(false);

  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const totalDistance = rounds.reduce((sum, r) => sum + r.distanceKm, 0);
  const isHighPerformance = totalScore >= 20000;
  const isPerfect = totalScore === 25000;

  // Trigger confetti when completed with high score
  useEffect(() => {
    if (isOpen && totalScore >= 18000) {
      confetti({
        particleCount: isPerfect ? 200 : 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#6366f1"],
      });
    }
  }, [isOpen, totalScore, isPerfect]);

  if (!isOpen) return null;

  const packLabels: Record<BlindPointPack, string> = {
    villes_france: "Villes de France",
    villes_monde: "Villes du Monde",
    lieux_france: "Lieux emblématiques (France)",
    lieux_paris: "Monuments de Paris",
    lieux_monde: "Lieux emblématiques (Monde)",
    monuments_monde: "Monuments du Monde",
    chateaux_france: "Châteaux & Patrimoine",
  };

  const diffLabels: Record<BlindPointDifficulty, string> = {
    facile: "Facile",
    moyen: "Moyen",
    difficile: "Difficile",
  };

  const isLieuxPack = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
  const packName = packLabels[pack] || "Villes de France";
  const diffName = isLieuxPack ? "Patrimoine" : diffLabels[difficulty] || "Moyen";

  const generateShareText = () => {
    const today = new Date().toISOString().split("T")[0];
    const modeLabel = mode === "daily" ? `#${today}` : "(Libre)";
    const shareUrl = `${window.location.origin}/play/blindpoint?pack=${pack}${isLieuxPack ? "" : `&difficulty=${difficulty}`}&mode=daily`;

    const roundLines = rounds
      .map((r, i) => {
        const bullseye = r.distanceKm <= 1.0 ? " 🎯" : "";
        return `${i + 1}. ${r.ratingEmoji} ${r.score.toLocaleString("fr-FR")} pts (${formatDistance(r.distanceKm)})${bullseye}`;
      })
      .join("\n");

    return [
      `📍 Blind Point ${modeLabel} • ${packName}${isLieuxPack ? "" : ` (${diffName})`}`,
      `Score : ${totalScore.toLocaleString("fr-FR")} / 25 000 pts`,
      `Erreur totale : ${formatDistance(totalDistance)}`,
      ``,
      roundLines,
      ``,
      `Jouer sur : ${shareUrl}`,
    ].join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button to inspect map */}
        <button
          type="button"
          onClick={onCloseToMap}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer pour observer tous vos tirs sur la carte"
          aria-label="Fermer le bilan"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
          {totalScore >= 22000 ? (
            <Trophy className="w-8 h-8 text-amber-400" />
          ) : (
            <Sparkles className="w-8 h-8 text-blue-400" />
          )}
        </div>

        {/* Title & Grand Score */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isPerfect
              ? "Score Absolu Parfait ! 🌟"
              : totalScore >= 20000
              ? "Précision Magistrale ! 🎯"
              : totalScore >= 14000
              ? "Belle Performance ! 👏"
              : "Partie Terminée !"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Blind Point • {packName} • {mode === "daily" ? "Défi du Jour" : "Entraînement Libre"}
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex-1 rounded-2xl bg-blue-950/40 border border-blue-500/30 p-3">
              <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider block">
                Score Global
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
                {totalScore.toLocaleString("fr-FR")}
                <span className="text-sm font-normal text-slate-400"> / 25 000</span>
              </span>
            </div>

            <div className="flex-1 rounded-2xl bg-slate-950/80 border border-slate-800 p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Écart Cumulé
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {formatDistance(totalDistance)}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Round Breakdown List */}
        <div className="flex flex-col gap-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-left">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Détail des 5 Tirs
          </span>
          <div className="flex flex-col gap-1.5 divide-y divide-slate-800/60">
            {rounds.map((r, i) => (
              <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 w-3">{i + 1}.</span>
                  {r.target.imageUrl ? (
                    <img
                      src={r.target.imageUrl}
                      alt={r.target.name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-base shrink-0">{r.ratingEmoji}</span>
                  )}
                  <div>
                    <span className="font-bold text-white block truncate max-w-[170px] sm:max-w-[240px]">
                      {r.target.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDistance(r.distanceKm)} d'écart
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {r.score.toLocaleString("fr-FR")} pts
                  </span>
                  {r.distanceKm <= 1.0 && (
                    <span className="block text-[10px] text-emerald-400 font-bold">🎯 Bullseye</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Grid */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Share Button (Wordle Style) */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl font-bold text-sm shadow-xl transition-all ${
              copied
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Résultats copiés dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Partager mes résultats (Wordle)</span>
              </>
            )}
          </button>

          {/* Other Packs Quick Switch */}
          <div className="flex flex-col gap-1.5 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tester un autre pack
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "villes_france", label: "🇫🇷 Villes" },
                { id: "lieux_france", label: "🏰 France" },
                { id: "lieux_paris", label: "🗼 Paris" },
                { id: "lieux_monde", label: "🏛️ Monde" },
              ]
                .filter((p) => p.id !== pack)
                .map((p) => (
                  <Link
                    key={p.id}
                    href={`/play/blindpoint?pack=${p.id}&mode=${mode}`}
                    className="py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all text-center truncate hover:border-blue-500"
                  >
                    {p.label}
                  </Link>
                ))}
              <Link
                href="/"
                className="py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all text-center truncate hover:border-slate-500"
              >
                🏠 Arcade
              </Link>
            </div>
          </div>

          {/* Secondary buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCloseToMap}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Observer la carte</span>
            </button>

            {onBackToLobby ? (
              <button
                type="button"
                onClick={onBackToLobby}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <span>Changer de mode</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onRestartGame}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-600/30"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Rejouer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
