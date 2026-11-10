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
  Play,
  Globe,
  Zap,
  Calendar,
  Check,
  Award,
  Landmark,
  Building2,
} from "lucide-react";
import { BlindPointMap } from "@/components/map/BlindPointMap";
import { BlindPointHUD } from "@/components/game/blindpoint/BlindPointHUD";
import { BlindPointResultModal } from "@/components/game/blindpoint/BlindPointResultModal";
import { BlindPointSummaryModal } from "@/components/game/blindpoint/BlindPointSummaryModal";
import { BlindPointSettingsModal } from "@/components/game/blindpoint/BlindPointSettingsModal";
import { UserNav } from "@/components/navigation/UserNav";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
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
  const rawMode = searchParams.get("mode") || "daily";
  const rawDiff = searchParams.get("difficulty") || "moyen";
  const rawPlay = searchParams.get("play") === "1";
  const userSeed = searchParams.get("seed") || "";

  const validPacks: BlindPointPack[] = [
    "villes_france",
    "villes_monde",
    "lieux_france",
    "lieux_paris",
    "lieux_monde",
    "monuments_monde",
    "chateaux_france",
  ];
  const pack: BlindPointPack = validPacks.includes(rawPack as BlindPointPack)
    ? (rawPack as BlindPointPack)
    : "villes_france";
  const mode: BlindPointMode = rawMode === "free" ? "free" : "daily";

  const validDifficulties: BlindPointDifficulty[] = ["facile", "moyen", "difficile"];
  const difficulty: BlindPointDifficulty = validDifficulties.includes(rawDiff as BlindPointDifficulty)
    ? (rawDiff as BlindPointDifficulty)
    : "moyen";

  const isLieuxInitial = pack.startsWith("lieux_") || pack === "chateaux_france" || pack === "monuments_monde";
  const initialTerritory: "france" | "paris" | "monde" =
    pack === "lieux_paris"
      ? "paris"
      : pack === "villes_monde" || pack === "lieux_monde" || pack === "monuments_monde"
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<BlindPointDifficulty>(difficulty);
  const [selectedMode, setSelectedMode] = useState<BlindPointMode>(mode);

  // Sync lobby state if URL changes while in lobby
  useEffect(() => {
    if (!rawPlay) {
      setSelectedPack(pack);
      setSelectedDifficulty(difficulty);
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
      targetDiff: BlindPointDifficulty,
      targetMode: BlindPointMode,
      targetSeed?: string
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

      // Increment gameSessionId to guarantee that BlindPointMap unmounts and remounts clean
      setGameSessionId((prev) => prev + 1);

      try {
        let url = `/api/games/blindpoint/session?pack=${targetPack}&difficulty=${targetDiff}&mode=${targetMode}`;
        if (targetSeed) {
          url += `&seed=${targetSeed}`;
        }

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
    },
    [settings.timerDurationSeconds]
  );

  // Load game session whenever in active play mode (play=1) and parameters are defined
  useEffect(() => {
    if (isPlaying) {
      loadGameSession(pack, difficulty, mode, userSeed || undefined);
    }
  }, [isPlaying, pack, difficulty, mode, userSeed, loadGameSession]);

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

  const activePack = isPlaying
    ? (session?.pack || currentTarget?.pack || pack)
    : selectedPack;

  const scale =
    activePack === "lieux_paris"
      ? "paris"
      : activePack === "villes_monde" || activePack === "lieux_monde" || activePack === "monuments_monde"
      ? "world"
      : "fr";

  const handleStartGame = (p: BlindPointPack, d: BlindPointDifficulty, m: BlindPointMode) => {
    const freeSeed = m === "free" ? `&seed=${Date.now()}` : "";
    router.push(`/play/blindpoint?pack=${p}&difficulty=${d}&mode=${m}${freeSeed}&play=1`);
  };

  const handleChangeGameConfig = (
    p: BlindPointPack,
    d: BlindPointDifficulty,
    m: BlindPointMode
  ) => {
    if (m === mode && p === pack && d === difficulty) {
      if (m === "free") {
        router.push(`/play/blindpoint?pack=${p}&difficulty=${d}&mode=free&seed=${Date.now()}&play=1`);
      } else {
        loadGameSession(p, d, m, undefined);
      }
      return;
    }

    const freeSeed = m === "free" ? `&seed=${Date.now()}` : "";
    router.push(`/play/blindpoint?pack=${p}&difficulty=${d}&mode=${m}${freeSeed}&play=1`);
  };

  const handleRestartCurrentGame = () => {
    const p = session?.pack || pack;
    const d = session?.difficulty || difficulty;
    const m = session?.mode || mode;

    if (m === "free") {
      router.push(`/play/blindpoint?pack=${p}&difficulty=${d}&mode=free&seed=${Date.now()}&play=1`);
    } else {
      loadGameSession(p, d, m, undefined);
    }
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

            <div className="flex items-center gap-3">
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

        {/* Main Lobby Form */}
        <main className="max-w-4xl mx-auto px-6 py-10 flex-1 flex flex-col justify-center w-full">
          {/* Header Brief */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Précision Aveugle • 5 Manches</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
              Configurez votre Défi
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Choisissez votre type de cible, le territoire et votre mode de jeu pour tenter de décrocher le score parfait de 25 000 points.
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1: Category / Criteria Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Critère de recherche
                </span>
                <span className="text-xs text-slate-500">
                  Thématique des cibles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Villes & Agglomérations */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory("villes")}
                  className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                    selectedCategory === "villes"
                      ? "bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-lg">
                        🏙️
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Villes & Agglomérations</h3>
                        <p className="text-[11px] text-blue-400 font-semibold">Métropoles, préfectures & capitales</p>
                      </div>
                    </div>
                    {selectedCategory === "villes" && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Localisez les centres urbains majeurs et secondaires avec 3 paliers de difficulté réglables.
                  </p>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] font-semibold text-blue-300 border border-slate-700/80 w-fit">
                    139 villes FR • 167 villes Monde
                  </span>
                </button>

                {/* Lieux emblématiques (Châteaux & Monuments) */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory("lieux_emblematiques")}
                  className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                    selectedCategory === "lieux_emblematiques"
                      ? "bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-500/10"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-lg">
                        🏛️
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Lieux emblématiques</h3>
                        <p className="text-[11px] text-purple-400 font-semibold">Châteaux, monuments & merveilles</p>
                      </div>
                    </div>
                    {selectedCategory === "lieux_emblematiques" && (
                      <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Châteaux de la Loire, citadelles Vauban, arènes gallo-romaines et chefs-d'œuvre mondiaux de l'UNESCO.
                  </p>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] font-semibold text-purple-300 border border-slate-700/80 w-fit">
                    58 trésors FR • 50 merveilles Monde
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Territory Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Territoire à cibler
                </span>
                <span className="text-xs text-slate-500">
                  Échelle de la carte
                </span>
              </div>

              {selectedCategory === "villes" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* France Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTerritory("france")}
                    className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedTerritory === "france"
                        ? "bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">🇫🇷</div>
                      {selectedTerritory === "france" && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">France métropolitaine</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        Métropoles, préfectures et villes régionales du territoire métropolitain.
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] font-semibold text-blue-300 border border-slate-700/80">
                        Tolérance : 170 km (France)
                      </span>
                    </div>
                  </button>

                  {/* World Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTerritory("monde")}
                    className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedTerritory === "monde"
                        ? "bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/10"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">🌍</div>
                      {selectedTerritory === "monde" && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Monde entier</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        Mégapoles et capitales internationales avec équilibrage garanti sur les 6 continents.
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] font-semibold text-emerald-300 border border-slate-700/80">
                        Tolérance : 2 200 km (Monde)
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* France Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTerritory("france")}
                    className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedTerritory === "france"
                        ? "bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">🏰</div>
                      {selectedTerritory === "france" && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">France Métropole</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        58 châteaux de la Loire, citadelles Vauban & patrimoine national.
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[10px] font-semibold text-blue-300 border border-slate-700/80">
                        Tolérance : 170 km
                      </span>
                    </div>
                  </button>

                  {/* Paris Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTerritory("paris")}
                    className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedTerritory === "paris"
                        ? "bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-500/10"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">🗼</div>
                      {selectedTerritory === "paris" && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">Paris Intra-muros</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        60 édifices phares de la capitale (Tour Eiffel, Panthéon, Notre-Dame...).
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[10px] font-semibold text-purple-300 border border-slate-700/80">
                        Tolérance métrique : 1,5 km
                      </span>
                    </div>
                  </button>

                  {/* World Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTerritory("monde")}
                    className={`relative p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedTerritory === "monde"
                        ? "bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/10"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">🌍</div>
                      {selectedTerritory === "monde" && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">Monde Entier</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        50 merveilles de l'humanité & trésors UNESCO (Taj Mahal, Pétra...).
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[10px] font-semibold text-emerald-300 border border-slate-700/80">
                        Tolérance : 2 200 km
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Difficulty Selection (for Villes) OR Curated heritage banner (for Lieux) */}
            {selectedCategory === "villes" ? (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  3. Niveau de Difficulté
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Facile */}
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulty("facile")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedDifficulty === "facile"
                        ? "bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Facile
                      </span>
                      {selectedDifficulty === "facile" && (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedTerritory === "france"
                        ? "Grandes métropoles (Paris, Marseille, Lyon, Toulouse, Nantes, Lille...)"
                        : "Capitales et mégapoles iconiques (Tokyo, Londres, New York, Le Caire...)"}
                    </p>
                  </button>

                  {/* Moyen */}
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulty("moyen")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedDifficulty === "moyen"
                        ? "bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Moyen
                      </span>
                      {selectedDifficulty === "moyen" && (
                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedTerritory === "france"
                        ? "Villes moyennes & sous-préfectures (Calais, Albi, Pau, Quimper, Bayonne...)"
                        : "Capitales d'État & métropoles continentales (Varsovie, Bogota, Ottawa, Nairobi...)"}
                    </p>
                  </button>

                  {/* Difficile */}
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulty("difficile")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedDifficulty === "difficile"
                        ? "bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Difficile
                      </span>
                      {selectedDifficulty === "difficile" && (
                        <Check className="w-4 h-4 text-rose-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedTerritory === "france"
                        ? "Préfectures discrètes & terroirs (Aurillac, Mende, Foix, Privas, Guéret, Digne...)"
                        : "Capitales confidentielles & métropoles lointaines (Oulan-Bator, Windhoek, Suva...)"}
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  3. Niveau de Difficulté
                </span>
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-200">Sélection Patrimoniale Curatée</h4>
                    <p className="text-[11px] text-slate-400">
                      Châteaux, citadelles Vauban et merveilles de l'humanité sont calibrés pour offrir une expérience équilibrée sans sélection de difficulté requise.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Game Mode */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                4. Mode de Jeu
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Défi du Jour */}
                <button
                  type="button"
                  onClick={() => setSelectedMode("daily")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    selectedMode === "daily"
                      ? "bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Défi du Jour</h4>
                      <p className="text-xs text-slate-400">Tirage identique pour comparer vos scores</p>
                    </div>
                  </div>
                  {selectedMode === "daily" && <Check className="w-5 h-5 text-blue-400 stroke-[3]" />}
                </button>

                {/* Partie Libre */}
                <button
                  type="button"
                  onClick={() => setSelectedMode("free")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    selectedMode === "free"
                      ? "bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Entraînement Libre</h4>
                      <p className="text-xs text-slate-400">Sessions illimitées tirées aléatoirement</p>
                    </div>
                  </div>
                  {selectedMode === "free" && <Check className="w-5 h-5 text-amber-400 stroke-[3]" />}
                </button>
              </div>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => handleStartGame(selectedPack, selectedDifficulty, selectedMode)}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white font-extrabold text-base shadow-2xl shadow-emerald-600/25 border border-emerald-400/40 transition-all active:scale-[0.99] hover:shadow-emerald-600/40"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Lancer la Partie (5 Manches)</span>
              </button>
            </div>
          </div>
        </main>

        {/* Settings Modal (available even in lobby) */}
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
        currentTargetName={currentTarget?.name}
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
          totalRounds={5}
          currentTotalScore={currentTotalScore}
          hasPlacedGuess={currentGuess !== null}
          isSubmitting={isSubmitting}
          isRevealing={isRevealing}
          isGameOver={isGameOver}
          timerSecondsLeft={timerSecondsLeft}
          pack={activePack}
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
          onChangeMode={handleChangeGameConfig}
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
        pack={session?.pack || pack}
        difficulty={session?.difficulty || difficulty}
        mode={session?.mode || mode}
        seed={session?.seed || userSeed}
        rounds={roundsHistory}
        onRestartGame={handleRestartCurrentGame}
        onCloseToMap={() => setShowSummaryModal(false)}
        onBackToLobby={handleBackToLobby}
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
