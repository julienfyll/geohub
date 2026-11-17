"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Check,
  FastForward,
  Flame,
  Globe,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  CapitalItem,
  CapitalBlitzMode,
  CapitalBlitzResult,
  QuestionAttempt,
  CapitalBlitzSettings,
  DEFAULT_CAPITAL_BLITZ_SETTINGS,
} from "@/lib/games/capitalblitz/types";
import {
  getShuffledQuestions,
  checkCapital,
  searchCapitals,
  getComboMultiplier,
  generateShareText,
} from "@/lib/games/capitalblitz/engine";
import { CapitalBlitzMap } from "./CapitalBlitzMap";
import { CapitalBlitzHUD } from "./CapitalBlitzHUD";
import { CapitalBlitzSummaryModal } from "./CapitalBlitzSummaryModal";
import { CapitalBlitzSettingsModal } from "./CapitalBlitzSettingsModal";
import { CapitalBlitzRulesModal } from "./CapitalBlitzRulesModal";
import { RestartConfirmModal } from "../RestartConfirmModal";
import { recordGameSession } from "@/lib/stats/statsService";
import { useAuth } from "@/lib/auth/AuthContext";

export interface CapitalBlitzActiveGameProps {
  mode?: CapitalBlitzMode;
  seed?: string;
  onBackToLobby: () => void;
}

