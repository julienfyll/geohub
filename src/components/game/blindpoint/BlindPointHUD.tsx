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
  HelpCircle,
  Share2,
  Check,
  Trophy,
  Sliders,
  Zap,
} from "lucide-react";
import {
  BlindPointClientTarget,
  BlindPointPack,
  BlindPointDifficulty,
  BlindPointMode,
} from "@/lib/games/blindpoint/types";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";

interface BlindPointHUDProps {
  currentTarget: BlindPointClientTarget | null;
  roundIndex: number;
  totalRounds: number;
  currentTotalScore: number;
  hasPlacedGuess: boolean;
  isSubmitting: boolean;
  isRevealing: boolean;
  isGameOver?: boolean;
  timerSecondsLeft: number | null;
  pack: BlindPointPack;
  packs?: BlindPointPack[];
  mode: BlindPointMode;
  seed?: string;
  difficulty?: BlindPointDifficulty | "all";
  showRegionHints?: boolean;
  showTargetPhoto?: boolean;
  showTargetName?: boolean;
  onValidateGuess: () => void;
  onOpenSettings: () => void;
  onOpenSummary?: () => void;
  onBackToLobby?: () => void;
  onOpenCustomModal?: () => void;
  onChangeMode?: (pack: BlindPointPack, difficulty: BlindPointDifficulty | "all", mode: BlindPointMode) => void;
}

