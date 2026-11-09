"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, Share2, RotateCcw, Check, Sparkles, X } from "lucide-react";
import { RingStatus } from "./RingProgressHUD";
import { GameScale } from "@/lib/games/types";

interface GameOverModalProps {
  isOpen: boolean;
  scale: GameScale;
  mode: "daily" | "free" | "custom";
  seed: string;
  seedCityName: string;
  rings: RingStatus[];
  customShareUrl?: string;
  onRestart: () => void;
  onClose?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  scale,
  mode,
  seed,
  seedCityName,
  rings,
  customShareUrl,
  onRestart,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const solvedCount = rings.filter((r) => r.isCompleted).length;
  const isPerfect = solvedCount === rings.length;

  useEffect(() => {
    if (isOpen && solvedCount >= Math.ceil(rings.length / 2)) {
      confetti({
        particleCount: isPerfect ? 150 : 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899"],
      });
    }
  }, [isOpen, solvedCount, isPerfect, rings.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scaleNames = {
    fr: "France",
    eu: "Europe",
    world: "Monde",
  };

  const generateShareText = () => {
    const emojis = rings
      .map((r) => (r.isCompleted ? `🟢 ${r.triesUsed > 0 ? `${r.triesUsed}e` : "✓"}` : "🔴 X"))
      .join(" | ");

    const shareUrl =
      customShareUrl ||
      `${window.location.origin}/play/georings?scale=${scale}&mode=free&seed=${seed}`;

    const modeLabel = mode === "daily" ? "Défi du Jour" : mode === "custom" ? "Défi Custom" : "Partie Libre";

    return [
      `🌍 GeoHub — GeoRings ${scaleNames[scale]} (${modeLabel})`,
      `📍 Centre : ${seedCityName}`,
      `${emojis}`,
      `Score : ${solvedCount}/${rings.length} anneaux découverts`,
      `Défie-moi sur cette même partie :`,
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
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5">
        {/* Close Button to inspect map */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fermer pour observer la carte"
            aria-label="Fermer le bilan"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Header Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
          {solvedCount >= 4 ? (
            <Trophy className="w-8 h-8 text-amber-400" />
          ) : (
            <Sparkles className="w-8 h-8 text-blue-400" />
          )}
        </div>

        {/* Title & Score */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isPerfect
              ? "Score Parfait ! 🌟"
              : solvedCount >= 3
              ? "Bien joué ! 👏"
              : "Partie terminée !"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Partie {mode === "daily" ? "Défi du Jour" : "Libre"} — Échelle {scaleNames[scale]} (Centre : {seedCityName})
          </p>
          <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-lg font-bold text-blue-400">
            {solvedCount} / {rings.length} <span className="text-xs font-medium text-slate-400">anneaux réussis</span>
          </div>
        </div>

        {/* Rings Recap List */}
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 divide-y divide-slate-800/60 text-xs">
          {rings.map((r) => (
            <div key={r.index} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 font-semibold">#{r.index + 1}</span>
                <span className="text-slate-300">
                  {r.index === 0 ? `< ${r.outerRadiusKm} km` : `${r.innerRadiusKm}-${r.outerRadiusKm} km`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.targetCityName && (
                  <span className="text-slate-400 font-medium">{r.targetCityName}</span>
                )}
                {r.isCompleted ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                    {r.triesUsed}/3
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-bold font-mono">
                    Échec
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Partager mon résultat avec mes amis</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all text-sm"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Rejouer une autre partie</span>
          </button>
        </div>
      </div>
    </div>
  );
};
