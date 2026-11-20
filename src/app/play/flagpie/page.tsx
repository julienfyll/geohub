"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  PieChart as PieIcon,
  Sparkles,
  HelpCircle,
  Settings,
  Zap,
  Play,
  RotateCcw,
  Trophy,
  Globe2,
} from "lucide-react";
import {
  FlagPiePack,
  FlagPieMode,
  FlagPieClientRoundInit,
  FlagPieSessionInit,
  FlagColorSlice,
} from "@/lib/games/flagpie/types";
import {
  getPackCountries,
  generateChallenge,
  calculateRoundScore,
  ALL_FLAGS,
} from "@/lib/games/flagpie/engine";
import { FlagPieHUD } from "@/components/game/flagpie/FlagPieHUD";
import { FlagPieChart } from "@/components/game/flagpie/FlagPieChart";
import { FlagPieHintsCard } from "@/components/game/flagpie/FlagPieHintsCard";
import { FlagPieInput } from "@/components/game/flagpie/FlagPieInput";
import { FlagPieRevealModal } from "@/components/game/flagpie/FlagPieRevealModal";
import {
  FlagPieSummaryModal,
  FlagPieRoundSummary,
} from "@/components/game/flagpie/FlagPieSummaryModal";
import { FlagPieRulesModal } from "@/components/game/flagpie/FlagPieRulesModal";
import { FlagPieSettingsModal } from "@/components/game/flagpie/FlagPieSettingsModal";
import { RestartConfirmModal } from "@/components/game/RestartConfirmModal";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";

const FLAGPIE_PACKS: {
  id: FlagPiePack;
  name: string;
  badge: string;
  icon: string;
  countLabel: string;
  description: string;
}[] = [
  {
    id: "monde",
    name: "Monde Entier",
    badge: "108 pays",
    icon: "🌍",
    countLabel: "108 nations mondiales",
    description: "Le tour du monde complet de tous les drapeaux nationaux souverains.",
  },
  {
    id: "europe",
    name: "Europe",
    badge: "37 pays",
    icon: "🇪🇺",
    countLabel: "37 nations européennes",
    description: "Des tricolores emblématiques aux croix scandinaves nordiques.",
  },
  {
    id: "afrique",
    name: "Afrique",
    badge: "25 pays",
    icon: "🌍",
    countLabel: "25 nations africaines",
    description: "La splendeur des couleurs panafricaines et des symboles de liberté.",
  },
  {
    id: "ameriques",
    name: "Amériques",
    badge: "20 pays",
    icon: "🌎",
    countLabel: "20 nations américaines",
    description: "Du Grand Nord canadien à la Terre de Feu et aux Caraïbes.",
  },
  {
    id: "asie",
    name: "Asie & Océanie",
    badge: "26 pays",
    icon: "🌏",
    countLabel: "26 nations d'Orient & Pacifique",
    description: "Des soleils d'Orient aux constellations astrales du Pacifique.",
  },
];

// =========================================================================
// 1. LOBBY FLAGPIE
// =========================================================================
interface FlagPieLobbyProps {
  initialPack: FlagPiePack;
  onStartGame: (pack: FlagPiePack, mode: FlagPieMode) => void;
  onOpenRules: () => void;
}

