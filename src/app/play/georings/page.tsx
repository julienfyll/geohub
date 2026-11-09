"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Check,
  Compass,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  X,
  Settings,
  Sliders,
  Sparkles,
  SkipForward,
} from "lucide-react";
import { GeoMap, MapMarker } from "@/components/map/GeoMap";
import { SearchBar, SearchCityItem } from "@/components/ui/SearchBar";
import { RingProgressHUD, RingStatus } from "@/components/game/RingProgressHUD";
import { RingReviewActionBar } from "@/components/game/RingReviewActionBar";
import { RingReviewCard, GuessRecord } from "@/components/game/RingReviewCard";
import { GameOverModal } from "@/components/game/GameOverModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { CustomGameModal } from "@/components/game/CustomGameModal";
import { useSettings } from "@/lib/settings/useSettings";
import { CityGuessResult, GameScale, GeoRingsInitResponse, TopCityItem } from "@/lib/games/types";

function GeoRingsGame() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const scale = (searchParams.get("scale") || "fr") as GameScale;
  const mode = (searchParams.get("mode") || "daily") as "daily" | "free" | "custom";
  const userSeed = searchParams.get("seed") || "";
  const continent = searchParams.get("continent") || "";
  const customRadii = searchParams.get("radii") || "";
  const customLives = searchParams.get("lives") || "";

  const { settings, updateSetting, resetDefaults } = useSettings();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<(GeoRingsInitResponse & { seed: string }) | null>(null);
  const [currentRingIndex, setCurrentRingIndex] = useState(0);
  const [triesLeft, setTriesLeft] = useState(3);
  const [totalTries, setTotalTries] = useState(3);
  const [rings, setRings] = useState<RingStatus[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [completedRadii, setCompletedRadii] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "info" | "success" | "error" | "warning";
    directionHint?: { code: string; label: string; arrow: string };
  } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentRingGuesses, setCurrentRingGuesses] = useState<GuessRecord[]>([]);
  const [currentRingTopCities, setCurrentRingTopCities] = useState<TopCityItem[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Initialize Session
  const initGame = async () => {
    setLoading(true);
    setFeedback(null);
    setIsGameOver(false);
    setIsReviewing(false);
    setCurrentRingGuesses([]);
    setCurrentRingTopCities([]);
    setCurrentRingIndex(0);
    setMarkers([]);
    setCompletedRadii([]);

    try {
      let url = `/api/games/georings/session?scale=${scale}&mode=${mode}`;
      if (userSeed) url += `&seed=${userSeed}`;
      if (continent) url += `&continent=${continent}`;
      if (customRadii) url += `&radii=${customRadii}`;
      if (customLives) url += `&lives=${customLives}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur d'initialisation");
      const data: GeoRingsInitResponse & { seed: string } = await res.json();
      setSession(data);

      const maxTries = data.maxTriesPerRing ?? 3;
      setTotalTries(maxTries);
      setTriesLeft(maxTries);

      const initialRings: RingStatus[] = data.rings.map((r, idx) => ({
        index: r.index,
        innerRadiusKm: r.innerRadiusKm,
        outerRadiusKm: r.outerRadiusKm,
        isCurrent: idx === 0,
        isCompleted: false,
        isFailed: false,
        triesUsed: 0,
      }));
      setRings(initialRings);
    } catch (err) {
      console.error(err);
      setFeedback({ text: "Impossible de charger la partie.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initGame();
  }, [scale, mode, userSeed, continent, customRadii, customLives]);

  // Handle City Guess
  const handleSelectCity = async (city: SearchCityItem) => {
    if (!session || isGameOver || isSubmitting) return;

    setIsSubmitting(true);
    const activeRing = rings[currentRingIndex];

    try {
      const res = await fetch("/api/games/georings/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scale: session.scale,
          centerLat: session.seedCity.latitude,
          centerLon: session.seedCity.longitude,
          innerRadiusKm: activeRing.innerRadiusKm,
          outerRadiusKm: activeRing.outerRadiusKm,
          cityId: city.id,
          currentTriesLeft: triesLeft,
        }),
      });

      if (!res.ok) throw new Error("Erreur de validation");
      const result: CityGuessResult = await res.json();

      // Add tested city marker (minimalist dot + name, population available on hover)
      const newMarker: MapMarker = {
        id: `guess_${city.id}`,
        lat: result.city.latitude,
        lon: result.city.longitude,
        label: result.city.name,
        population: result.city.population,
        type: result.isTarget ? "correct" : "wrong",
      };

      setMarkers((prev) => {
        // Prevent duplicate markers for the same city
        const filtered = prev.filter(
          (m) =>
            m.id !== newMarker.id &&
            !(Math.abs(m.lat - newMarker.lat) < 0.005 && Math.abs(m.lon - newMarker.lon) < 0.005)
        );
        return [...filtered, newMarker];
      });

      // Track guess in current ring history
      const guessRecord: GuessRecord = {
        cityName: city.name,
        countryCode: city.countryCode,
        population: result.city.population,
        isTarget: result.isTarget,
        isInRing: result.isInRing,
        rank: result.guessRank,
      };
      setCurrentRingGuesses((prev) => [...prev, guessRecord]);

      if (result.isTarget) {
        // Success !
        const triesUsed = totalTries === -1 ? 1 : totalTries - triesLeft + 1;
        setFeedback({ text: result.message, type: "success" });

        if (result.topCities) {
          setCurrentRingTopCities(result.topCities);
          // Add rank 2 & 3 markers to the map
          const topMarkers: MapMarker[] = result.topCities.slice(1).map((tc) => ({
            id: `top_${tc.id}`,
            lat: tc.latitude,
            lon: tc.longitude,
            label: `${tc.rank}. ${tc.name}`,
            population: tc.population,
            type: "top",
          }));
          setMarkers((prev) => [...prev, ...topMarkers]);
        }

        const updatedRings = [...rings];
        updatedRings[currentRingIndex] = {
          ...activeRing,
          isCurrent: false,
          isCompleted: true,
          triesUsed,
          targetCityName: result.city.name,
        };

        setCompletedRadii((prev) => [...prev, activeRing.outerRadiusKm]);
        setRings(updatedRings);
        setIsReviewing(true);
      } else {
        // Wrong Guess
        setTriesLeft(result.triesLeft);

        if (result.ringFailed) {
          // Failed tries: Reveal target city
          setFeedback({ text: result.message, type: "error" });

          if (result.targetCityIfRevealed) {
            const revealedMarker: MapMarker = {
              id: `revealed_${result.targetCityIfRevealed.id}`,
              lat: result.targetCityIfRevealed.latitude,
              lon: result.targetCityIfRevealed.longitude,
              label: result.targetCityIfRevealed.name,
              population: result.targetCityIfRevealed.population,
              type: "revealed",
            };
            setMarkers((prev) => {
              // Upgrade any prior wrong guess for this city to the revealed state
              const filtered = prev.filter(
                (m) =>
                  !(
                    Math.abs(m.lat - revealedMarker.lat) < 0.005 &&
                    Math.abs(m.lon - revealedMarker.lon) < 0.005
                  )
              );
              return [...filtered, revealedMarker];
            });
          }

          if (result.topCities) {
            setCurrentRingTopCities(result.topCities);
            // Add rank 2 & 3 markers to the map
            const topMarkers: MapMarker[] = result.topCities.slice(1).map((tc) => ({
              id: `top_${tc.id}`,
              lat: tc.latitude,
              lon: tc.longitude,
              label: `${tc.rank}. ${tc.name}`,
              population: tc.population,
              type: "top",
            }));
            setMarkers((prev) => [...prev, ...topMarkers]);
          }

          const updatedRings = [...rings];
          updatedRings[currentRingIndex] = {
            ...activeRing,
            isCurrent: false,
            isFailed: true,
            triesUsed: totalTries,
            targetCityName: result.targetCityIfRevealed?.name,
          };

          setCompletedRadii((prev) => [...prev, activeRing.outerRadiusKm]);
          setRings(updatedRings);
          setIsReviewing(true);
        } else {
          // Failed try, but has lives left
          const feedbackType = !result.isInRing ? "warning" : "error";
          setFeedback({
            text: result.message,
            type: feedbackType,
            directionHint: result.directionHint,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback({ text: "Erreur réseau lors de la validation.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Skip Ring (when user is stuck or presses Space)
  const handleSkipRing = async () => {
    if (!session || isGameOver || isSubmitting || rings.length === 0) return;
    const activeRing = rings[currentRingIndex];
    if (!activeRing || activeRing.isCompleted || activeRing.isFailed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/games/georings/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scale: session.scale,
          centerLat: session.seedCity.latitude,
          centerLon: session.seedCity.longitude,
          innerRadiusKm: activeRing.innerRadiusKm,
          outerRadiusKm: activeRing.outerRadiusKm,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors du saut d'anneau");
      const result = await res.json();

      setFeedback({
        text: result.message || "Anneau passé !",
        type: "warning",
      });

      if (result.targetCity) {
        const revealedMarker: MapMarker = {
          id: `revealed_${result.targetCity.id}`,
          lat: result.targetCity.latitude,
          lon: result.targetCity.longitude,
          label: result.targetCity.name,
          population: result.targetCity.population,
          type: "revealed",
        };

        setMarkers((prev) => {
          const filtered = prev.filter(
            (m) =>
              !(
                Math.abs(m.lat - revealedMarker.lat) < 0.005 &&
                Math.abs(m.lon - revealedMarker.lon) < 0.005
              )
          );
          return [...filtered, revealedMarker];
        });
      }

      if (result.topCities) {
        setCurrentRingTopCities(result.topCities);
        // Add rank 2 & 3 markers to the map
        const topMarkers: MapMarker[] = result.topCities.slice(1).map((tc: TopCityItem) => ({
          id: `top_${tc.id}`,
          lat: tc.latitude,
          lon: tc.longitude,
          label: `${tc.rank}. ${tc.name}`,
          population: tc.population,
          type: "top",
        }));
        setMarkers((prev) => [...prev, ...topMarkers]);
      }

      const updatedRings = [...rings];
      updatedRings[currentRingIndex] = {
        ...activeRing,
        isCurrent: false,
        isFailed: true,
        triesUsed: totalTries === -1 ? 1 : totalTries,
        targetCityName: result.targetCity?.name,
      };

      setCompletedRadii((prev) => [...prev, activeRing.outerRadiusKm]);
      setRings(updatedRings);
      setIsReviewing(true);
    } catch (err) {
      console.error(err);
      setFeedback({ text: "Erreur lors du saut de l'anneau.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance to next ring from Review Mode
  const handleNextRing = useCallback(() => {
    if (currentRingIndex < rings.length - 1) {
      setRings((prev) => {
        const next = [...prev];
        if (next[currentRingIndex + 1]) {
          next[currentRingIndex + 1].isCurrent = true;
        }
        return next;
      });
      setCurrentRingIndex((prev) => prev + 1);
      setTriesLeft(totalTries);
      setIsReviewing(false);
      setCurrentRingGuesses([]);
      setCurrentRingTopCities([]);
      setFeedback(null);
    } else {
      setIsReviewing(false);
      setIsGameOver(true);
    }
  }, [currentRingIndex, rings.length, totalTries]);

  // Keyboard shortcut listener for Space (skip when playing, next when reviewing) and Enter
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        if (isReviewing) {
          e.preventDefault();
          handleNextRing();
          return;
        }

        const activeEl = document.activeElement;
        const isInput =
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            (activeEl as HTMLElement).isContentEditable);

        if (!isInput && !isGameOver && !isSubmitting) {
          e.preventDefault();
          handleSkipRing();
        }
      }

      if (e.key === "Enter" && isReviewing) {
        e.preventDefault();
        handleNextRing();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isReviewing, isGameOver, isSubmitting, handleNextRing, handleSkipRing]);

  const getCustomShareUrl = () => {
    if (!session) return "";
    const seedParam = mode === "daily" ? session.seed : session.seedCity.id;
    let url = `${window.location.origin}/play/georings?scale=${scale}&mode=${mode}&seed=${seedParam}`;
    if (continent) url += `&continent=${continent}`;
    const radiiParam = customRadii || (rings && rings.length > 0 ? rings.map((r) => r.outerRadiusKm).join(",") : "");
    if (radiiParam) url += `&radii=${radiiParam}`;
    if (customLives) url += `&lives=${customLives}`;
    else if (totalTries !== 3) url += `&lives=${totalTries}`;
    return url;
  };

  const handleCopyLink = async () => {
    const url = getCustomShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500" />
            <h1 className="text-sm font-bold tracking-tight text-white hidden sm:block">
              GeoRings
            </h1>
          </div>
        </div>

        {/* Center: Mode Indicator & Scale Switcher */}
        <div className="flex items-center gap-2">
          {/* Daily vs Custom Button */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => router.push(`/play/georings?scale=${scale}&mode=daily`)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mode === "daily"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📅 Daily
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "custom"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>

          {/* Scale Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => router.push(`/play/georings?scale=fr&mode=${mode}`)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                scale === "fr"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇫🇷 France
            </button>
            <button
              onClick={() => router.push(`/play/georings?scale=eu&mode=${mode}`)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                scale === "eu"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇪🇺 Europe
            </button>
            <button
              onClick={() => router.push(`/play/georings?scale=world&mode=${mode}`)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                scale === "world"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🌍 Monde
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            title="Réglages de jeu (Frontières, boussole, etc.)"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowHelp((prev) => !prev)}
            title="Règles du jeu"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Share button */}
          <button
            onClick={handleCopyLink}
            title="Copier le lien pour défier un ami sur cette partie"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
          >
            {shareCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Défier un ami</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Floating Game Control Panel (HUD & Search) */}
      <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 flex flex-col gap-3 pointer-events-none">
        {/* Progress Bar & Lives */}
        {rings.length > 0 && (
          <div className="pointer-events-auto">
            <RingProgressHUD
              rings={rings}
              currentRingIndex={currentRingIndex}
              triesLeft={triesLeft}
              totalTries={totalTries}
            />
          </div>
        )}

        {/* Search Box & Skip Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex-1">
            <SearchBar
              scale={scale}
              onSelectCity={handleSelectCity}
              onSkip={isReviewing ? handleNextRing : handleSkipRing}
              onCityNotFound={(query) =>
                setFeedback({
                  text: `Ville "${query}" introuvable. Vérifiez l'orthographe.`,
                  type: "warning",
                })
              }
              showDropdown={settings.showAutocompleteDropdown}
              disabled={isGameOver || isSubmitting || loading || isReviewing}
              placeholder={
                isReviewing
                  ? "Anneau terminé — Appuyez sur Espace pour continuer..."
                  : `Tapez une ville pour l'anneau ${currentRingIndex + 1}...`
              }
            />
          </div>
          {!isReviewing && (
            <button
              type="button"
              onClick={handleSkipRing}
              disabled={isGameOver || isSubmitting || loading}
              title="Passer au cercle suivant (Espace)"
              className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-xl backdrop-blur-md shrink-0 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <SkipForward className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
              <span className="hidden sm:inline">Passer</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-400">
                Espace
              </kbd>
            </button>
          )}
        </div>

        {/* Feedback Banner with optional Compass Direction Hint */}
        {feedback && (
          <div
            className={`pointer-events-auto px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 flex items-center justify-between gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/80 text-emerald-200"
                : feedback.type === "error"
                ? "bg-rose-950/95 border-rose-500/80 text-rose-200"
                : feedback.type === "warning"
                ? "bg-amber-950/95 border-amber-500/80 text-amber-200"
                : "bg-slate-900/95 border-slate-700 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>

            {/* Compass direction badge if available & enabled */}
            {settings.showDirectionHints && feedback.directionHint && (
              <span className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-600/30 border border-blue-500/60 text-blue-200 font-bold flex items-center gap-1.5 shadow-sm">
                <span>{feedback.directionHint.arrow}</span>
                <span>Plus au {feedback.directionHint.label}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetDefaults={resetDefaults}
      />

      {/* Custom Game Configuration Modal */}
      <CustomGameModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        currentScale={scale}
      />

      {/* Rules Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-500" />
                <span>Règles de GeoRings</span>
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-slate-300 space-y-2.5">
              <p>
                🎯 <b>Objectif :</b> À partir d'une ville centrale, découvrez la <b>ville la plus peuplée</b> au sein de chaque anneau concentrique successif.
              </p>
              <p>
                ⭕ <b>Anneaux :</b> Le premier anneau est un cercle proche du centre. Les anneaux suivants s'étendent de plus en plus loin.
              </p>
              <p>
                ❤️ <b>Vies :</b> Chaque ville essayée apparaît sur la carte avec un point rouge (échec) ou vert (succès). Si vous échouez, la bonne réponse est révélée et le jeu passe à l'anneau suivant.
              </p>
              <p>
                🧭 <b>Boussole :</b> En cas d'erreur dans l'anneau, un indice vous indique la direction de la cible depuis la ville essayée.
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Compris, c'est parti !
            </button>
          </div>
        </div>
      )}

      {/* Main Map Background */}
      <main className="relative flex-1 w-full h-full">
        {session ? (
          <GeoMap
            center={[session.seedCity.longitude, session.seedCity.latitude]}
            seedCity={{
              name: session.seedCity.name,
              lat: session.seedCity.latitude,
              lon: session.seedCity.longitude,
              population: session.seedCity.population,
            }}
            activeRadiusKm={rings[currentRingIndex]?.outerRadiusKm}
            completedRadiiKm={completedRadii}
            markers={markers}
            showBorders={settings.showBorders}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <Compass className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-sm">Chargement de la carte...</span>
            </div>
          </div>
        )}

        {/* Seed Info Badge (Bottom Left) */}
        {session && (
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-md flex items-center gap-2 shadow-lg">
            <span>Centre :</span>
            <b className="text-blue-400 font-semibold">{session.seedCity.name}</b>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-[10px] text-slate-500">
              {mode === "daily" ? "Daily" : mode === "custom" ? "Custom" : "Free"}
            </span>
          </div>
        )}
        {/* Ring Review Learning Panel (Left Side, style Geocore) */}
        {isReviewing && rings[currentRingIndex] && (
          <RingReviewCard
            ringIndex={currentRingIndex}
            innerRadiusKm={rings[currentRingIndex].innerRadiusKm}
            outerRadiusKm={rings[currentRingIndex].outerRadiusKm}
            guesses={currentRingGuesses}
            topCities={currentRingTopCities}
          />
        )}

        {/* Ring Review Action Bar (Bottom Center) */}
        {isReviewing && (
          <RingReviewActionBar
            isLastRing={currentRingIndex === rings.length - 1}
            autoAdvance={settings.autoAdvance}
            onNextRing={handleNextRing}
            onToggleAutoAdvance={(val) => updateSetting("autoAdvance", val)}
          />
        )}
      </main>

      {/* Game Over Modal */}
      {session && (
        <GameOverModal
          isOpen={isGameOver}
          scale={scale}
          mode={mode}
          seed={session.seed}
          seedCityName={session.seedCity.name}
          rings={rings}
          customShareUrl={getCustomShareUrl()}
          onRestart={initGame}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-slate-950" />}>
      <GeoRingsGame />
    </Suspense>
  );
}
