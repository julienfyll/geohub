"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  Settings,
  Sparkles,
  Trophy,
  RotateCcw,
  Eye,
  Layers,
  MapPin,
  AlertCircle,
  Play,
  Globe,
  Zap,
  Calendar,
  Check,
  Award,
  Landmark,
  Building2,
  Sliders,
} from "lucide-react";
import { BlindPointMap } from "@/components/map/BlindPointMap";
import { BlindPointHUD } from "@/components/game/blindpoint/BlindPointHUD";
import { BlindPointResultModal } from "@/components/game/blindpoint/BlindPointResultModal";
import { BlindPointLearningCard } from "@/components/game/blindpoint/BlindPointLearningCard";
import { BlindPointSummaryModal } from "@/components/game/blindpoint/BlindPointSummaryModal";
import { BlindPointSettingsModal } from "@/components/game/blindpoint/BlindPointSettingsModal";
import { BlindPointCustomModal } from "@/components/game/blindpoint/BlindPointCustomModal";
import { UserNav } from "@/components/navigation/UserNav";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";
import {
  BlindPointCategory,
  BlindPointPack,
  BlindPointMode,
  BlindPointDifficulty,
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
  const rawPacks = searchParams.get("packs") || "";
  const rawMode = searchParams.get("mode") || "daily";
  const rawDiff = searchParams.get("difficulty") || searchParams.get("diff") || "moyen";
  const rawRounds = searchParams.get("rounds");
  const rawTimer = searchParams.get("timer");
  const rawTheme = searchParams.get("theme");
  const rawBorders = searchParams.get("borders");
  const rawRoads = searchParams.get("roads");
  const rawContinent = searchParams.get("continent");
  const rawPlay = searchParams.get("play") === "1";
  const userSeed = searchParams.get("seed") || "";

  const validPacks: BlindPointPack[] = [
    "villes_france",
    "villes_monde",
    "villes_europe",
    "lieux_france",
    "lieux_paris",
    "lieux_monde",
    "monuments_monde",
    "chateaux_france",
  ];
  const pack: BlindPointPack = validPacks.includes(rawPack as BlindPointPack)
    ? (rawPack as BlindPointPack)
    : "villes_france";
  const mode: BlindPointMode = rawMode === "custom" ? "custom" : rawMode === "free" ? "free" : "daily";

  const difficulty: BlindPointDifficulty | "all" =
    rawDiff === "all" ? "all" : ["facile", "moyen", "difficile"].includes(rawDiff)
      ? (rawDiff as BlindPointDifficulty)
      : "all";

  const isLieuxInitial = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
  const initialTerritory: "france" | "paris" | "monde" =
    pack === "lieux_paris"
      ? "paris"
      : pack === "villes_monde" || pack === "lieux_monde" || pack === "monuments_monde" || pack === "villes_europe"
      ? "monde"
      : "france";

  // Lobby vs Active Game State
  const isPlaying = rawPlay;
  const [selectedCategory, setSelectedCategory] = useState<BlindPointCategory>(
    isLieuxInitial ? "lieux_emblematiques" : "villes"
  );
  const [selectedTerritory, setSelectedTerritory] = useState<"france" | "paris" | "monde">(
    initialTerritory
  );
  const [selectedPack, setSelectedPack] = useState<BlindPointPack>(pack);
  const [selectedDifficulty, setSelectedDifficulty] = useState<BlindPointDifficulty | "all">(
    difficulty
  );
  const [selectedMode, setSelectedMode] = useState<BlindPointMode>(mode);

  // Custom Challenge Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Sync lobby state if URL changes while in lobby
  useEffect(() => {
    if (!rawPlay) {
      setSelectedPack(pack);
      setSelectedDifficulty(difficulty === "all" ? "moyen" : difficulty);
      setSelectedMode(mode);
      const isL = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
      setSelectedCategory(isL ? "lieux_emblematiques" : "villes");
      const terr: "france" | "paris" | "monde" =
        pack === "lieux_paris"
          ? "paris"
          : pack === "villes_monde" || pack === "lieux_monde" || pack === "monuments_monde"
          ? "monde"
          : "france";
      setSelectedTerritory(terr);
    }
  }, [pack, difficulty, mode, rawPlay]);

  const handleSelectCategory = (cat: BlindPointCategory) => {
    setSelectedCategory(cat);
    const terr = cat === "villes" && selectedTerritory === "paris" ? "france" : selectedTerritory;
    if (terr !== selectedTerritory) {
      setSelectedTerritory(terr);
    }
    const newPack =
      cat === "villes"
        ? (terr === "france" ? "villes_france" : "villes_monde")
        : (terr === "paris" ? "lieux_paris" : terr === "france" ? "lieux_france" : "lieux_monde");
    setSelectedPack(newPack);
  };

  const handleSelectTerritory = (terr: "france" | "paris" | "monde") => {
    setSelectedTerritory(terr);
    const newPack =
      selectedCategory === "villes"
        ? (terr === "france" ? "villes_france" : "villes_monde")
        : (terr === "paris" ? "lieux_paris" : terr === "france" ? "lieux_france" : "lieux_monde");
    setSelectedPack(newPack);
  };

  // Game Settings
  const [settings, setSettings] = useState<BlindPointSettings>(DEFAULT_BLINDPOINT_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load saved settings from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("geohub_blindpoint_settings");
      if (saved) {
        setSettings({ ...DEFAULT_BLINDPOINT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Soft override map layout settings if joining via a Custom Challenge link
  useEffect(() => {
    if (rawMode === "custom") {
      setSettings((prev) => ({
        ...prev,
        mapTheme:
          rawTheme === "satellite" || rawTheme === "voyager" || rawTheme === "dark"
            ? rawTheme
            : prev.mapTheme,
        showBorders: rawBorders === "0" ? false : rawBorders === "1" ? true : prev.showBorders,
        showRoads: rawRoads === "0" ? false : rawRoads === "1" ? true : prev.showRoads,
      }));
    }
  }, [rawMode, rawTheme, rawBorders, rawRoads]);

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
  const [loading, setLoading] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<number>(0);
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

  // Load Game Session from parameters
  const loadGameSession = useCallback(
    async (
      targetPack: BlindPointPack,
      targetDiff: BlindPointDifficulty | "all",
      targetMode: BlindPointMode,
      targetSeed?: string,
      targetPacks?: string,
      targetRounds?: string,
      targetTimer?: string,
      targetContinent?: string
    ) => {
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
      setCurrentTarget(null);
      setNextTargetBuffer(null);

      // Increment gameSessionId to guarantee that BlindPointMap unmounts and remounts clean
      setGameSessionId((prev) => prev + 1);

      try {
        let url = `/api/games/blindpoint/session?pack=${targetPack}&mode=${targetMode}`;
        if (targetPacks) url += `&packs=${encodeURIComponent(targetPacks)}`;
        if (targetDiff) url += `&difficulty=${targetDiff}`;
        if (targetRounds) url += `&rounds=${targetRounds}`;
        if (targetTimer) url += `&timer=${targetTimer}`;
        if (targetContinent) url += `&continent=${targetContinent}`;
        if (targetSeed) url += `&seed=${targetSeed}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Erreur de chargement de session");
        const data: BlindPointSessionInitResponse = await res.json();

        setSession(data);
        setCurrentTarget(data.currentTarget);
        setRoundIndex(data.currentTarget.roundIndex);

        if (data.timerSeconds !== undefined && data.timerSeconds > 0) {
          setTimerSecondsLeft(data.timerSeconds);
        } else if (settings.timerDurationSeconds > 0) {
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
    },
    [settings.timerDurationSeconds]
  );

  // Load game session whenever in active play mode (play=1) and parameters are defined
  useEffect(() => {
    if (isPlaying) {
      loadGameSession(
        pack,
        difficulty,
        mode,
        userSeed || undefined,
        rawPacks || undefined,
        rawRounds || undefined,
        rawTimer || undefined,
        rawContinent || undefined
      );
    }
  }, [
    isPlaying,
    pack,
    difficulty,
    mode,
    userSeed,
    rawPacks,
    rawRounds,
    rawTimer,
    rawContinent,
    loadGameSession,
  ]);

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
          packs: session.packs,
          mode: session.mode,
          difficulty: session.difficulty,
          seed: session.seed,
          roundIndex,
          totalRounds: session.totalRounds || (rawRounds ? parseInt(rawRounds, 10) : 5),
          continent: rawContinent || undefined,
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

  const totalRounds = session?.totalRounds || (rawRounds ? parseInt(rawRounds, 10) : 5);

  const currentTotalScore = useMemo(
    () => roundsHistory.reduce((sum, r) => sum + r.score, 0),
    [roundsHistory]
  );

  const activePack = isPlaying
    ? (session?.pack || currentTarget?.pack || pack)
    : selectedPack;

  const scale =
    session?.scale ||
    (activePack === "lieux_paris"
      ? "paris"
      : activePack === "villes_monde" || activePack === "lieux_monde" || activePack === "monuments_monde"
      ? "world"
      : "fr");

  const handleStartGame = (p: BlindPointPack, d: BlindPointDifficulty | "all", m: BlindPointMode) => {
    const freeSeed = m === "free" ? `&seed=${Date.now()}` : "";
    const diffParam = d === "all" ? "&difficulty=all" : `&difficulty=${d}`;
    router.push(`/play/blindpoint?pack=${p}${diffParam}&mode=${m}${freeSeed}&play=1`);
  };

  const handleChangeGameConfig = (
    p: BlindPointPack,
    d: BlindPointDifficulty | "all",
    m: BlindPointMode
  ) => {
    if (m === mode && p === pack && d === difficulty) {
      if (m === "free" || m === "custom") {
        router.push(`/play/blindpoint?pack=${p}&difficulty=${d}&mode=${m}&seed=${Date.now()}&play=1`);
      } else {
        loadGameSession(p, d, m, undefined);
      }
      return;
    }

    const freeSeed = m === "free" ? `&seed=${Date.now()}` : "";
    router.push(`/play/blindpoint?pack=${p}&difficulty=${d}&mode=${m}${freeSeed}&play=1`);
  };

  const handleRestartCurrentGame = () => {
    setNextTargetBuffer(null);
    const p = session?.pack || pack;
    const d = session?.difficulty || difficulty;
    const m = session?.mode || mode;

    if (m === "free" || m === "custom") {
      const freeSeed = `&seed=${Date.now()}`;
      let url = `/play/blindpoint?pack=${p}&difficulty=${d}&mode=${m}${freeSeed}`;
      if (rawPacks) url += `&packs=${encodeURIComponent(rawPacks)}`;
      if (rawRounds) url += `&rounds=${rawRounds}`;
      if (rawTimer) url += `&timer=${rawTimer}`;
      if (rawTheme) url += `&theme=${rawTheme}`;
      if (rawBorders) url += `&borders=${rawBorders}`;
      if (rawRoads) url += `&roads=${rawRoads}`;
      if (rawContinent) url += `&continent=${rawContinent}`;
      url += `&play=1`;
      router.push(url);
    } else {
      loadGameSession(p, d, m, undefined);
    }
  };

  const getCustomShareUrl = () => {
    if (typeof window === "undefined") return "";
    let url = `${window.location.origin}/play/blindpoint?mode=${session?.mode || mode}`;
    if (session?.packs && session.packs.length > 0) {
      url += `&packs=${session.packs.join(",")}`;
    } else {
      url += `&pack=${session?.pack || pack}`;
    }
    url += `&rounds=${totalRounds}`;
    if (session?.difficulty && session.difficulty !== "all") url += `&diff=${session.difficulty}`;
    if (session?.timerSeconds) url += `&timer=${session.timerSeconds}`;
    if (rawContinent) url += `&continent=${rawContinent}`;
    if (settings.mapTheme !== "dark") url += `&theme=${settings.mapTheme}`;
    if (!settings.showBorders) url += `&borders=0`;
    if (!settings.showRoads) url += `&roads=0`;
    url += `&seed=${session?.seed || userSeed}&play=1`;
    return url;
  };

  const handleBackToLobby = () => {
    setShowSummaryModal(false);
    setShowResultModal(false);
    setIsGameOver(false);
    setRoundsHistory([]);
    setCurrentGuess(null);
    setCurrentTargetCoords(null);
    setIsRevealing(false);
    setRoundIndex(0);
    setSession(null);
    router.push("/play/blindpoint");
  };

  // If player is in Lobby / Selection Screen
  if (!isPlaying) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Navigation Bar */}
        <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <QuickMenuDrawer />
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Hub</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">Blind Point</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LeaderboardTriggerButton
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all shadow-sm cursor-pointer"
                label="Classement"
                initialGame="blindpoint"
              />
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Paramètres de jeu"
              >
                <Settings className="w-4 h-4" />
              </button>
              <UserNav />
            </div>
          </div>
        </nav>

        {/* Main Cockpit / Selection Screen */}
        <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full space-y-10">
          
          {/* 1. RAPPEL DES DÉFIS DU JOUR BLIND POINT (FLASHY) */}
          <section className="p-6 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-44 h-44 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rendez-vous Officiels du Jour (Blind Point)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Tirages uniques du jour</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {/* France */}
              <button
                type="button"
                onClick={() => handleStartGame("villes_france", "all", "daily")}
                className="p-3 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 text-left transition-all group shadow-[0_0_15px_rgba(16,185,129,0.2)] flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300">🇫🇷 France</span>
                  <span className="text-[10px] text-slate-400 font-mono">139 villes</span>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              </button>

              {/* Europe */}
              <button
                type="button"
                onClick={() => handleStartGame("villes_europe", "all", "daily")}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300">🇪🇺 Europe</span>
                  <span className="text-[10px] text-slate-400 font-mono">42 métropoles</span>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              </button>

              {/* Monde */}
              <button
                type="button"
                onClick={() => handleStartGame("villes_monde", "all", "daily")}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300">🌍 Monde</span>
                  <span className="text-[10px] text-slate-400 font-mono">167 mégapoles</span>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              </button>

              {/* Paris */}
              <button
                type="button"
                onClick={() => handleStartGame("lieux_paris", "all", "daily")}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300">🗼 Paris</span>
                  <span className="text-[10px] text-slate-400 font-mono">105 trésors</span>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              </button>

              {/* Merveilles */}
              <button
                type="button"
                onClick={() => handleStartGame("lieux_monde", "all", "daily")}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300">🏛️ Merveilles</span>
                  <span className="text-[10px] text-slate-400 font-mono">50 sites UNESCO</span>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* 2. ESPACE PARTIE RAPIDE (IMMÉDIAT & FLUIDE) */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Lancement de Partie Rapide</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Entraînement illimité. Choisissez votre terrain et votre niveau pour jouer immédiatement.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">5 manches</span>
            </div>

            {/* Étape 1 : Choix du Terrain */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                1. Déclinaison / Terrain
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPack("villes_france")}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    selectedPack === "villes_france"
                      ? "border-emerald-500 bg-emerald-950/30 text-white font-bold shadow-md shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                  }`}
                >
                  <span className="text-lg block mb-1">🇫🇷</span>
                  <span className="text-xs block">France</span>
                  <span className="text-[10px] text-slate-400 font-mono">139 villes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPack("villes_europe")}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    selectedPack === "villes_europe"
                      ? "border-emerald-500 bg-emerald-950/30 text-white font-bold shadow-md shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                  }`}
                >
                  <span className="text-lg block mb-1">🇪🇺</span>
                  <span className="text-xs block">Europe</span>
                  <span className="text-[10px] text-slate-400 font-mono">42 villes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPack("villes_monde")}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    selectedPack === "villes_monde"
                      ? "border-emerald-500 bg-emerald-950/30 text-white font-bold shadow-md shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                  }`}
                >
                  <span className="text-lg block mb-1">🌍</span>
                  <span className="text-xs block">Monde</span>
                  <span className="text-[10px] text-slate-400 font-mono">167 villes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPack("lieux_paris")}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    selectedPack === "lieux_paris"
                      ? "border-emerald-500 bg-emerald-950/30 text-white font-bold shadow-md shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                  }`}
                >
                  <span className="text-lg block mb-1">🗼</span>
                  <span className="text-xs block">Paris Intra</span>
                  <span className="text-[10px] text-slate-400 font-mono">105 sites</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPack("lieux_monde")}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    selectedPack === "lieux_monde"
                      ? "border-emerald-500 bg-emerald-950/30 text-white font-bold shadow-md shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                  }`}
                >
                  <span className="text-lg block mb-1">🏛️</span>
                  <span className="text-xs block">Merveilles</span>
                  <span className="text-[10px] text-slate-400 font-mono">50 sites</span>
                </button>
              </div>
            </div>

            {/* Étape 2 : Niveau de Difficulté ("Tout le pool" par défaut et à gauche !) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  2. Niveau de Difficulté
                </label>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {selectedDifficulty === "all"
                    ? "Recommandé : Tout le pool"
                    : `Niveau sélectionné : ${selectedDifficulty.toUpperCase()}`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("all")}
                  className={`py-2.5 rounded-xl transition-all text-center text-xs font-bold ${
                    selectedDifficulty === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  🎲 Tout le pool
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("facile")}
                  className={`py-2.5 rounded-xl transition-all text-center text-xs font-bold ${
                    selectedDifficulty === "facile"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-400 hover:bg-slate-900"
                  }`}
                >
                  🟢 Facile
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("moyen")}
                  className={`py-2.5 rounded-xl transition-all text-center text-xs font-bold ${
                    selectedDifficulty === "moyen"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-amber-400 hover:bg-slate-900"
                  }`}
                >
                  🟡 Moyen
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("difficile")}
                  className={`py-2.5 rounded-xl transition-all text-center text-xs font-bold ${
                    selectedDifficulty === "difficile"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-400 hover:bg-slate-900"
                  }`}
                >
                  🔴 Difficile
                </button>
              </div>

              <p className="text-xs text-slate-400 px-1 pt-1">
                {selectedDifficulty === "all" &&
                  "🎲 Tirage équilibré et varié sur l'ensemble des cibles du catalogue (recommandé)."}
                {selectedDifficulty === "facile" &&
                  "🟢 Grandes métropoles et sites emblématiques évidents."}
                {selectedDifficulty === "moyen" &&
                  "🟡 Villes moyennes, sous-préfectures et métropoles régionales."}
                {selectedDifficulty === "difficile" &&
                  "🔴 Terroirs secrets, préfectures discrètes et cibles pointues."}
              </p>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleStartGame(selectedPack, selectedDifficulty, "free")}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white font-extrabold text-base shadow-2xl shadow-emerald-600/30 transition-all active:scale-[0.99]"
              >
                <Zap className="w-5 h-5 text-amber-300" />
                <span>⚡ Lancer la Partie Rapide (5 Manches)</span>
              </button>
            </div>
          </section>

          {/* 3. GRAND ENCADRÉ PREMIUM : DÉFI PERSONNALISÉ (CUSTOM CHALLENGE) BIEN VOYANT */}
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/40 border-2 border-purple-500/50 hover:border-purple-400/80 transition-all shadow-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute -right-24 -bottom-24 w-60 h-60 bg-purple-600/15 blur-[90px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Multijoueur & Règles Libres</span>
                  </span>
                  <span className="text-xs text-purple-400 font-semibold">• Personnalisation Complète</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Envie d'un Défi sur-mesure ou de Défier vos Amis ?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Créez votre propre salon de jeu : combinez plusieurs territoires, imposez un chrono serré et partagez le lien généré pour comparer vos scores.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 shrink-0 group-hover:scale-105"
              >
                <span>⚙️ Configurer un Défi Custom</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 relative z-10">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/20 flex items-center gap-3">
                <span className="text-xl">🎛️</span>
                <div>
                  <span className="text-xs font-bold text-white block">Mix de Packs</span>
                  <span className="text-[11px] text-slate-400">France + Monde, Paris + Châteaux...</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/20 flex items-center gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <span className="text-xs font-bold text-white block">Chrono & Manches</span>
                  <span className="text-[11px] text-slate-400">De 3 à 15 manches, timer réglable</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/20 flex items-center gap-3">
                <span className="text-xl">🔗</span>
                <div>
                  <span className="text-xs font-bold text-white block">Lien de Défi Amis</span>
                  <span className="text-[11px] text-slate-400">Exactement les mêmes cibles partagées</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Settings Modal (available even in lobby) */}
        <BlindPointSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onUpdateSetting={handleUpdateSetting}
          onResetDefaults={handleResetSettings}
        />

        {/* Custom Challenge Creator Modal (accessible in lobby) */}
        <BlindPointCustomModal
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          initialPack={selectedPack}
          initialDifficulty={selectedDifficulty}
        />
      </div>
    );
  }

  // Active Game View
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
        key={`blindpoint-map-${gameSessionId}`}
        scale={scale}
        roundIndex={roundIndex}
        isRevealing={isRevealing}
        isGameOverReview={isGameOver && !showSummaryModal && !showResultModal}
        currentGuess={currentGuess}
        currentTargetCoords={currentTargetCoords}
        currentTargetName={
          isRevealing && currentRoundResult ? currentRoundResult.target.name : currentTarget?.name
        }
        allRounds={roundsHistory}
        showBorders={settings.showBorders}
        showRoads={settings.showRoads ?? true}
        showNature={settings.showNature ?? true}
        mapTheme={settings.mapTheme || "dark"}
        onPlaceGuess={handlePlaceGuess}
      />

      {/* Game HUD (Top Bar & Target Floating Card & Validate Button) */}
      {!loading && (
        <BlindPointHUD
          currentTarget={currentTarget}
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          currentTotalScore={currentTotalScore}
          hasPlacedGuess={currentGuess !== null}
          isSubmitting={isSubmitting}
          isRevealing={isRevealing}
          isGameOver={isGameOver}
          timerSecondsLeft={timerSecondsLeft}
          pack={activePack}
          packs={session?.packs}
          difficulty={session?.difficulty || difficulty}
          mode={session?.mode || mode}
          seed={session?.seed || userSeed}
          showRegionHints={settings.showRegionHints}
          showTargetPhoto={settings.showTargetPhoto}
          showTargetName={settings.showTargetName}
          onValidateGuess={handleValidateGuess}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenSummary={() => setShowSummaryModal(true)}
          onBackToLobby={handleBackToLobby}
          onOpenCustomModal={() => setShowCustomModal(true)}
          onChangeMode={handleChangeGameConfig}
        />
      )}

      {/* Intermediate Round Result Modal (Bottom Gameplay Bar) */}
      <BlindPointResultModal
        isOpen={showResultModal}
        roundResult={currentRoundResult}
        roundIndex={roundIndex}
        totalRounds={totalRounds}
        onNextRound={handleNextRound}
      />

      {/* Dedicated Right-Side Learning Panel (Apprentissage & Culture) */}
      <BlindPointLearningCard
        isOpen={showResultModal && !showSummaryModal}
        target={currentRoundResult?.target || null}
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
        pack={session?.pack || pack}
        packs={session?.packs}
        difficulty={session?.difficulty || difficulty}
        mode={session?.mode || mode}
        seed={session?.seed || userSeed}
        totalRounds={totalRounds}
        customShareUrl={getCustomShareUrl()}
        rounds={roundsHistory}
        onRestartGame={handleRestartCurrentGame}
        onCloseToMap={() => setShowSummaryModal(false)}
        onBackToLobby={handleBackToLobby}
      />

      {/* Custom Challenge Creator Modal */}
      <BlindPointCustomModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        initialPack={pack}
        initialDifficulty={difficulty}
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