function FlagPieLobby({ initialPack, onStartGame, onOpenRules }: FlagPieLobbyProps) {
  const [selectedPack, setSelectedPack] = useState<FlagPiePack>(initialPack);

  const selectedPackMeta = useMemo(() => {
    return FLAGPIE_PACKS.find((p) => p.id === selectedPack) || FLAGPIE_PACKS[0];
  }, [selectedPack]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Navigation bar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              FlagPie
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LeaderboardTriggerButton
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
              label="Classement"
              initialGame="flagpie"
            />
            <button
              type="button"
              onClick={onOpenRules}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Règles du jeu"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <UserNav />
          </div>
        </div>
      </nav>

      {/* Main Cockpit */}
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Daily Banner */}
        <section className="p-6 rounded-3xl bg-slate-900/90 border-2 border-violet-500/40 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-violet-500/15 blur-3xl pointer-events-none rounded-full" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Défi du Jour Officiel (FlagPie)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">5 manches • Tirage unique</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Le Grand Quiz Chromatique du Jour
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Reconnaissez les 5 drapeaux mystères du jour à partir de leurs proportions de couleurs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onStartGame("monde", "daily")}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>Lancer le Défi Quotidien</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Free Practice Cockpit */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400" />
                <span>Entraînement Libre & Packs Régionaux</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Parties illimitées de 5 manches. Choisissez votre pack géographique pour jouer.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">25 000 pts max</span>
          </div>

          {/* Pack Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Pack Géographique
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {FLAGPIE_PACKS.map((p) => {
                const isSelected = selectedPack === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPack(p.id)}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-violet-500 bg-violet-950/30 text-white font-bold shadow-md shadow-violet-500/20"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{p.icon}</span>
                    <span className="text-xs block font-bold">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTA */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => onStartGame(selectedPack, "free")}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all flex items-center justify-between cursor-pointer hover:scale-[1.01]"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-5 h-5 fill-white" />
                <span>Lancer la Partie Libre ({selectedPackMeta.name})</span>
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onOpenRules}
                className="py-2 px-4 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                <span>Consulter les Règles de FlagPie</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GeoHub — FlagPie.</p>
          <Link href="/" className="text-slate-400 hover:text-white underline">
            Retourner au hub principal
          </Link>
        </div>
      </footer>
    </div>
  );
}

// =========================================================================
// 2. JEU ACTIF FLAGPIE
// =========================================================================
interface FlagPieActiveGameProps {
  pack: FlagPiePack;
  mode: FlagPieMode;
  seed?: string;
  onExitGame: () => void;
}

