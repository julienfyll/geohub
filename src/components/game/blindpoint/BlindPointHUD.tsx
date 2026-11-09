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
  Maximize2,
  X,
} from "lucide-react";
import {
  BlindPointClientTarget,
  BlindPointPack,
  BlindPointDifficulty,
  BlindPointMode,
} from "@/lib/games/blindpoint/types";

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
  difficulty?: BlindPointDifficulty;
  showRegionHints?: boolean;
  showTargetPhoto?: boolean;
  showTargetName?: boolean;
  onValidateGuess: () => void;
  onOpenSettings: () => void;
  onBackToLobby?: () => void;
  onChangeMode?: (pack: BlindPointPack, difficulty: BlindPointDifficulty, mode: BlindPointMode) => void;
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
  difficulty = "moyen",
  showRegionHints = false,
  showTargetPhoto = true,
  showTargetName = true,
  onValidateGuess,
  onOpenSettings,
  onBackToLobby,
  onChangeMode,
}) => {
  const router = useRouter();
  const [isPackMenuOpen, setIsPackMenuOpen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
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
    villes_monde: { name: "Villes du Monde", icon: "🌍" },
    lieux_france: { name: "Patrimoine de France", icon: "🏰" },
    lieux_paris: { name: "Monuments de Paris", icon: "🗼" },
    lieux_monde: { name: "Merveilles du Monde", icon: "🏛️" },
    monuments_monde: { name: "Monuments du Monde", icon: "🏛️" },
    chateaux_france: { name: "Châteaux de France", icon: "🏰" },
  };

  const diffLabels: Record<BlindPointDifficulty, { label: string; badge: string }> = {
    facile: { label: "Facile", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    moyen: { label: "Moyen", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    difficile: { label: "Difficile", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  };

  const isLieuxPack = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
  const currentPackMeta = packLabels[pack] || { name: "Villes de France", icon: "🇫🇷" };
  const currentDiffMeta = diffLabels[difficulty] || diffLabels.moyen;

  return (
    <>
      {/* Top Floating Navigation Header */}
      <header className="absolute top-0 inset-x-0 z-30 p-4 pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: GeoHub / Lobby Back Link & Pack info */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {onBackToLobby ? (
              <button
                type="button"
                onClick={onBackToLobby}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all text-xs font-semibold active:scale-95"
                title="Retour au choix du mode"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Modes</span>
              </button>
            ) : (
              <Link
                href="/play/blindpoint"
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all text-xs font-semibold active:scale-95"
                title="Retour aux modes"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Modes</span>
              </Link>
            )}

            {/* Interactive Pack & Difficulty Selector */}
            <div className="relative" ref={packMenuRef}>
              <button
                type="button"
                onClick={() => setIsPackMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
                title="Changer de pack ou de difficulté"
              >
                <span className="text-sm">{currentPackMeta.icon}</span>
                <span className="text-xs font-bold text-white tracking-tight hidden sm:inline">
                  {currentPackMeta.name}
                </span>
                {!isLieuxPack ? (
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${currentDiffMeta.badge}`}>
                    {currentDiffMeta.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border-purple-500/30">
                    Lieux
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold uppercase tracking-wider hidden md:inline">
                  {mode === "daily" ? "Défi du jour" : "Libre"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isPackMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Category 1 : Villes */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-1">
                      🏙️ Villes & Agglomérations
                    </span>
                    <div className="space-y-1">
                      {[
                        { id: "villes_france", name: "Villes de France", icon: "🇫🇷", desc: "139 métropoles & préfectures" },
                        { id: "villes_monde", name: "Villes du Monde", icon: "🌍", desc: "167 métropoles des 6 continents" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setIsPackMenuOpen(false);
                            if (onChangeMode) {
                              onChangeMode(p.id as BlindPointPack, difficulty, mode);
                            } else {
                              router.push(`/play/blindpoint?pack=${p.id}&difficulty=${difficulty}&mode=${mode}&play=1`);
                            }
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
                    </div>
                  </div>

                  {/* Category 2 : Lieux emblématiques */}
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-1 block mb-1">
                      🏛️ Lieux emblématiques
                    </span>
                    <div className="space-y-1">
                      {[
                        { id: "lieux_france", name: "Lieux emblématiques (France)", icon: "🏰", desc: "58 châteaux de la Loire, citadelles & monuments" },
                        { id: "lieux_paris", name: "Monuments de Paris", icon: "🗼", desc: "60 trésors emblématiques intra-muros" },
                        { id: "lieux_monde", name: "Lieux emblématiques (Monde)", icon: "🏛️", desc: "50 merveilles de l'humanité & sites UNESCO" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setIsPackMenuOpen(false);
                            if (onChangeMode) {
                              onChangeMode(p.id as BlindPointPack, difficulty, mode);
                            } else {
                              router.push(`/play/blindpoint?pack=${p.id}&difficulty=${difficulty}&mode=${mode}&play=1`);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            pack === p.id
                              ? "bg-purple-600/20 border border-purple-500/40 text-purple-300"
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
                          {pack === p.id && <span className="text-xs text-purple-400 font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Section (only for cities) */}
                  {!isLieuxPack && (
                    <div className="border-t border-slate-800 pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-1.5">
                        Difficulté
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {(["facile", "moyen", "difficile"] as BlindPointDifficulty[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setIsPackMenuOpen(false);
                              if (onChangeMode) {
                                onChangeMode(pack, d, mode);
                              } else {
                                router.push(`/play/blindpoint?pack=${pack}&difficulty=${d}&mode=${mode}&play=1`);
                              }
                            }}
                            className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] capitalize border transition-all ${
                              difficulty === d
                                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30"
                                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode Section */}
                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Mode :</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPackMenuOpen(false);
                          if (onChangeMode) {
                            onChangeMode(pack, difficulty, "daily");
                          } else {
                            router.push(`/play/blindpoint?pack=${pack}&difficulty=${difficulty}&mode=daily&play=1`);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                          mode === "daily" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Défi du jour
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPackMenuOpen(false);
                          if (onChangeMode) {
                            onChangeMode(pack, difficulty, "free");
                          } else {
                            router.push(`/play/blindpoint?pack=${pack}&difficulty=${difficulty}&mode=free&seed=${Date.now()}&play=1`);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                          mode === "free" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
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
          <div className="pointer-events-auto max-w-lg w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* Optional Thumbnail Photo (if available and enabled) */}
            {currentTarget.imageUrl && showTargetPhoto && (
              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={() => setEnlargedImage(currentTarget.imageUrl || null)}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-blue-500/40 shadow-lg group-hover:border-blue-400 group-hover:scale-105 transition-all block"
                  title="Cliquer pour observer les détails de la photo"
                >
                  <img
                    src={currentTarget.imageUrl}
                    alt={currentTarget.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

            {/* Target Label & Details */}
            <div className="flex-1 text-center min-w-0">
              <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {showTargetName
                    ? "Localisez sur la carte"
                    : "Reconnaissance visuelle • Localisez"}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {showTargetName ? currentTarget.name : "Édifice Mystère ❓"}
              </h1>
              {showRegionHints && currentTarget.subtitle && (
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5 truncate">
                  {currentTarget.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal for Target Photo */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={enlargedImage}
              alt="Vue détaillée"
              className="w-full max-h-[75vh] object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
            {showTargetName && currentTarget && (
              <p className="text-sm font-bold text-white mt-3 text-center">
                {currentTarget.name}
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
