"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Settings,
  Sparkles,
  Trophy,
  RotateCcw,
  Eye,
  Layers,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { BlindPointMap } from "@/components/map/BlindPointMap";
import { BlindPointHUD } from "@/components/game/blindpoint/BlindPointHUD";
import { BlindPointResultModal } from "@/components/game/blindpoint/BlindPointResultModal";
import { BlindPointSummaryModal } from "@/components/game/blindpoint/BlindPointSummaryModal";
import { BlindPointSettingsModal } from "@/components/game/blindpoint/BlindPointSettingsModal";
import {
  BlindPointPack,
  BlindPointMode,
  BlindPointSessionInitResponse,
  BlindPointClientTarget,
  BlindPointRoundResult,
  BlindPointGuessResponse,
  BlindPointSettings,
  DEFAULT_BLINDPOINT_SETTINGS,
} from "@/lib/games/blindpoint/types";

function BlindPointGame() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPack = searchParams.get("pack") || "villes_france";
  const rawMode = searchParams.get("mode") || "daily";
  const userSeed = searchParams.get("seed") || "";

  const validPacks: BlindPointPack[] = ["villes_france", "monuments_monde", "chateaux_france"];
  const pack: BlindPointPack = validPacks.includes(rawPack as BlindPointPack)
    ? (rawPack as BlindPointPack)
    : "villes_france";
  const mode: BlindPointMode = rawMode === "free" ? "free" : "daily";

  // Game Settings
  const [settings, setSettings] = useState<BlindPointSettings>(DEFAULT_BLINDPOINT_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load saved settings from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("geohub_blindpoint_settings");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleUpdateSetting = <K extends keyof BlindPointSettings>(
    key: K,
    value: BlindPointSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("geohub_blindpoint_settings", JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_BLINDPOINT_SETTINGS);
    try {
      localStorage.setItem(
        "geohub_blindpoint_settings",
        JSON.stringify(DEFAULT_BLINDPOINT_SETTINGS)
      );
    } catch (e) {
      // ignore
    }
  };

  // Game Session States
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<BlindPointSessionInitResponse | null>(null);
  const [currentTarget, setCurrentTarget] = useState<BlindPointClientTarget | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);

  // Guess & Reveal States
  const [currentGuess, setCurrentGuess] = useState<{ lat: number; lon: number } | null>(null);
  const [currentTargetCoords, setCurrentTargetCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentRoundResult, setCurrentRoundResult] = useState<BlindPointRoundResult | null>(null);
  const [roundsHistory, setRoundsHistory] = useState<BlindPointRoundResult[]>([]);

  // Modals & Navigation
  const [showResultModal, setShowResultModal] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer State
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);

  // Initialize Game Session
  const initGame = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setCurrentGuess(null);
    setCurrentTargetCoords(null);
    setIsSubmitting(false);
    setIsRevealing(false);
    setCurrentRoundResult(null);
    setRoundsHistory([]);
    setIsGameOver(false);
    setShowResultModal(false);
    setShowSummaryModal(false);
    setRoundIndex(0);

    try {
      let url = `/api/games/blindpoint/session?pack=${pack}&mode=${mode}`;
      if (userSeed) url += `&seed=${userSeed}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur de chargement de session");
      const data: BlindPointSessionInitResponse = await res.json();

      setSession(data);
      setCurrentTarget(data.currentTarget);
      setRoundIndex(data.currentTarget.roundIndex);

      if (settings.timerDurationSeconds > 0) {
        setTimerSecondsLeft(settings.timerDurationSeconds);
      } else {
        setTimerSecondsLeft(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossible de démarrer la partie. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [pack, mode, userSeed, settings.timerDurationSeconds]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle Placing Pin on Map
  const handlePlaceGuess = (coords: { lat: number; lon: number }) => {
    if (isRevealing || isGameOver || isSubmitting) return;
    setCurrentGuess(coords);
  };

  // Submit and Validate Guess
  const handleValidateGuess = async () => {
    if (!session || !currentTarget || !currentGuess || isSubmitting || isRevealing) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/games/blindpoint/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack: session.pack,
          mode: session.mode,
          seed: session.seed,
          roundIndex,
          targetId: currentTarget.id,
          guessLat: currentGuess.lat,
          guessLon: currentGuess.lon,
        }),
      });

      if (!res.ok) throw new Error("Erreur de validation");
      const result: BlindPointGuessResponse = await res.json();

      // Set target coordinates for the reveal line on map
      setCurrentTargetCoords({
        lat: result.target.latitude,
        lon: result.target.longitude,
      });

      const roundRes: BlindPointRoundResult = {
        roundIndex: result.roundIndex,
        target: result.target,
        guess: result.guess,
        distanceKm: result.distanceKm,
        score: result.score,
        ratingEmoji: result.ratingEmoji,
        ratingLabel: result.ratingLabel,
      };

      setCurrentRoundResult(roundRes);
      setRoundsHistory((prev) => [...prev, roundRes]);
      setIsRevealing(true);
      setShowResultModal(true);

      // Prepare next target state
      if (result.isGameOver) {
        setIsGameOver(true);
      } else {
        // Keep next target ready
        setNextTargetBuffer(result.nextTarget);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur lors de la validation de votre tir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [nextTargetBuffer, setNextTargetBuffer] = useState<BlindPointClientTarget | null>(null);

  // Timer Countdown Effect
  useEffect(() => {
    if (
      settings.timerDurationSeconds <= 0 ||
      timerSecondsLeft === null ||
      isRevealing ||
      isGameOver ||
      loading
    ) {
      return;
    }

    if (timerSecondsLeft <= 0) {
      // Time up: if pin placed, validate; if not, place arbitrary guess or auto-validate
      if (currentGuess) {
        handleValidateGuess();
      } else {
        // Auto default guess in center if time expired without pin
        const fallback = pack === "monuments_monde" ? { lat: 0, lon: 0 } : { lat: 46.5, lon: 2.5 };
        setCurrentGuess(fallback);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimerSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timerSecondsLeft, settings.timerDurationSeconds, isRevealing, isGameOver, loading, currentGuess]);

  // Advance to Next Round or Final Summary
  const handleNextRound = () => {
    setShowResultModal(false);

    if (isGameOver) {
      setShowSummaryModal(true);
      return;
    }

    if (nextTargetBuffer) {
      setCurrentTarget(nextTargetBuffer);
      setRoundIndex(nextTargetBuffer.roundIndex);
      setNextTargetBuffer(null);
    }

    // Reset round states
    setCurrentGuess(null);
    setCurrentTargetCoords(null);
    setCurrentRoundResult(null);
    setIsRevealing(false);

    // Reset timer
    if (settings.timerDurationSeconds > 0) {
      setTimerSecondsLeft(settings.timerDurationSeconds);
    }
  };

  const currentTotalScore = useMemo(
    () => roundsHistory.reduce((sum, r) => sum + r.score, 0),
    [roundsHistory]
  );

  const scale = pack === "monuments_monde" ? "world" : "fr";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Loading Screen */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Compass className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-300 tracking-wide">
            Préparation du terrain aveugle...
          </p>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs font-semibold shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 hover:text-white underline text-[11px]"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Main Interactive Map */}
      <BlindPointMap
        scale={scale}
        roundIndex={roundIndex}
        isRevealing={isRevealing}
        isGameOverReview={isGameOver && !showSummaryModal && !showResultModal}
        currentGuess={currentGuess}
        currentTargetCoords={currentTargetCoords}
        currentTargetName={currentTarget?.name}
        allRounds={roundsHistory}
        showBorders={settings.showBorders}
        onPlaceGuess={handlePlaceGuess}
      />

      {/* Game HUD (Top Bar & Target Floating Card & Validate Button) */}
      {!loading && (
        <BlindPointHUD
          currentTarget={currentTarget}
          roundIndex={roundIndex}
          totalRounds={5}
          currentTotalScore={currentTotalScore}
          hasPlacedGuess={currentGuess !== null}
          isSubmitting={isSubmitting}
          isRevealing={isRevealing}
          timerSecondsLeft={timerSecondsLeft}
          pack={pack}
          mode={mode}
          showRegionHints={settings.showRegionHints}
          onValidateGuess={handleValidateGuess}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {/* Intermediate Round Result Modal */}
      <BlindPointResultModal
        isOpen={showResultModal}
        roundResult={currentRoundResult}
        roundIndex={roundIndex}
        totalRounds={5}
        onNextRound={handleNextRound}
      />

      {/* Floating Bottom Re-open Summary Button (when inspecting review map) */}
      {isGameOver && !showSummaryModal && !showResultModal && (
        <div className="absolute bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={() => setShowSummaryModal(true)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-2xl shadow-blue-600/40 border border-blue-400 transition-all hover:scale-105 active:scale-95"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Rouvrir le Bilan Final ({currentTotalScore.toLocaleString("fr-FR")} pts)</span>
          </button>
        </div>
      )}

      {/* Final Summary Modal (Game Over) */}
      <BlindPointSummaryModal
        isOpen={showSummaryModal}
        pack={pack}
        mode={mode}
        seed={session?.seed || ""}
        rounds={roundsHistory}
        onRestartGame={() => {
          if (mode === "free") {
            router.push(`/play/blindpoint?pack=${pack}&mode=free&seed=${Date.now()}`);
          } else {
            initGame();
          }
        }}
        onCloseToMap={() => setShowSummaryModal(false)}
      />

      {/* Settings Modal */}
      <BlindPointSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSetting={handleUpdateSetting}
        onResetDefaults={handleResetSettings}
      />
    </div>
  );
}

export default function BlindPointPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Chargement de Blind Point...
        </div>
      }
    >
      <BlindPointGame />
    </Suspense>
  );
}