function FlagPieActiveGame({ pack, mode, seed, onExitGame }: FlagPieActiveGameProps) {
  const router = useRouter();

  // Modals state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);

  // Settings
  const [hidePercentages, setHidePercentages] = useState(false);

  // Session State (Generated locally / securely synchronized)
  const [session, setSession] = useState(() =>
    generateChallenge({ pack, mode, seed })
  );

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "error" | "success" | "info";
  } | null>(null);

  // Hints progressive state
  const [revealedContinent, setRevealedContinent] = useState<string | undefined>(undefined);
  const [revealedFirstLetter, setRevealedFirstLetter] = useState<string | undefined>(undefined);

  // Reveal Modal country info
  const [revealedCountry, setRevealedCountry] = useState<{
    id: string;
    name: string;
    flag: string;
    capital: string;
    continent: string;
    trivia?: string;
  }>({
    id: "",
    name: "",
    flag: "🏁",
    capital: "",
    continent: "",
  });
  const [lastRoundScore, setLastRoundScore] = useState(0);
  const [lastRoundCorrect, setLastRoundCorrect] = useState(false);

  // Rounds history summary for end of game
  const [roundsSummary, setRoundsSummary] = useState<FlagPieRoundSummary[]>([]);

  const currentCountry = session.countries[currentRoundIndex];
  const currentSlices = currentCountry?.slices || [];

  // Potential score for next correct guess
  const currentPotentialScore = useMemo(() => {
    return calculateRoundScore(attemptNumber, true);
  }, [attemptNumber]);

  // Handle Player Guess
  const handleGuess = useCallback(
    async (guessText: string) => {
      if (!currentCountry) return;

      try {
        const res = await fetch("/api/games/flagpie/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.sessionId,
            roundIndex: currentRoundIndex,
            guess: guessText,
            attemptNumber,
            pack,
            mode,
            isSkip: false,
          }),
        });

        const data = await res.json();
        if (!data.success) return;

        if (data.isCorrect) {
          // Success!
          const earned = data.scoreEarned;
          setTotalScore((prev) => prev + earned);
          setLastRoundScore(earned);
          setLastRoundCorrect(true);
          setRevealedCountry(data.revealedCountry);

          // Add to summary
          setRoundsSummary((prev) => [
            ...prev,
            {
              roundNumber: currentRoundIndex + 1,
              countryName: data.revealedCountry.name,
              flag: data.revealedCountry.flag,
              score: earned,
              attemptsUsed: attemptNumber,
              isCorrect: true,
            },
          ]);

          setShowRevealModal(true);
        } else {
          // Incorrect guess
          if (data.roundComplete) {
            // Round over after 3 attempts
            setLastRoundScore(0);
            setLastRoundCorrect(false);
            setRevealedCountry(data.revealedCountry);

            setRoundsSummary((prev) => [
              ...prev,
              {
                roundNumber: currentRoundIndex + 1,
                countryName: data.revealedCountry.name,
                flag: data.revealedCountry.flag,
                score: 0,
                attemptsUsed: attemptNumber,
                isCorrect: false,
              },
            ]);

            setShowRevealModal(true);
          } else {
            // Continue to next attempt
            setAttemptNumber(data.attemptNumber);
            if (data.revealedContinent) setRevealedContinent(data.revealedContinent);
            if (data.revealedFirstLetter) setRevealedFirstLetter(data.revealedFirstLetter);

            setFeedbackMessage({
              text: data.message,
              type: "error",
            });
            setTimeout(() => setFeedbackMessage(null), 3000);
          }
        }
      } catch (err) {
        console.error("Guess error:", err);
      }
    },
    [currentCountry, session.sessionId, currentRoundIndex, attemptNumber, pack, mode]
  );

  // Handle Skip
  const handleSkip = useCallback(async () => {
    if (!currentCountry) return;

    try {
      const res = await fetch("/api/games/flagpie/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          roundIndex: currentRoundIndex,
          attemptNumber,
          pack,
          mode,
          isSkip: true,
        }),
      });

      const data = await res.json();
      if (!data.success) return;

      setLastRoundScore(0);
      setLastRoundCorrect(false);
      setRevealedCountry(data.revealedCountry);

      setRoundsSummary((prev) => [
        ...prev,
        {
          roundNumber: currentRoundIndex + 1,
          countryName: data.revealedCountry.name,
          flag: data.revealedCountry.flag,
          score: 0,
          attemptsUsed: attemptNumber,
          isCorrect: false,
        },
      ]);

      setShowRevealModal(true);
    } catch (err) {
      console.error("Skip error:", err);
    }
  }, [currentCountry, session.sessionId, currentRoundIndex, attemptNumber, pack, mode]);

  // Advance to next round
  const handleNextRound = () => {
    setShowRevealModal(false);

    if (currentRoundIndex >= session.countries.length - 1) {
      // Game over!
      setTimeout(() => setShowSummaryModal(true), 300);
    } else {
      setCurrentRoundIndex((prev) => prev + 1);
      setAttemptNumber(1);
      setRevealedContinent(undefined);
      setRevealedFirstLetter(undefined);
      setFeedbackMessage(null);
    }
  };

  // Replay exactly same challenge
  const handleReplaySame = () => {
    setCurrentRoundIndex(0);
    setAttemptNumber(1);
    setTotalScore(0);
    setRevealedContinent(undefined);
    setRevealedFirstLetter(undefined);
    setRoundsSummary([]);
    setShowSummaryModal(false);
    setShowRestartModal(false);
  };

  // Start new random challenge
  const handleNewChallenge = () => {
    setShowSummaryModal(false);
    setShowRestartModal(false);
    const newSeed = Math.random().toString(36).substring(2, 9);
    router.push(`/play/flagpie?pack=${pack}&mode=free&seed=${newSeed}&play=1`);
    const newSession = generateChallenge({ pack, mode: "free", seed: newSeed });
    setSession(newSession);
    setCurrentRoundIndex(0);
    setAttemptNumber(1);
    setTotalScore(0);
    setRevealedContinent(undefined);
    setRevealedFirstLetter(undefined);
    setRoundsSummary([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top HUD */}
      <FlagPieHUD
        pack={pack}
        mode={mode}
        currentRound={currentRoundIndex + 1}
        totalRounds={session.countries.length}
        totalScore={totalScore}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onRestart={() => setShowRestartModal(true)}
      />

      {/* Main Game Stage */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full flex flex-col items-center justify-between space-y-6">
        {/* 1. Pie Chart Display */}
        <section className="w-full flex flex-col items-center justify-center pt-2">
          <FlagPieChart
            slices={currentSlices}
            hidePercentages={hidePercentages}
          />
        </section>

        {/* 2. Progressive Hints Card */}
        <section className="w-full">
          <FlagPieHintsCard
            attemptNumber={attemptNumber}
            revealedContinent={revealedContinent}
            revealedFirstLetter={revealedFirstLetter}
            currentScoreValue={currentPotentialScore}
          />
        </section>

        {/* 3. Input & Autocomplete */}
        <section className="w-full pb-4">
          <FlagPieInput
            onGuess={handleGuess}
            onSkip={handleSkip}
            feedbackMessage={feedbackMessage}
          />
        </section>
      </main>

      {/* Reveal Modal (between rounds) */}
      <FlagPieRevealModal
        isOpen={showRevealModal}
        isCorrect={lastRoundCorrect}
        scoreEarned={lastRoundScore}
        country={revealedCountry}
        currentRound={currentRoundIndex + 1}
        totalRounds={session.countries.length}
        onNextRound={handleNextRound}
      />

      {/* Summary Modal (end of game) */}
      <FlagPieSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        pack={pack}
        mode={mode}
        totalScore={totalScore}
        roundsSummary={roundsSummary}
        onReplaySame={handleReplaySame}
        onNewChallenge={handleNewChallenge}
      />

      {/* Rules Modal */}
      <FlagPieRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Settings Modal */}
      <FlagPieSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        hidePercentages={hidePercentages}
        onToggleHidePercentages={() => setHidePercentages((prev) => !prev)}
      />

      {/* Restart Confirm Modal */}
      <RestartConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={handleReplaySame}
      />
    </div>
  );
}

