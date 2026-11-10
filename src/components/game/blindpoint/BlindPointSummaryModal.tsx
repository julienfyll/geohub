"use client";

import React, { useEffect, useState, useRef } from "react";
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
import {
  BlindPointRoundResult,
  BlindPointPack,
  BlindPointDifficulty,
  BlindPointMode,
} from "@/lib/games/blindpoint/types";
import { formatDistance } from "@/lib/games/blindpoint/scoring";
import { useAuth } from "@/lib/auth/AuthContext";
import { recordGameSession } from "@/lib/stats/statsService";
import { LeaderboardModal } from "@/components/leaderboard/LeaderboardModal";

interface BlindPointSummaryModalProps {
  isOpen: boolean;
  pack: BlindPointPack;
  mode: BlindPointMode;
  difficulty?: BlindPointDifficulty | "all";
  seed: string;
  totalRounds?: number;
  customShareUrl?: string;
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
  totalRounds,
  customShareUrl,
  rounds,
  onRestartGame,
  onCloseToMap,
  onBackToLobby,
}) => {
  const { user, profile, signInWithGoogle } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const hasSavedRef = useRef(false);

  const roundsCount = totalRounds || rounds.length || 5;
  const maxScore = roundsCount * 5000;
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const avgScore = Math.round(totalScore / (rounds.length || 1));
  const totalDistance = rounds.reduce((sum, r) => sum + r.distanceKm, 0);
  const isHighPerformance = totalScore >= maxScore * 0.8;
  const isPerfect = totalScore === maxScore;

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

  // Record session automatically once
  useEffect(() => {
    if (isOpen && !hasSavedRef.current && rounds.length > 0) {
      hasSavedRef.current = true;
      recordGameSession(
        {
          game_mode: "blindpoint",
          variant: pack,
          difficulty: difficulty,
          score: totalScore,
          max_score: 25000,
          accuracy_percent: Math.round((totalScore / 25000) * 100),
          distance_km: Math.round(totalDistance),
          summary_data: {
            seed,
            mode,
            roundsCount: rounds.length,
          },
        },
        user?.id
      );
    }
  }, [isOpen, rounds, totalScore, totalDistance, pack, difficulty, seed, mode, user?.id]);

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

  const diffLabels: Record<string, string> = {
    facile: "Facile",
    moyen: "Moyen",
    difficile: "Difficile",
    all: "Mixte",
  };

  const isLieuxPack = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
  const packName = packLabels[pack] || "Villes de France";
  const diffName = isLieuxPack ? "Patrimoine" : diffLabels[difficulty] || "Moyen";

  const generateShareText = () => {
    const today = new Date().toISOString().split("T")[0];
    const modeLabel = mode === "daily" ? `#${today}` : mode === "custom" ? "(Défi Custom)" : "(Libre)";
    const shareUrl =
      customShareUrl ||
      `${window.location.origin}/play/blindpoint?pack=${pack}${isLieuxPack ? "" : `&difficulty=${difficulty}`}&mode=${mode}`;

    const roundLines = rounds
      .map((r, i) => {
        const bullseye = r.distanceKm <= 1.0 ? " 🎯" : "";
        return `${i + 1}. ${r.ratingEmoji} ${r.score.toLocaleString("fr-FR")} pts (${formatDistance(r.distanceKm)})${bullseye}`;
      })
      .join("\n");

    return [
      `📍 Blind Point ${modeLabel} • ${packName}${isLieuxPack ? "" : ` (${diffName})`}`,
      `Score : ${totalScore.toLocaleString("fr-FR")} / ${maxScore.toLocaleString("fr-FR")} pts (Moy: ${avgScore.toLocaleString("fr-FR")} pts/manche)`,
      `Erreur totale : ${formatDistance(totalDistance)}`,
      "",
      roundLines,
      "",
      `Rejoins le défi sur le même tirage :`,
      shareUrl,
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCloseToMap();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Close Button to inspect map */}
        <button
          type="button"
          onClick={onCloseToMap}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer pour observer la carte"
          aria-label="Fermer le bilan"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
          {isHighPerformance ? (
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce-subtle" />
          ) : (
            <Sparkles className="w-8 h-8 text-emerald-400" />
          )}
        </div>

        {/* Title & Total Score */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5" /> Bilan de la session
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isPerfect
              ? "Score Parfait Absolu ! 🌟"
              : isHighPerformance
              ? "Excellente Précision ! 🎯"
              : "Partie Terminée !"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {packName} • {isLieuxPack ? "Lieux Culturels" : `Niveau ${diffName}`}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 sm:gap-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Score Total
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
                {totalScore.toLocaleString("fr-FR")}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-semibold">/ {maxScore.toLocaleString("fr-FR")}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Moyenne / Manche
              </span>
              <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
                {avgScore.toLocaleString("fr-FR")}
              </span>
              <span className="text-[10px] text-slate-500 ml-1 font-semibold">pts</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Écart Total
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatDistance(totalDistance)}
              </span>
            </div>
          </div>
        </div>

        {/* Rounds Breakdown */}
        <div className="text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            Détail des {rounds.length} manches
          </span>
          <div className="space-y-1.5">
            {rounds.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">{r.ratingEmoji}</span>
                  <div>
                    <span className="font-bold text-white block truncate max-w-[170px] sm:max-w-[220px]">
                      {r.target.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{formatDistance(r.distanceKm)} d'écart</span>
                      {r.target.arrondissement && (
                        <>
                          <span>•</span>
                          <span className="text-blue-300 font-semibold">{r.target.arrondissement}ᵉ arr.</span>
                        </>
                      )}
                    </div>
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

        {/* Guest Banner */}
        {!user && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/30 flex items-center justify-between text-left gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Garde ce score et ta série !
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Connecte-toi en 1 clic pour synchroniser ton historique.
              </p>
            </div>
            <button
              onClick={() => signInWithGoogle()}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 shadow-md transition-colors"
            >
              Connexion
            </button>
          </div>
        )}

        {/* Actions Grid */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Leaderboard button */}
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 font-bold rounded-2xl border border-amber-500/40 transition-all text-xs shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Voir le classement officiel du jour</span>
          </button>

          {/* Share Button (Wordle Style) */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl font-bold text-sm shadow-xl transition-all ${
              copied
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : mode === "custom"
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Lien et résultats copiés dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>
                  {mode === "custom"
                    ? "Défier un ami sur ce même tirage"
                    : "Partager mes résultats (Wordle)"}
                </span>
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

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        initialGame="blindpoint"
        initialVariant={pack}
      />
    </div>
  );
};
