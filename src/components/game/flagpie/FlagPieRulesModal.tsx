"use client";

import React from "react";
import { X, PieChart, CheckCircle2, Sparkles, HelpCircle, AlertCircle } from "lucide-react";

interface FlagPieRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlagPieRulesModal: React.FC<FlagPieRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center font-bold text-lg shadow-sm">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                Règles de FlagPie
              </h3>
              <span className="text-xs text-slate-400">
                Reconstituez les drapeaux par leurs couleurs
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

        {/* Content list */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">1. Le Camembert Chromatique</strong>
              <span>
                Chaque diagramme camembert affiche la proportion exacte de chaque couleur présente dans le drapeau officiel du pays à deviner (survolez les tranches pour voir les % et couleurs).
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">2. Les 3 Essais Dégressifs</strong>
              <div className="mt-1 space-y-1 text-xs">
                <p>
                  • <strong className="text-emerald-400">1ᵉʳ essai (5 000 pts) :</strong> Le camembert pur, sans aucun indice.
                </p>
                <p>
                  • <strong className="text-amber-400">2ᵉ essai (3 000 pts) :</strong> Révélation du <strong>Continent</strong>.
                </p>
                <p>
                  • <strong className="text-orange-400">3ᵉ essai (1 000 pts) :</strong> Révélation de la <strong>Première lettre</strong> du nom.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">3. Saisie Clavier Intuitive</strong>
              <span>
                Tapez le nom d&apos;un pays dans la barre de recherche. Naviguez avec les flèches <strong className="text-slate-200">↑ / ↓</strong> et validez avec <strong className="text-slate-200">Entrée</strong>.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">4. Score Parfait (25 000 pts)</strong>
              <span>
                Une partie se joue en 5 manches. Un parcours sans faute rapporte le score maximal de <strong className="text-amber-300 font-mono">25 000 points</strong> !
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-lg shadow-violet-600/25"
        >
          C&apos;est parti, j&apos;ai compris !
        </button>
      </div>
    </div>
  );
};