export const BlindPointHUD: React.FC<BlindPointHUDProps> = ({
  currentTarget,
  roundIndex,
  totalRounds,
  currentTotalScore,
  hasPlacedGuess,
  isSubmitting,
  isRevealing,
  isGameOver = false,
  timerSecondsLeft,
  pack,
  packs,
  mode,
  seed = "",
  difficulty = "moyen",
  showRegionHints = false,
  showTargetPhoto = true,
  showTargetName = true,
  onValidateGuess,
  onOpenSettings,
  onOpenSummary,
  onBackToLobby,
  onOpenCustomModal,
  onChangeMode,
}) => {
  const router = useRouter();
  const [isPackMenuOpen, setIsPackMenuOpen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const packMenuRef = useRef<HTMLDivElement>(null);

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    const isLieux = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
    let url = `${window.location.origin}/play/blindpoint?pack=${pack}${isLieux ? "" : `&difficulty=${difficulty}`}&mode=${mode}`;
    if (seed) url += `&seed=${seed}`;
    url += `&play=1`;
    return url;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

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

  const packLabels: Record<BlindPointPack, { name: string; shortName: string; icon: string }> = {
    villes_france: { name: "Villes de France", shortName: "Villes France", icon: "🇫🇷" },
    villes_monde: { name: "Villes du Monde", shortName: "Villes Monde", icon: "🌍" },
    lieux_france: { name: "Patrimoine de France", shortName: "Patrimoine", icon: "🏰" },
    lieux_paris: { name: "Monuments de Paris", shortName: "Paris", icon: "🗼" },
    lieux_monde: { name: "Merveilles du Monde", shortName: "Merveilles", icon: "🏛️" },
    monuments_monde: { name: "Monuments du Monde", shortName: "Monuments", icon: "🏛️" },
    chateaux_france: { name: "Châteaux de France", shortName: "Châteaux", icon: "🏰" },
  };

  const diffLabels: Record<string, { label: string; badge: string }> = {
    facile: { label: "Facile", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    moyen: { label: "Moyen", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    difficile: { label: "Difficile", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    all: { label: "Mixte", badge: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  };

  const isLieuxPack = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
  const defaultPackMeta = packLabels[pack] || { name: "Villes de France", shortName: "Villes France", icon: "🇫🇷" };
  const currentPackMeta =
    mode === "custom" && packs && packs.length > 1
      ? { name: `${packs.length} packs combinés`, shortName: `${packs.length} packs`, icon: "🎲" }
      : defaultPackMeta;
  const currentDiffMeta = diffLabels[difficulty] || diffLabels.moyen;

  return (
    <>
      {/* Top Fixed Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 h-14 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
        {/* Left: Quick Menu Drawer & Hub link */}
        <div className="flex items-center gap-2">
          <QuickMenuDrawer />

          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm"
            title="Retour au Hub d'accueil"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white hidden lg:block">
              Blind Point
            </h1>
          </div>
        </div>

        {/* Center: Mode Indicator & Pack Switcher (Visual Segmented Pills) */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher : Daily vs Libre */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                if (onChangeMode) {
                  onChangeMode(pack, difficulty, "daily");
                } else {
                  router.push(`/play/blindpoint?pack=${pack}&difficulty=${difficulty}&mode=daily&play=1`);
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "daily"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Défi officiel du jour (tirage identique pour tous)"
            >
              <span>📅 Du Jour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onChangeMode) {
                  onChangeMode(pack, difficulty, "free");
                } else {
                  router.push(`/play/blindpoint?pack=${pack}&difficulty=${difficulty}&mode=free&seed=${Date.now()}&play=1`);
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "free"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Partie libre illimitée avec tirage aléatoire"
            >
              <Zap className="w-3 h-3" />
              <span>Libre</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenCustomModal) {
                  onOpenCustomModal();
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "custom"
                  ? "bg-purple-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Créer ou configurer un défi personnalisé (manches, thèmes, chrono)"
            >
              <Sliders className="w-3 h-3 text-purple-400" />
              <span>Custom</span>
            </button>
          </div>

          {/* Sélecteur de Territoire / Pack en Dropdown Dynamique (Concept 2 - Switcher Hybride) */}
          <div className="relative" ref={packMenuRef}>
            <button
              type="button"
              onClick={() => setIsPackMenuOpen((prev) => !prev)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-xs transition-all shadow-sm cursor-pointer"
              title="Changer de territoire / pack ou de niveau de difficulté"
            >
              <span className="text-base">{currentPackMeta.icon}</span>
              <span className="font-bold text-white group-hover:text-blue-300 transition-colors">
                {currentPackMeta.shortName}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                  isPackMenuOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu for Packs & Difficulty */}
            {isPackMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-80 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
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
                      🏛️ Lieux emblématiques & Merveilles
                    </span>
                    <div className="space-y-1">
                      {[
                        { id: "lieux_france", name: "Patrimoine de France", icon: "🏰", desc: "58 châteaux de la Loire, citadelles & monuments" },
                        { id: "lieux_paris", name: "Monuments de Paris", icon: "🗼", desc: "105 trésors emblématiques des 20 arrondissements" },
                        { id: "lieux_monde", name: "Merveilles du Monde", icon: "🏛️", desc: "50 merveilles de l'humanité & sites UNESCO" },
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

                  {/* Difficulty Section (for cities) */}
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

                  {/* Link to Full Config / Lobby */}
                  {onBackToLobby && (
                    <div className="border-t border-slate-800 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPackMenuOpen(false);
                          onBackToLobby();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-700/60 transition-all"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>Écran de configuration complet</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Right: Round Counter, Score, Timer & Actions */}
        <div className="flex items-center gap-2">
          {/* Timer if enabled */}
          {timerSecondsLeft !== null && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold font-mono transition-colors ${
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
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-300">
            <span className="text-slate-400 font-normal hidden sm:inline">Manche</span>
            <span className="text-blue-400 font-bold">
              {roundIndex + 1}/{totalRounds}
            </span>
          </div>

          {/* Score pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-blue-500/40 text-xs font-bold text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTotalScore.toLocaleString("fr-FR")} pts</span>
          </div>

          {/* Final Summary button when game is over */}
          {isGameOver && onOpenSummary && (
            <button
              type="button"
              onClick={onOpenSummary}
              title="Voir le bilan final de la partie"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Bilan</span>
            </button>
          )}

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
            title="Paramètres de jeu"
            aria-label="Paramètres de jeu"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help button */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs"
            title="Règles du jeu"
            aria-label="Règles du jeu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copier le lien pour défier un ami sur cette partie"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
          >
            {shareCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Défier</span>
              </>
            )}
          </button>

          {/* User Profile / Auth Button */}
          <UserNav compact />
        </div>
      </header>

      {/* Target Question Card (Top Center) */}
      {currentTarget && !isRevealing && (
        <div className="absolute top-20 inset-x-0 z-20 pointer-events-none flex justify-center px-4">
          <div className="pointer-events-auto max-w-xl w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* Optional Thumbnail Photo (if available and enabled) */}
            {currentTarget.imageUrl && showTargetPhoto && (
              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={() => setEnlargedImage(currentTarget.imageUrl || null)}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-blue-500/40 shadow-lg group-hover:border-blue-400 group-hover:scale-105 transition-all block bg-slate-900"
                  title="Cliquer pour observer les détails de la photo"
                >
                  <img
                    src={currentTarget.imageUrl}
                    alt={currentTarget.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
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
                <span>
                  {showTargetName
                    ? "Localisez sur la carte"
                    : "Reconnaissance visuelle • Localisez"}
                </span>
              </div>
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug break-words">
                {showTargetName ? currentTarget.name : "Édifice Mystère ❓"}
              </h1>
              {showRegionHints && currentTarget.subtitle && (
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
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

      {/* Rules / Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-4 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Règles de Blind Point
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">🎯 1. Objectif & Précision</span>
                Estimez l'emplacement exact du monument, du château ou de la ville sur la carte muette. Moins vous vous éloignez, plus vous gagnez de points.
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">🏆 2. 5 Manches (25 000 pts max)</span>
                Chaque manche rapporte jusqu'à <strong>5 000 points</strong>. Un écart inférieur à 1 km rapporte les 5 000 points parfaits (Bullseye).
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">⌨️ 3. Raccourcis Clavier</span>
                Cliquez sur la carte pour placer votre curseur, puis appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-white">Espace</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-white">Entrée</kbd> pour valider instantanément votre tir.
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">📅 4. Défi du Jour vs Libre</span>
                En mode <em>Défi du Jour</em>, chaque joueur dans le monde affronte exactement les 5 mêmes cibles pour comparer ses scores.
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                J'ai compris
              </button>
            </div>
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
