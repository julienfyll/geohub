"use client";

import React from "react";
import { X, HelpCircle, Compass, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface BorderPathRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BorderPathRulesModal: React.FC<BorderPathRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-slate-100"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Règles du Jeu — BorderPath
            </h2>
            <p className="text-xs text-slate-400">
              Le jeu de transit frontalier et de stratégie territoriale
            </p>
          </div>
        </div>

        {/* Content list */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">1. Mission : Le Maillon Frontalier</strong>
              <span>
                Reliez le territoire de départ au territoire d&apos;arrivée en nommant une séquence ininterrompue de pays (ou départements) ayant une frontière terrestre commune.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">2. 100% au Clavier</strong>
              <span>
                Tapez le nom du pays ou du département dans la barre de saisie. Utilisez <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-xs">↑</kbd> et <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-xs">↓</kbd> pour naviguer dans l&apos;autocomplétion, puis <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-xs">Entrée</kbd> pour valider.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">3. Ponts & Liaisons Fixes</strong>
              <span>
                Les îles coupées du monde sont exclues. Les franchissements majeurs fixes sont autorisés (ex : pont de l&apos;Øresund entre Danemark et Suède, Eurotunnel France ⇄ Royaume-Uni).
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">4. Score Optimal &amp; Par</strong>
              <span>
                Chaque déplacement compte pour 1 étape. Votre objectif est d&apos;égaler le chemin le plus court calculé par l&apos;algorithme BFS (&ldquo;Par&rdquo;).
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
        >
          J&apos;ai compris, c&apos;est parti !
        </button>
      </div>
    </div>
  );
};