export const CapitalBlitzActiveGame: React.FC<CapitalBlitzActiveGameProps> = ({
  mode = "sprint60",
  seed: initialSeed,
  onBackToLobby,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  // Settings
  const [settings, setSettings] = useState<CapitalBlitzSettings>(
    DEFAULT_CAPITAL_BLITZ_SETTINGS
  );

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Game seed
  const sessionSeed = useMemo(() => {
    if (initialSeed) return initialSeed;
    if (mode === "daily") {
      const today = new Date().toISOString().split("T")[0];
      return `daily-blitz-${today}`;
    }
    return `blitz-${Date.now().toString(36)}`;
  }, [initialSeed, mode]);

  // Questions queue
  const questions = useMemo(() => {
    return getShuffledQuestions(sessionSeed, settings.continent);
  }, [sessionSeed, settings.continent]);

  // Gameplay state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1.0);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  // Input & Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "skip";
    message: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(settings.durationSeconds);
  const isRunning = !isGameOver && timeLeft > 0;

  // Current Target Country
  const currentQuestion: CapitalItem | null =
    questions[currentIndex % questions.length] || null;

  // Current combo multiplier
  const currentMultiplier = getComboMultiplier(streak);

  // Track max combo
  useEffect(() => {
    if (currentMultiplier > maxCombo) {
      setMaxCombo(currentMultiplier);
    }
  }, [currentMultiplier, maxCombo]);

  // Timer countdown interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Autocomplete suggestions update
  useEffect(() => {
    if (!inputText.trim()) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const results = searchCapitals(inputText, 4);
    setSuggestions(results);
    setHighlightedIndex(-1);
  }, [inputText]);

  // Handle game over when timer expires
  const handleTimeExpired = useCallback(() => {
    setIsGameOver(true);

    // Trigger celebration confettis
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  }, []);

  // Save session to database / localStorage when game over
  useEffect(() => {
    if (!isGameOver) return;

    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const accuracy =
      attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;

    recordGameSession(
      {
        game_mode: "capitalblitz",
        variant: settings.continent,
        difficulty: `${settings.durationSeconds}s`,
        score,
        accuracy_percent: accuracy,
        time_spent_seconds: settings.durationSeconds - timeLeft,
        summary_data: {
          mode,
          seed: sessionSeed,
          accuracy,
          maxCombo,
          correctCount,
          attemptsCount: attempts.length,
          skippedCount: attempts.filter((a) => !a.isCorrect).length,
        },
      },
      user?.id
    );
  }, [isGameOver]);

  // Proceed to the next question
  const nextQuestion = () => {
    setInputText("");
    setSuggestions([]);
    setHighlightedIndex(-1);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Validate a submitted guess
  const handleSubmitGuess = (submittedCapital?: string) => {
    if (!currentQuestion || !isRunning) return;

    const guess = (submittedCapital || inputText).trim();
    if (!guess) return;

    const isCorrect = checkCapital(guess, currentQuestion);

    if (isCorrect) {
      const earned = Math.round(100 * currentMultiplier);
      setScore((prev) => prev + earned);
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      setSuccessIds((prev) => new Set(prev).add(currentQuestion.id));

      const attempt: QuestionAttempt = {
        countryId: currentQuestion.id,
        countryName: currentQuestion.name,
        capital: currentQuestion.capital,
        userGuess: guess,
        isCorrect: true,
        isSkipped: false,
        points: earned,
        comboMultiplier: currentMultiplier,
        flag: currentQuestion.flag,
      };
      setAttempts((prev) => [...prev, attempt]);

      setFeedback({
        type: "success",
        message: `+${earned} pts • ${currentQuestion.capital} !`,
      });

      setTimeout(() => {
        setFeedback(null);
        nextQuestion();
      }, 350);
    } else {
      // Wrong guess: combo reset, feedback shake
      setStreak(0);
      setFeedback({
        type: "error",
        message: `Incorrect. Essayez encore ou passez !`,
      });

      setTimeout(() => {
        setFeedback(null);
      }, 700);
    }
  };

  // Skip the current question
  const handleSkipQuestion = () => {
    if (!currentQuestion || !isRunning) return;

    // Skipped country marked in red/slate on the map
    setSkippedIds((prev) => new Set(prev).add(currentQuestion.id));
    setStreak(0);

    const attempt: QuestionAttempt = {
      countryId: currentQuestion.id,
      countryName: currentQuestion.name,
      capital: currentQuestion.capital,
      userGuess: "Passé",
      isCorrect: false,
      isSkipped: true,
      points: 0,
      comboMultiplier: 1.0,
      flag: currentQuestion.flag,
    };
    setAttempts((prev) => [...prev, attempt]);

    setFeedback({
      type: "skip",
      message: `Passé • C'était ${currentQuestion.capital}`,
    });

    setTimeout(() => {
      setFeedback(null);
      nextQuestion();
    }, 450);
  };

  // Global Keyboard Navigation (Enter, Escape, Space to skip, Arrows for suggestions)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSubmitGuess(suggestions[highlightedIndex]);
      } else {
        handleSubmitGuess();
      }
    }
  };

  // Window spacebar listener for skipping when input is empty
  useEffect(() => {
    const onWindowKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && inputText.trim() === "") {
        e.preventDefault();
        handleSkipQuestion();
      }
    };
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [inputText, currentQuestion, isRunning]);

  // Restart game cleanly
  const handleRestart = () => {
    setTimeLeft(settings.durationSeconds);
    setCurrentIndex(0);
    setInputText("");
    setScore(0);
    setStreak(0);
    setMaxCombo(1.0);
    setAttempts([]);
    setSuccessIds(new Set());
    setSkippedIds(new Set());
    setFeedback(null);
    setIsGameOver(false);
    setShowRestartModal(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Build summary result object
  const result: CapitalBlitzResult = useMemo(() => {
    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const accuracyPercent =
      attempts.length > 0
        ? Math.round((correctCount / attempts.length) * 100)
        : 0;

    return {
      score,
      correctCount,
      totalAttempts: attempts.length,
      accuracyPercent,
      maxCombo,
      durationSeconds: settings.durationSeconds,
      attempts,
      seed: sessionSeed,
    };
  }, [score, attempts, maxCombo, settings.durationSeconds, sessionSeed]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 1. Vector MapLibre in the background with interactive country states */}
      <CapitalBlitzMap
        activeCountry={currentQuestion}
        successCountryIds={successIds}
        skippedCountryIds={skippedIds}
        className="absolute inset-0 w-full h-full"
      />

      {/* 2. Top Standardized HUD Bar */}
      <CapitalBlitzHUD
        timeLeftSeconds={timeLeft}
        totalDurationSeconds={settings.durationSeconds}
        score={score}
        comboMultiplier={currentMultiplier}
        correctCount={attempts.filter((a) => a.isCorrect).length}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenRules={() => setShowRulesModal(true)}
        onRestart={() => setShowRestartModal(true)}
        onBackToLobby={onBackToLobby}
      />

      {/* 3. Floating Target Country & Input Card (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-none">
        {currentQuestion && !isGameOver && (
          <div className="pointer-events-auto bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Country Header Info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl sm:text-4xl shrink-0 select-none drop-shadow">
                  {currentQuestion.flag}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {currentQuestion.continent}
                    </span>
                    {streak >= 2 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full animate-pulse">
                        <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                        Combo x{currentMultiplier.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {currentQuestion.name}
                  </h2>
                </div>
              </div>

              {/* Skip button (Espace) */}
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                title="Passer ce pays (Touche Espace)"
              >
                <span>Passer</span>
                <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[9px] text-slate-400">
                  Espace
                </kbd>
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input & Autocomplete Field */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tapez la capitale..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border-2 border-slate-700/80 focus:border-amber-500 focus:outline-none text-white text-base font-bold placeholder:text-slate-500 shadow-inner transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmitGuess()}
                  disabled={!inputText.trim()}
                  className={`py-3 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                    inputText.trim()
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/25 active:scale-95 cursor-pointer"
                      : "bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">Valider</span>
                </button>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1 z-50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">
                    Suggestions (Flèches ↑↓ + Entrée)
                  </span>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSubmitGuess(suggestion)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        idx === highlightedIndex
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "text-slate-200 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span>{suggestion}</span>
                      <span className="text-[10px] text-slate-500">Choisir ↵</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Feedback Notification */}
            {feedback && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold animate-in fade-in duration-150 ${
                  feedback.type === "success"
                    ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-300"
                    : feedback.type === "skip"
                    ? "bg-slate-800/80 border border-slate-700 text-slate-300"
                    : "bg-rose-950/70 border border-rose-500/50 text-rose-300 animate-shake"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modals */}
      <CapitalBlitzSummaryModal
        isOpen={isGameOver}
        result={result}
        onRestart={handleRestart}
        onBackToLobby={onBackToLobby}
      />

      <CapitalBlitzSettingsModal
        isOpen={showSettingsModal}
        settings={settings}
        onClose={() => setShowSettingsModal(false)}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
      />

      <CapitalBlitzRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      <RestartConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={handleRestart}
        title="Recommencer le sprint ?"
        message="Êtes-vous sûr de vouloir réinitialiser la partie ? Votre score et vos séries en cours seront réinitialisés."
        confirmLabel="Recommencer"
        cancelLabel="Annuler"
      />
    </div>
  );
};
