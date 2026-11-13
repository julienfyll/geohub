"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BorderPathEntity,
  BorderPathPack,
  BorderPathMode,
} from "@/lib/games/borderpath/types";
import { recordGameSession } from "@/lib/stats/statsService";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Trophy,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  ArrowRight,
  X,
  Flag,
  Layers,
} from "lucide-react";

interface BorderPathSummaryModalProps {
  isOpen: boolean;
  onCloseToMap: () => void;
  pack: BorderPathPack;
  mode: BorderPathMode;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  fullConnectedPath: BorderPathEntity[];
  totalCountriesPlaced: number;
  failedAttempts: BorderPathEntity[];
  minOptimalSteps: number;
  gaveUp: boolean;
  onReplaySame: () => void;
  onNewChallenge: () => void;
  onChangePack: () => void;
}

export const BorderPathSummaryModal: React.FC<BorderPathSummaryModalProps> = ({
  isOpen,
  onCloseToMap,
  pack,
  mode,
  startEntity,
  targetEntity,
  fullConnectedPath,
  totalCountriesPlaced,
  failedAttempts = [],
  minOptimalSteps,
  gaveUp,
  onReplaySame,
  onNewChallenge,
  onChangePack,
}) => {
  const [copied, setCopied] = useState(false);
  const hasSavedRef = useRef(false);
  const { user } = useAuth();

  const optimalCountries = minOptimalSteps + 1;
  const corridorCount = fullConnectedPath.length;
  const errorCount = failedAttempts.length;
  // Detours = valid countries placed that are not in the main connecting corridor
  const detourCount = Math.max(0, totalCountriesPlaced - corridorCount);
  const totalAttempts = totalCountriesPlaced + errorCount;
  const delta = totalAttempts - optimalCountries;
  const isPerfect = !gaveUp && delta === 0 && errorCount === 0;

  // Score calculation:
  // Perfect = 10 000 pts
  // Otherwise scaled by optimalCountries / totalAttempts, capped between 100 and 10000, 0 if gaveUp
  const calculatedScore = gaveUp
    ? 0
    : Math.max(
        100,
        Math.round(10000 * (optimalCountries / Math.max(optimalCountries, totalAttempts)))
      );

  // Record session automatically once when modal opens
  useEffect(() => {
    if (!isOpen) {
      hasSavedRef.current = false;
      return;
    }

    if (isOpen && !hasSavedRef.current && !gaveUp) {
      hasSavedRef.current = true;
      recordGameSession(
        {
          game_mode: "borderpath",
          variant: pack,
          difficulty: pack,
          score: calculatedScore,
          max_score: 10000,
          accuracy_percent: Math.round(
            (optimalCountries / Math.max(optimalCountries, totalAttempts)) * 100
          ),
          summary_data: {
            mode,
            seed: pack,
            totalAttempts,
            optimalCountries,
            errorCount,
            corridorCount,
            isPerfect,
            startName: startEntity.name,
            targetName: targetEntity.name,
          },
        },
        user?.id
      );
    }
  }, [
    isOpen,
    gaveUp,
    pack,
    calculatedScore,
    optimalCountries,
    totalAttempts,
    mode,
    errorCount,
    corridorCount,
    isPerfect,
    startEntity.name,
    targetEntity.name,
    user?.id,
  ]);

  if (!isOpen) return null;

  // Generate shareable text
  const handleShare = () => {
    const today = new Date().toISOString().slice(0, 10);
    const packEmoji = pack === "france_departements" ? "🇫🇷" : "🌍";

    const text = `BorderPath #${today} ${packEmoji}
${startEntity.flagEmoji || "🏁"} ${startEntity.name} ➔ ${targetEntity.flagEmoji || "🎯"} ${targetEntity.name}
${
  gaveUp
    ? "Partie abandonnée"
    : `Résultat : ${totalAttempts} tentatives (Chemin optimal : ${optimalCountries} pays) • ${
        isPerfect ? "Parcours Idéal 🏆" : `+${delta} coups`
      }${errorCount > 0 ? ` (${errorCount} err.)` : ""}`
}

Défie-moi sur GeoHub : https://geohub.fr/play/borderpath`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      onClick={onCloseToMap}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-slate-100"
      >
        {/* Close cross top-right */}
        <button
          type="button"
          onClick={onCloseToMap}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer et observer la carte"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2.5 shadow-xl ${
              gaveUp
                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                : isPerfect
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-bounce-subtle"
                : "bg-blue-500/20 border border-blue-500/40 text-blue-400"
            }`}
          >
            {gaveUp ? (
              <Flag className="w-8 h-8" />
            ) : isPerfect ? (
              <Trophy className="w-8 h-8" />
            ) : (
              <Sparkles className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {gaveUp ? "Partie Abandonnée" : isPerfect ? "Parcours Optimal !" : "Jonction Réussie !"}
          </h2>

          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {gaveUp
              ? "Vous n'avez pas terminé la jonction."
              : isPerfect
              ? `Performance parfaite ! Jonction en ${optimalCountries} pays sans aucune erreur ni détour.`
              : `Vous avez relié ${startEntity.name} et ${targetEntity.name} en ${totalAttempts} tentatives.`}
          </p>

          {!gaveUp && (
            <div className="mt-2.5 flex flex-col items-center gap-1">
              <div
                className={`px-4 py-1.5 rounded-full border font-extrabold text-sm sm:text-base ${
                  isPerfect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                }`}
              >
                {isPerfect
                  ? `🏆 Parcours Optimal : ${optimalCountries} pays (sans faute)`
                  : `${totalAttempts} coups • Idéal : ${optimalCountries} (+${delta} de trop)`}
              </div>
              <span className="text-[11px] text-slate-400">
                {isPerfect
                  ? "Zéro erreur • Zéro détour"
                  : `${errorCount > 0 ? `${errorCount} erreur${errorCount > 1 ? "s" : ""}` : ""}${
                      errorCount > 0 && detourCount > 0 ? " • " : ""
                    }${detourCount > 0 ? `${detourCount} détour${detourCount > 1 ? "s" : ""}` : ""}`}
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Coups joués
            </span>
            <span className="text-2xl font-mono font-extrabold text-white mt-0.5">
              {gaveUp ? "—" : totalAttempts}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {gaveUp ? "" : errorCount > 0 ? `${errorCount} err.` : "sans faute"}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trajet minimal
            </span>
            <span className="text-2xl font-mono font-extrabold text-emerald-400 mt-0.5">
              {optimalCountries}
            </span>
            <span className="text-[10px] text-emerald-500/80 mt-0.5">
              pays minimum
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Écart vs idéal
            </span>
            <span
              className={`text-2xl font-mono font-extrabold mt-0.5 ${
                gaveUp
                  ? "text-slate-500"
                  : isPerfect
                  ? "text-emerald-400"
                  : delta === 1
                  ? "text-amber-400"
                  : "text-blue-400"
              }`}
            >
              {gaveUp ? "—" : isPerfect ? "0 (Idéal)" : `+${delta}`}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {gaveUp ? "" : isPerfect ? "Sans déchet" : `${delta} coup${delta > 1 ? "s" : ""} de trop`}
            </span>
          </div>
        </div>

        {/* Breakdown Card */}
        {!gaveUp && (
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Pays du corridor principal :</span>
              <span className="font-bold font-mono text-white">{corridorCount} pays</span>
            </div>
            {detourCount > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-amber-400/90">Détours (pays posés hors corridor) :</span>
                <span className="font-bold font-mono text-amber-400">+{detourCount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-300">
              <span className={errorCount > 0 ? "text-red-400 font-semibold" : "text-slate-400"}>
                Erreurs (pays non limitrophes) :
              </span>
              <span
                className={`font-bold font-mono ${
                  errorCount > 0 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {errorCount}
              </span>
            </div>
            {errorCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Pays refusés :</span>
                {failedAttempts.map((f, i) => (
                  <span
                    key={`failed-${f.id}-${i}`}
                    className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/40 text-red-300 font-medium text-[11px]"
                  >
                    {f.flagEmoji} {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Reconstructed Corridor Path (Only the user's path, NEVER the optimal solution) */}
        {!gaveUp && fullConnectedPath.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Votre corridor réussi ({fullConnectedPath.length} pays) :
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
              {fullConnectedPath.map((e, idx) => (
                <React.Fragment key={`corridor-${e.id}`}>
                  {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  <span
                    className={`px-2 py-1 rounded-lg border font-medium ${
                      idx === 0
                        ? "bg-cyan-950 border-cyan-500/40 text-cyan-300 font-bold"
                        : idx === fullConnectedPath.length - 1
                        ? "bg-amber-950 border-amber-500/40 text-amber-300 font-bold"
                        : "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                    }`}
                  >
                    {e.flagEmoji} {e.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Résultat copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Partager mon résultat avec mes amis</span>
              </>
            )}
          </button>

          {/* Replay Same, New Challenge, & Pack Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onReplaySame}
              className="py-3 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              title="Réessayer exactement cette même partie"
            >
              <RotateCcw className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Rejouer la même</span>
            </button>

            <button
              type="button"
              onClick={onNewChallenge}
              className="py-3 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              title="Générer une nouvelle paire dans ce pack"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Nouveau défi</span>
            </button>

            <button
              type="button"
              onClick={onChangePack}
              className="py-3 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              title="Choisir un autre pack géographique"
            >
              <Layers className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>Changer pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
