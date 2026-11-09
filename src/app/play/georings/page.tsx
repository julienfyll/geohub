"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
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
  Trophy,
  Heart,
  Target,
  Zap,
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
  const [showGameOverModal, setShowGameOverModal] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentRingGuesses, setCurrentRingGuesses] = useState<GuessRecord[]>([]);
  const [currentRingTopCities, setCurrentRingTopCities] = useState<TopCityItem[]>([]);
  const [hoveredReviewCity, setHoveredReviewCity] = useState<TopCityItem | GuessRecord | null>(null);
  const [pinnedReviewCities, setPinnedReviewCities] = useState<Map<string, TopCityItem | GuessRecord>>(new Map());
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
    setShowGameOverModal(true);
    setIsReviewing(false);
    setCurrentRingGuesses([]);
    setCurrentRingTopCities([]);
    setHoveredReviewCity(null);
    setPinnedReviewCities(new Map());
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
        id: city.id,
        cityName: city.name,
        countryCode: city.countryCode,
        population: result.city.population,
        isTarget: result.isTarget,
        isInRing: result.isInRing,
        rank: result.guessRank,
        latitude: result.city.latitude,
        longitude: result.city.longitude,
      };
      setCurrentRingGuesses((prev) => [...prev, guessRecord]);

      if (result.isTarget) {
        // Success !
        const triesUsed = totalTries === -1 ? 1 : totalTries - triesLeft + 1;
        setFeedback({ text: result.message, type: "success" });

        if (result.topCities) {
          setCurrentRingTopCities(result.topCities);
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
      setHoveredReviewCity(null);
      setPinnedReviewCities(new Map());
      setFeedback(null);
    } else {
      setIsReviewing(false);
      setHoveredReviewCity(null);
      setPinnedReviewCities(new Map());
      setIsGameOver(true);
      setShowGameOverModal(true);
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

  // Helper to extract unique identifier for review cities
  const getReviewCityId = (c: TopCityItem | GuessRecord) => {
    if ("id" in c && c.id) return c.id;
    if ("cityName" in c && c.cityName) return `guess_${c.cityName}`;
    if ("name" in c && c.name) return `top_${c.name}`;
    return "";
  };

  const handleReviewCityClick = (city: TopCityItem | GuessRecord) => {
    const id = getReviewCityId(city);
    if (!id) return;
    setPinnedReviewCities((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, city);
      }
      return next;
    });
  };

  const pinnedCityIds = useMemo(() => new Set(pinnedReviewCities.keys()), [pinnedReviewCities]);
  const hoveredCityId = hoveredReviewCity ? getReviewCityId(hoveredReviewCity) : null;

  // Ephemeral markers displayed during ring review mode
  const displayedMarkers = useMemo(() => {
    if (!isReviewing) return markers;

    const extraMarkers: MapMarker[] = [];
    const addedCoords = new Set<string>();

    const addPreview = (c: TopCityItem | GuessRecord) => {
      const lat = "latitude" in c ? c.latitude : undefined;
      const lon = "longitude" in c ? c.longitude : undefined;
      if (lat === undefined || lon === undefined) return;

      const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (addedCoords.has(coordKey)) return;
      addedCoords.add(coordKey);

      const id = getReviewCityId(c);
      const name = "name" in c ? c.name : (c as GuessRecord).cityName;
      const rank = "rank" in c ? c.rank : undefined;

      extraMarkers.push({
        id: `preview_${id}`,
        lat,
        lon,
        label: rank ? `${rank}. ${name}` : name,
        population: c.population,
        type: "top",
      });
    };

    // Add pinned review cities
    pinnedReviewCities.forEach((city) => addPreview(city));

    // Add hovered review city if present
    if (hoveredReviewCity) {
      addPreview(hoveredReviewCity);
    }

    if (extraMarkers.length === 0) return markers;

    const filteredBase = markers.filter((m) => {
      const key = `${m.lat.toFixed(4)},${m.lon.toFixed(4)}`;
      return !addedCoords.has(key);
    });

    return [...filteredBase, ...extraMarkers];
  }, [markers, isReviewing, pinnedReviewCities, hoveredReviewCity]);

  // Focused city for interactive popup in GeoMap
  const focusedCity = useMemo(() => {
    if (!isReviewing || !hoveredReviewCity) return null;
    const lat = "latitude" in hoveredReviewCity ? hoveredReviewCity.latitude : undefined;
    const lon = "longitude" in hoveredReviewCity ? hoveredReviewCity.longitude : undefined;
    if (lat === undefined || lon === undefined) return null;
    const name = "name" in hoveredReviewCity ? hoveredReviewCity.name : hoveredReviewCity.cityName;
    const rank = "rank" in hoveredReviewCity ? hoveredReviewCity.rank : undefined;
    return {
      lat,
      lon,
      label: rank ? `${rank}. ${name}` : name,
      population: hoveredReviewCity.population,
    };
  }, [isReviewing, hoveredReviewCity]);

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
          {/* Mode Switcher : Daily | Rapide | Custom */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                if (mode === "daily") {
                  initGame();
                } else {
                  router.push(`/play/georings?scale=${scale}&mode=daily`);
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "daily"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Défi officiel du jour (1 ville par jour pour tous)"
            >
              <span>📅 Du Jour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode === "free") {
                  initGame();
                } else {
                  router.push(`/play/georings?scale=${scale}&mode=free`);
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "free"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Partie rapide standard avec une ville aléatoire"
            >
              <Zap className="w-3 h-3" />
              <span>Rapide</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "custom"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Personnaliser les anneaux, rayons, continent et vies"
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
          {/* Final Summary button when game is over */}
          {isGameOver && (
            <button
              onClick={() => setShowGameOverModal(true)}
              title="Voir le bilan final de la partie"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Bilan</span>
            </button>
          )}

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

      {/* Vertical Ring Progress Bar (Right Side) */}
      {rings.length > 0 && (
        <aside className="absolute top-20 right-4 z-30 pointer-events-auto hidden sm:block">
          <RingProgressHUD
            rings={rings}
            currentRingIndex={currentRingIndex}
          />
        </aside>
      )}

      {/* Unified Compact Top Control Bar (Center) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl sm:max-w-2xl px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/95 border border-slate-800/90 rounded-2xl p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-2 transition-all">
          {/* Main Controls Row: [Target Radius] | [SearchBar] | [Passer] | [Lives] */}
          <div className="flex items-center gap-2">
            {/* 1. Active Ring & Radius Badge */}
            {rings[currentRingIndex] && (
              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 font-semibold text-xs shrink-0 whitespace-nowrap shadow-sm">
                <Target className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin-slow" />
                <span>
                  {rings[currentRingIndex].innerRadiusKm === 0
                    ? `< ${rings[currentRingIndex].outerRadiusKm} km`
                    : `${rings[currentRingIndex].innerRadiusKm}-${rings[currentRingIndex].outerRadiusKm} km`}
                </span>
              </div>
            )}

            {/* 2. Search Input */}
            <div className="flex-1 min-w-0">
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
                    ? "Anneau terminé — Espace pour continuer..."
                    : `Tapez la ville la plus peuplée...`
                }
              />
            </div>

            {/* 3. Skip Button (active during play) */}
            {!isReviewing && !isGameOver && (
              <button
                type="button"
                onClick={handleSkipRing}
                disabled={isSubmitting || loading}
                title="Passer au cercle suivant (Espace)"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md shrink-0 disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <SkipForward className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                <span className="hidden sm:inline">Passer</span>
                <kbd className="hidden lg:inline px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-400">
                  Espace
                </kbd>
              </button>
            )}

            {/* 4. Lives Counter */}
            <div
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shrink-0 shadow-sm"
              title={totalTries === -1 ? "Vies illimitées" : `${triesLeft}/${totalTries} vie(s) restante(s)`}
            >
              {totalTries === -1 ? (
                <span className="text-emerald-400 font-bold text-xs">♾️</span>
              ) : (
                Array.from({ length: totalTries }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      i < triesLeft
                        ? "text-rose-500 fill-rose-500"
                        : "text-slate-700 fill-slate-800"
                    }`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Integrated Feedback / Direction Hint Row (compact, inside same card) */}
          {feedback && (
            <div
              className={`px-3 py-2 rounded-xl border text-xs font-semibold shadow-inner flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                feedback.type === "success"
                  ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                  : feedback.type === "error"
                  ? "bg-rose-950/80 border-rose-500/50 text-rose-200"
                  : feedback.type === "warning"
                  ? "bg-amber-950/80 border-amber-500/50 text-amber-200"
                  : "bg-slate-900/80 border-slate-700 text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{feedback.text}</span>
              </div>

              {settings.showDirectionHints && feedback.directionHint && (
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-200 font-bold text-[11px] flex items-center gap-1 shadow-sm">
                  <span>{feedback.directionHint.arrow}</span>
                  <span>Vers le {feedback.directionHint.label}</span>
                </span>
              )}
            </div>
          )}
        </div>
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
            markers={displayedMarkers}
            showBorders={settings.showBorders}
            mapTheme={settings.mapTheme}
            focusedCity={focusedCity}
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
              {mode === "daily" ? "Du Jour" : mode === "custom" ? "Custom" : "Partie Rapide"}
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
            pinnedCityIds={pinnedCityIds}
            hoveredCityId={hoveredCityId}
            onCityHover={setHoveredReviewCity}
            onCityClick={handleReviewCityClick}
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

      {/* Re-open Game Over Button (when closed to observe map) */}
      {isGameOver && !showGameOverModal && (
        <button
          type="button"
          onClick={() => setShowGameOverModal(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm border border-slate-700/80 shadow-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-200"
          title="Rouvrir le bilan final de la partie"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Afficher le bilan</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-400 text-xs font-mono font-bold">
            {rings.filter((r) => r.isCompleted).length}/{rings.length}
          </span>
        </button>
      )}

      {/* Game Over Modal */}
      {session && (
        <GameOverModal
          isOpen={isGameOver && showGameOverModal}
          scale={scale}
          mode={mode}
          seed={session.seed}
          seedCityName={session.seedCity.name}
          rings={rings}
          customShareUrl={getCustomShareUrl()}
          onRestart={initGame}
          onClose={() => setShowGameOverModal(false)}
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
