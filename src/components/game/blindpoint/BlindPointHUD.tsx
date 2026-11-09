"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  Settings,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { BlindPointClientTarget, BlindPointPack } from "@/lib/games/blindpoint/types";

interface BlindPointHUDProps {
  currentTarget: BlindPointClientTarget | null;
  roundIndex: number;
  totalRounds: number;
  currentTotalScore: number;
  hasPlacedGuess: boolean;
  isSubmitting: boolean;
  isRevealing: boolean;
  timerSecondsLeft: number | null;
  pack: BlindPointPack;
  mode: "daily" | "free";
  showRegionHints?: boolean;
  onValidateGuess: () => void;
  onOpenSettings: () => void;
}

export const BlindPointHUD: React.FC<BlindPointHUDProps> = ({
  currentTarget,
  roundIndex,
  totalRounds,
  currentTotalScore,
  hasPlacedGuess,
  isSubmitting,
  isRevealing,
  timerSecondsLeft,
  pack,
  mode,
  showRegionHints = false,
  onValidateGuess,
  onOpenSettings,
}) => {
  const router = useRouter();
  const [isPackMenuOpen, setIsPackMenuOpen] = useState(false);
  const packMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (packMenuRef.current && !packMenuRef.current.contains(e.target as Node)) {
        setIsPackMenuOpen(false);
      }
    };
    if (isPackMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPackMenuOpen]);

  // Keyboard listener: Enter / Space validates guess
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Enter" || e.code === "Space") &&
        hasPlacedGuess &&
        !isSubmitting &&
        !isRevealing
      ) {
        e.preventDefault();
        onValidateGuess();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPlacedGuess, isSubmitting, isRevealing, onValidateGuess]);

  const packLabels: Record<BlindPointPack, { name: string; icon: string }> = {
    villes_france: { name: "Villes de France", icon: "🇫🇷" },
    monuments_monde: { name: "Monuments du Monde", icon: "🌍" },
    chateaux_france: { name: "Châteaux & Patrimoine", icon: "🏰" },
  };

  const currentPackMeta = packLabels[pack] || { name: "Blind Point", icon: "📍" };

  return (
    <>
      {/* Top Floating Navigation Header */}
      <header className="absolute top-0 inset-x-0 z-30 p-4 pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: GeoHub Back Link & Pack info */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all text-xs font-semibold active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">GeoHub</span>
            </Link>

            {/* Interactive Pack Selector Dropdown */}
            <div className="relative" ref={packMenuRef}>
              <button
                type="button"
                onClick={() => setIsPackMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
                title="Changer de pack de jeu"
              >
                <span className="text-sm">{currentPackMeta.icon}</span>
                <span className="text-xs font-bold text-white tracking-tight hidden sm:inline">
                  {currentPackMeta.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold uppercase tracking-wider">
                  {mode === "daily" ? "Défi du jour" : "Libre"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isPackMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                    Changer de Pack
                  </span>

                  {[
                    { id: "villes_france", name: "Villes de France", icon: "🇫🇷", desc: "Préfectures & Métropoles" },
                    { id: "chateaux_france", name: "Châteaux & Patrimoine", icon: "🏰", desc: "Chambord, Carcassonne..." },
                    { id: "monuments_monde", name: "Monuments du Monde", icon: "🌍", desc: "Taj Mahal, Pétra, Colisée..." },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setIsPackMenuOpen(false);
                        router.push(`/play/blindpoint?pack=${p.id}&mode=${mode}`);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        pack === p.id
                          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{p.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
                        </div>
                      </div>
                      {pack === p.id && <span className="text-xs text-blue-400 font-bold">✓</span>}
                    </button>
                  ))}

                  <div className="border-t border-slate-800 mt-1 pt-1.5 px-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Mode :</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPackMenuOpen(false);
                          router.push(`/play/blindpoint?pack=${pack}&mode=daily`);
                        }}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                          mode === "daily" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Défi du jour
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPackMenuOpen(false);
                          router.push(`/play/blindpoint?pack=${pack}&mode=free&seed=${Date.now()}`);
                        }}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                          mode === "free" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Libre
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Round Counter, Score, Timer & Settings */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Timer if enabled */}
            {timerSecondsLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-bold font-mono transition-colors ${
                  timerSecondsLeft <= 10
                    ? "bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse"
                    : "bg-slate-900/90 border-slate-700/80 text-amber-300"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timerSecondsLeft}s</span>
              </div>
            )}

            {/* Round Counter */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md text-xs font-bold text-slate-200">
              <span className="text-slate-400 font-normal">Manche</span>
              <span className="text-blue-400">
                {roundIndex + 1}/{totalRounds}
              </span>
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-blue-500/40 shadow-xl backdrop-blur-md text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTotalScore.toLocaleString("fr-FR")} pts</span>
            </div>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="Paramètres"
              aria-label="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Target Question Card (Top Center) */}
      {currentTarget && !isRevealing && (
        <div className="absolute top-20 inset-x-0 z-20 pointer-events-none flex justify-center px-4">
          <div className="pointer-events-auto max-w-lg w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Localisez sur la carte</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {currentTarget.name}
            </h1>
            {showRegionHints && currentTarget.subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                {currentTarget.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      {!isRevealing && (
        <div className="absolute bottom-6 inset-x-0 z-30 pointer-events-none flex justify-center px-4">
          <div className="pointer-events-auto">
            {hasPlacedGuess ? (
              <button
                type="button"
                onClick={onValidateGuess}
                disabled={isSubmitting}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-emerald-600/40 border border-emerald-400 transition-all transform hover:scale-[1.03] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Calcul de l'écart...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Valider l'estimation</span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-700/70 text-[10px] font-mono text-emerald-200">
                      Entrée / Espace
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-pulse">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Cliquez sur la carte pour placer votre estimation</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
