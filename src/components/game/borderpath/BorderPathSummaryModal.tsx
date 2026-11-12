"use client";

import React, { useState } from "react";
import {
  BorderPathEntity,
  BorderPathPack,
  BorderPathMode,
} from "@/lib/games/borderpath/types";
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
  totalAttempts: number;
  minOptimalSteps: number;
  optimalSolutions?: string[][];
  allEntities: Record<string, BorderPathEntity>;
  gaveUp: boolean;
  onReplay: () => void;
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
  totalAttempts,
  minOptimalSteps,
  optimalSolutions = [],
  allEntities,
  gaveUp,
  onReplay,
  onChangePack,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const delta = totalAttempts - minOptimalSteps;
  const isPerfect = !gaveUp && delta <= 0;
  const score = gaveUp
    ? 0
    : Math.max(1000, Math.round(10000 - Math.max(0, delta) * 1500));

  const optimalCountriesCount = minOptimalSteps + 1;
  const userCountriesCount = fullConnectedPath.length > 0 ? fullConnectedPath.length : totalAttempts + 1;

  // Generate shareable text
  const handleShare = () => {
    const today = new Date().toISOString().slice(0, 10);
    const packEmoji = pack === "france_departements" ? "🇫🇷" : "🌍";

    const emojiRow = fullConnectedPath
      .map((_, i) => (i < optimalCountriesCount ? "🟢" : "🟡"))
      .join("");

    const text = `BorderPath #${today} ${packEmoji}
${startEntity.flagEmoji || "🏁"} ${startEntity.name} ➔ ${targetEntity.flagEmoji || "🎯"} ${targetEntity.name}
Score : ${gaveUp ? "Abandonné" : `${score} pts • ${userCountriesCount} pays (Optimal : ${optimalCountriesCount})`}
${emojiRow}

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
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-slate-100"
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
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
              gaveUp
                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                : isPerfect
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-bounce-subtle"
                : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
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
            {gaveUp ? "Solution Révélée" : isPerfect ? "Parcours Parfait !" : "Jonction Réussie !"}
          </h2>

          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {gaveUp
              ? "Voici l'itinéraire optimal pour relier ces deux territoires."
              : isPerfect
              ? `Score optimal absolu ! Vous avez relié les deux rives en ${totalAttempts} maillons.`
              : `Vous avez relié ${startEntity.name} et ${targetEntity.name} en ${userCountriesCount} pays.`}
          </p>

          {!gaveUp && (
            <div className="mt-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-extrabold text-base">
              Score : {score.toLocaleString("fr-FR")} / 10 000 pts
            </div>
          )}
        </div>

        {/* Stats Grid: Compared against Optimal */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Vos Pays
            </span>
            <span className="text-2xl font-mono font-extrabold text-white mt-0.5">
              {gaveUp ? "—" : userCountriesCount}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {gaveUp ? "" : `${totalAttempts} maillons`}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trajet Optimal
            </span>
            <span className="text-2xl font-mono font-extrabold text-emerald-400 mt-0.5">
              {optimalCountriesCount}
            </span>
            <span className="text-[10px] text-emerald-500/80 mt-0.5">
              {minOptimalSteps} maillons
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Écart
            </span>
            <span
              className={`text-2xl font-mono font-extrabold mt-0.5 ${
                gaveUp
                  ? "text-slate-500"
                  : delta <= 0
                  ? "text-emerald-400"
                  : delta <= 1
                  ? "text-amber-400"
                  : "text-blue-400"
              }`}
            >
              {gaveUp ? "—" : delta <= 0 ? "0 (Par)" : `+${delta}`}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {gaveUp ? "" : delta <= 0 ? "Sans détour" : "Détours"}
            </span>
          </div>
        </div>

        {/* User Reconstructed Corridor Path */}
        {!gaveUp && fullConnectedPath.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Votre corridor complet reconstitué ({fullConnectedPath.length} pays) :
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

        {/* Optimal Path Reference */}
        {optimalSolutions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chemin le plus court ({optimalCountriesCount} pays) :</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
              {optimalSolutions[0].map((id, idx) => {
                const entity = allEntities[id];
                return (
                  <React.Fragment key={`opt-${id}`}>
                    {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                    <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-medium">
                      {entity?.flagEmoji} {entity?.name || id}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Résultat copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Partager mon score avec mes amis</span>
              </>
            )}
          </button>

          {/* Replay & Pack Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onReplay}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejouer un défi</span>
            </button>

            <button
              type="button"
              onClick={onChangePack}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Changer de pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
