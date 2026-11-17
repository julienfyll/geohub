"use client";

import React from "react";
import { X, Zap, Clock, FastForward, Flame, MapPin } from "lucide-react";

export interface CapitalBlitzRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CapitalBlitzRulesModal: React.FC<CapitalBlitzRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Règles du Jeu</h3>
              <p className="text-[11px] text-slate-400">Capital Blitz — Contre-la-montre</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rules Explanations */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              1. Sprint de 60 Secondes
            </span>
            <p className="text-slate-400 leading-relaxed">
              Le chronomètre démarre dès le début de la partie. Vous avez 60 secondes pour identifier un maximum de capitales dans le monde.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              2. Pays Actif & Carte en Direct
            </span>
            <p className="text-slate-400 leading-relaxed">
              Le pays cible s'affiche avec son drapeau et s'illumine en <strong>orange</strong> sur la carte. Une fois trouvé, il se colore en <strong>vert</strong> !
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-orange-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              3. Multiplicateur de Combo
            </span>
            <p className="text-slate-400 leading-relaxed">
              Chaque bonne réponse sans faute fait grimper votre multiplicateur jusqu'à <strong>x3.0</strong> (+300 pts par capitale !). Une erreur réinitialise le combo.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5 text-slate-400" />
              4. Passer pour ne pas bloquer (Espace)
            </span>
            <p className="text-slate-400 leading-relaxed">
              Un pays inconnu ? Appuyez sur <strong>Espace</strong> pour passer immédiatement. Le pays se colore en <strong>rouge</strong> sur la carte et le sprint continue.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-500/25 cursor-pointer"
        >
          C'est parti !
        </button>
      </div>
    </div>
  );
};
