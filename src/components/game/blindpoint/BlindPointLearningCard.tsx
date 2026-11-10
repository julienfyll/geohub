"use client";

import React, { useState } from "react";
import { X, Maximize2, Sparkles, BookOpen } from "lucide-react";
import { BlindPointTarget } from "@/lib/games/blindpoint/types";

interface BlindPointLearningCardProps {
  isOpen: boolean;
  target: BlindPointTarget | null;
  onClose?: () => void;
}

export const BlindPointLearningCard: React.FC<BlindPointLearningCardProps> = ({
  isOpen,
  target,
  onClose,
}) => {
  const [imgError, setImgError] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  if (!isOpen || !target) return null;

  const bankLabel =
    target.bank === "rive_droite"
      ? "Rive Droite"
      : target.bank === "rive_gauche"
      ? "Rive Gauche"
      : target.bank === "ile"
      ? "Île de la Seine"
      : target.bank === "pont"
      ? "Pont & Voie d'eau"
      : null;

  return (
    <>
      {/* Right Side Floating Learning Panel */}
      <aside
        aria-label="Fiche d'apprentissage du lieu"
        className="fixed right-4 top-20 bottom-24 z-30 w-[320px] sm:w-[380px] pointer-events-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-300"
      >
        <div className="flex-1 bg-slate-950/95 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Header Tag & Optional Close Button */}
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3 h-3 text-blue-400" />
              <span>Fiche Découverte</span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Masquer le volet pour observer la carte"
                aria-label="Fermer le volet"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Large Hero Photo (on top) */}
          {target.imageUrl && !imgError && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shrink-0 shadow-lg group mb-3.5 bg-slate-900">
              <img
                src={target.imageUrl}
                alt={target.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
              <button
                type="button"
                onClick={() => setEnlarged(true)}
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                title="Agrandir la photo"
              >
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Agrandir</span>
                </div>
              </button>
            </div>
          )}

          {/* Place Title & Badges */}
          <div className="mb-3.5 shrink-0">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight mb-2">
              {target.name}
            </h3>

            {/* Geographical & Historical Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {target.arrondissement && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-300">
                  {target.arrondissement}ᵉ arr.
                </span>
              )}
              {bankLabel && (
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] font-semibold text-purple-300">
                  {bankLabel}
                </span>
              )}
              {target.yearBuilt && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] font-mono text-slate-300">
                  Édifié en {target.yearBuilt}
                </span>
              )}
            </div>
          </div>

          {/* Dedicated Learning & Fun Fact Block (Center) */}
          {target.funFact && (
            <div className="flex-1 overflow-y-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-start">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1.5 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Le saviez-vous ?</span>
              </span>
              <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-normal">
                {target.funFact}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Lightbox / Zoom Modal when photo is clicked */}
      {enlarged && target.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
          onClick={() => setEnlarged(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlarged(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={target.imageUrl}
              alt={target.name}
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
            <p className="text-sm font-bold text-white mt-3 text-center">{target.name}</p>
          </div>
        </div>
      )}
    </>
  );
};