// =========================================================================
// 3. PAGE PRINCIPALE (ROUTAGE LOBBY VS JEU ACTIF)
// =========================================================================
function FlagPieContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showRulesModal, setShowRulesModal] = useState(false);

  const pack = (searchParams.get("pack") || "monde") as FlagPiePack;
  const mode = (searchParams.get("mode") || "free") as FlagPieMode;
  const seed = searchParams.get("seed") || undefined;
  const isPlaying = searchParams.get("play") === "1";

  const handleStartGame = (targetPack: FlagPiePack, targetMode: FlagPieMode) => {
    const params = new URLSearchParams();
    params.set("pack", targetPack);
    params.set("mode", targetMode);
    params.set("play", "1");
    if (targetMode === "free") {
      params.set("seed", Math.random().toString(36).substring(2, 9));
    }
    router.push(`/play/flagpie?${params.toString()}`);
  };

  const handleExitGame = () => {
    router.push("/play/flagpie");
  };

  if (isPlaying) {
    return (
      <FlagPieActiveGame
        pack={pack}
        mode={mode}
        seed={seed}
        onExitGame={handleExitGame}
      />
    );
  }

  return (
    <>
      <FlagPieLobby
        initialPack={pack}
        onStartGame={handleStartGame}
        onOpenRules={() => setShowRulesModal(true)}
      />
      <FlagPieRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </>
  );
}

export default function FlagPiePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-400">Chargement de FlagPie...</span>
          </div>
        </div>
      }
    >
      <FlagPieContent />
    </Suspense>
  );
}
