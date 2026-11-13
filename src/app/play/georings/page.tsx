"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
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
  Plane,
  Users,
  Play,
  ArrowRight,
  Layers,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useDailyChallenges } from "@/lib/stats/useDailyChallenges";
import { GeoMap, MapMarker } from "@/components/map/GeoMap";
import { SearchBar, SearchCityItem } from "@/components/ui/SearchBar";
import { RingProgressHUD, RingStatus } from "@/components/game/RingProgressHUD";
import { RingReviewActionBar } from "@/components/game/RingReviewActionBar";
import { RingReviewCard, GuessRecord } from "@/components/game/RingReviewCard";
import { GameOverModal } from "@/components/game/GameOverModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { CustomGameModal } from "@/components/game/CustomGameModal";
import { UserNav } from "@/components/navigation/UserNav";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";
import { useSettings } from "@/lib/settings/useSettings";
import { CityGuessResult, GameMetric, GameScale, GeoRingsInitResponse, TopCityItem } from "@/lib/games/types";

// =========================================================================
// 1. LOBBY GEORINGS (Presented when no metric is selected)
// =========================================================================
function GeoRingsLobby() {
  const router = useRouter();
  const { statusMap } = useDailyChallenges();
  const [selectedMetric, setSelectedMetric] = useState<GameMetric>("population");
  const [selectedScale, setSelectedScale] = useState<GameScale>("fr");
  const [showCustomModal, setShowCustomModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Lobby Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
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
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">GeoRings</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LeaderboardTriggerButton
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all shadow-sm cursor-pointer"
              label="Classement"
              initialGame="georings"
            />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Cockpit / Selection Screen */}
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full space-y-10">

        {/* 1. RAPPEL DES DÉFIS DU JOUR GEORINGS (FLASHY) */}
        <section className="p-6 rounded-3xl bg-slate-900/90 border-2 border-blue-500/40 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-44 h-44 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rendez-vous Officiels du Jour (GeoRings)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Centres uniques du jour</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {/* France Pop */}
            <button
              type="button"
              onClick={() => router.push("/play/georings?metric=population&scale=fr&mode=daily")}
              className={"p-3 rounded-2xl bg-slate-950/80 border-2 text-left transition-all group flex flex-col justify-between " + (
                statusMap["georings_population_fr"]?.completed
                  ? "border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-blue-500/50 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              )}
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-blue-300">👥 France</span>
                <span className="text-[10px] text-slate-400 font-medium">Population</span>
              </div>
              {statusMap["georings_population_fr"]?.completed ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Fait</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 font-mono">
                    {statusMap["georings_population_fr"].ringsCompleted}/{statusMap["georings_population_fr"].totalRings} 🎯
                  </span>
                </div>
              ) : (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              )}
            </button>

            {/* Europe Pop */}
            <button
              type="button"
              onClick={() => router.push("/play/georings?metric=population&scale=eu&mode=daily")}
              className={"p-3 rounded-2xl bg-slate-950/80 border text-left transition-all group flex flex-col justify-between " + (
                statusMap["georings_population_eu"]?.completed
                  ? "border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-slate-800 hover:border-blue-500/60"
              )}
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-blue-300">🇪🇺 Europe</span>
                <span className="text-[10px] text-slate-400 font-medium">Population</span>
              </div>
              {statusMap["georings_population_eu"]?.completed ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Fait</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 font-mono">
                    {statusMap["georings_population_eu"].ringsCompleted}/{statusMap["georings_population_eu"].totalRings} 🎯
                  </span>
                </div>
              ) : (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              )}
            </button>

            {/* Monde Pop */}
            <button
              type="button"
              onClick={() => router.push("/play/georings?metric=population&scale=world&mode=daily")}
              className={"p-3 rounded-2xl bg-slate-950/80 border text-left transition-all group flex flex-col justify-between " + (
                statusMap["georings_population_world"]?.completed
                  ? "border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-slate-800 hover:border-blue-500/60"
              )}
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-blue-300">🌍 Monde</span>
                <span className="text-[10px] text-slate-400 font-medium">Population</span>
              </div>
              {statusMap["georings_population_world"]?.completed ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Fait</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 font-mono">
                    {statusMap["georings_population_world"].ringsCompleted}/{statusMap["georings_population_world"].totalRings} 🎯
                  </span>
                </div>
              ) : (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              )}
            </button>

            {/* France Aéroports */}
            <button
              type="button"
              onClick={() => router.push("/play/georings?metric=airports&scale=fr&mode=daily")}
              className={"p-3 rounded-2xl bg-slate-950/80 border text-left transition-all group flex flex-col justify-between " + (
                statusMap["georings_airports_fr"]?.completed
                  ? "border-sky-500/60 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                  : "border-slate-800 hover:border-sky-500/60"
              )}
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-sky-300">✈️ France</span>
                <span className="text-[10px] text-slate-400 font-medium">Aéroports</span>
              </div>
              {statusMap["georings_airports_fr"]?.completed ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Fait</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 font-mono">
                    {statusMap["georings_airports_fr"].ringsCompleted}/{statusMap["georings_airports_fr"].totalRings} 🎯
                  </span>
                </div>
              ) : (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              )}
            </button>

            {/* Monde Aéroports */}
            <button
              type="button"
              onClick={() => router.push("/play/georings?metric=airports&scale=world&mode=daily")}
              className={"p-3 rounded-2xl bg-slate-950/80 border text-left transition-all group flex flex-col justify-between " + (
                statusMap["georings_airports_world"]?.completed
                  ? "border-sky-500/60 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                  : "border-slate-800 hover:border-sky-500/60"
              )}
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-sky-300">🛫 Monde</span>
                <span className="text-[10px] text-slate-400 font-medium">Aéroports</span>
              </div>
              {statusMap["georings_airports_world"]?.completed ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Fait</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 font-mono">
                    {statusMap["georings_airports_world"].ringsCompleted}/{statusMap["georings_airports_world"].totalRings} 🎯
                  </span>
                </div>
              ) : (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    <span>À relever</span>
                  </span>
                </div>
              )}
            </button>
          </div>
        </section>

        {/* 2. ESPACE PARTIE RAPIDE GEORINGS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Lancement de Partie Rapide</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Centre géographique tiré au sort. Choisissez votre critère et l échelle géographique.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">5 Anneaux • 3 Vies</span>
          </div>

          {/* Critère de jeu */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              1. Critère Mesuré
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedMetric("population")}
                className={"py-3.5 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2.5 " + (
                  selectedMetric === "population"
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.01]"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                )}
              >
                <Users className="w-4 h-4" />
                <span>👥 Population</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMetric("airports");
                  if (selectedScale === "eu") setSelectedScale("fr");
                }}
                className={"py-3.5 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2.5 " + (
                  selectedMetric === "airports"
                    ? "bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-600/30 scale-[1.01]"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                )}
              >
                <Plane className="w-4 h-4" />
                <span>✈️ Aéroports (Trafic)</span>
              </button>
            </div>
          </div>

          {/* Échelle géographique */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              2. Échelle Géographique
            </label>
            <div
              className={"grid gap-2.5 text-xs font-bold " + (
                selectedMetric === "population" ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedScale("fr")}
                className={"py-3 px-3 rounded-2xl border transition-all flex items-center justify-center gap-1.5 " + (
                  selectedScale === "fr"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white"
                )}
              >
                <span>🇫🇷 France</span>
              </button>
              {selectedMetric === "population" && (
                <button
                  type="button"
                  onClick={() => setSelectedScale("eu")}
                  className={"py-3 px-3 rounded-2xl border transition-all flex items-center justify-center gap-1.5 " + (
                    selectedScale === "eu"
                      ? "bg-blue-600 text-white border-blue-500 shadow-md"
                      : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white"
                  )}
                >
                  <span>🇪🇺 Europe</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedScale("world")}
                className={"py-3 px-3 rounded-2xl border transition-all flex items-center justify-center gap-1.5 " + (
                  selectedScale === "world"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white"
                )}
              >
                <span>🌍 Monde</span>
              </button>
            </div>
          </div>

          {/* Launch CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/play/georings?metric=" + selectedMetric + "&scale=" + selectedScale + "&mode=free"
                )
              }
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>⚡ Lancer la Partie Rapide GeoRings</span>
              <span>→</span>
            </button>
          </div>
        </section>

        {/* 3. GRAND ENCADRÉ PREMIUM CUSTOM GEORINGS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/40 border-2 border-purple-500/50 hover:border-purple-400/80 transition-all shadow-2xl space-y-6 relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-5">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>GeoRings Custom & Amis</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-1">
                Personnalisez les Anneaux & le Centre de Départ
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Fixez vous-même la ville ou l aéroport de départ, ajustez les rayons en km ou passez à 5 vies pour défier vos amis sur un tirage sur-mesure.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 shrink-0 group-hover:scale-105 active:scale-95"
            >
              <Sliders className="w-4 h-4" />
              <span>Configurer GeoRings Custom</span>
              <span>→</span>
            </button>
          </div>

          {/* 3 Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20 space-y-1">
              <span className="text-base">📍</span>
              <h4 className="text-xs font-bold text-white">Centre de Départ Libre</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Démarrez depuis votre ville de cœur ou un hub aéroportuaire précis.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20 space-y-1">
              <span className="text-base">📏</span>
              <h4 className="text-xs font-bold text-white">Rayons Paramétrables</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Personnalisez les distances de chaque anneau en kilomètres pour doser la difficulté.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20 space-y-1">
              <span className="text-base">⚔️</span>
              <h4 className="text-xs font-bold text-white">Lien de Défi Amis</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Un lien direct avec vos règles exactes pour comparer vos scores sur la même partie.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Custom Game Modal in Lobby */}
      <CustomGameModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        currentScale={selectedScale}
        initialMetric={selectedMetric}
      />
    </div>
  );
}

// =========================================================================
// 2. ACTIVE GAME VIEW (When metric is chosen: population or airports)
// =========================================================================
function GeoRingsGame() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const metricParam = searchParams.get("metric") as GameMetric | null;
  const scale = (searchParams.get("scale") || "fr") as GameScale;
  const mode = (searchParams.get("mode") || "daily") as "daily" | "free" | "custom";
  const userSeed = searchParams.get("seed") || "";
  const continent = searchParams.get("continent") || "";
  const customRadii = searchParams.get("radii") || "";
  const customLives = searchParams.get("lives") || "";

  // If no metric is passed, default to rendering the Lobby
  const isLobby = !metricParam;
  const metric: GameMetric = metricParam || "population";
  const isAirports = metric === "airports";

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

  // Dropdown states for Scale & Metric (Concept 2 - Switcher Hybride)
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false);
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);
  const scaleMenuRef = useRef<HTMLDivElement>(null);
  const metricMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scaleMenuRef.current && !scaleMenuRef.current.contains(e.target as Node)) {
        setIsScaleMenuOpen(false);
      }
      if (metricMenuRef.current && !metricMenuRef.current.contains(e.target as Node)) {
        setIsMetricMenuOpen(false);
      }
    };
    if (isScaleMenuOpen || isMetricMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isScaleMenuOpen, isMetricMenuOpen]);

  const scaleMeta: Record<GameScale, { flag: string; label: string; desc: string }> = {
    fr: { flag: "🇫🇷", label: "France", desc: "Communes métropolitaines" },
    eu: { flag: "🇪🇺", label: "Europe", desc: "Grandes agglomérations UE" },
    world: { flag: "🌍", label: "Monde", desc: "Métropoles des 6 continents" },
  };

  const metricMeta: Record<GameMetric, { icon: string; label: string; desc: string }> = {
    population: { icon: "👥", label: "Villes", desc: "Classées par population" },
    airports: { icon: "✈️", label: "Aéroports", desc: "Classés par trafic passagers" },
  };

  const currentScaleMeta = scaleMeta[scale] || scaleMeta.fr;
  const currentMetricMeta = metricMeta[metric] || metricMeta.population;

  // Initialize Session
  const initGame = async () => {
    if (isLobby) return;
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
      let url = `/api/games/georings/session?scale=${scale}&mode=${mode}&metric=${metric}`;
      if (userSeed) url += `&seed=${userSeed}`;
      if (continent) url += `&continent=${continent}`;
      if (customRadii) url += `&radii=${customRadii}`;
      if (customLives) url += `&lives=${customLives}`;

      const res = await fetch(url, { cache: "no-store" });
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

  // Replay exactly the same challenge from the beginning
  const handleRestartSameGame = async () => {
    if (isLobby || !session) return;
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
      const restartSeed = session.seedCity?.id || session.seed || userSeed;
      let url = `/api/games/georings/session?scale=${scale}&mode=${mode}&metric=${metric}`;
      if (restartSeed) url += `&seed=${restartSeed}`;
      if (continent) url += `&continent=${continent}`;
      if (customRadii) url += `&radii=${customRadii}`;
      if (customLives) url += `&lives=${customLives}`;

      const res = await fetch(url, { cache: "no-store" });
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
      setFeedback({ text: "Impossible de relancer la partie.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLobby) {
      initGame();
    }
  }, [metric, scale, mode, userSeed, continent, customRadii, customLives, isLobby]);

  // Handle Guess (City or Airport)
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
          metric: session.metric || metric,
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

      // Add tested item marker
      const newMarker: MapMarker = {
        id: `guess_${city.id}`,
        lat: result.city.latitude,
        lon: result.city.longitude,
        label: result.city.iata ? `${result.city.name} (${result.city.iata})` : result.city.name,
        population: result.city.population,
        passengerCount: result.city.passengerCount,
        iata: result.city.iata,
        metric: session.metric || metric,
        type: result.isTarget ? "correct" : "wrong",
      };

      setMarkers((prev) => {
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
        cityName: result.city.name,
        countryCode: city.countryCode,
        population: result.city.population,
        passengerCount: result.city.passengerCount,
        iata: result.city.iata,
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
          targetCityName: result.city.iata ? `${result.city.name} (${result.city.iata})` : result.city.name,
        };

        setCompletedRadii((prev) => [...prev, activeRing.outerRadiusKm]);
        setRings(updatedRings);
        setIsReviewing(true);
      } else {
        // Wrong Guess
        setTriesLeft(result.triesLeft);

        if (result.ringFailed) {
          // Failed ring: Reveal target
          setFeedback({ text: result.message, type: "error" });

          if (result.targetCityIfRevealed) {
            const revealedMarker: MapMarker = {
              id: `revealed_${result.targetCityIfRevealed.id}`,
              lat: result.targetCityIfRevealed.latitude,
              lon: result.targetCityIfRevealed.longitude,
              label: result.targetCityIfRevealed.iata
                ? `${result.targetCityIfRevealed.name} (${result.targetCityIfRevealed.iata})`
                : result.targetCityIfRevealed.name,
              population: result.targetCityIfRevealed.population,
              passengerCount: result.targetCityIfRevealed.passengerCount,
              iata: result.targetCityIfRevealed.iata,
              metric: session.metric || metric,
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

          const targetDisplayName = result.targetCityIfRevealed?.iata
            ? `${result.targetCityIfRevealed.name} (${result.targetCityIfRevealed.iata})`
            : result.targetCityIfRevealed?.name;

          const updatedRings = [...rings];
          updatedRings[currentRingIndex] = {
            ...activeRing,
            isCurrent: false,
            isFailed: true,
            triesUsed: totalTries,
            targetCityName: targetDisplayName,
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

  // Handle Skip Ring
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
          metric: session.metric || metric,
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
          label: result.targetCity.iata
            ? `${result.targetCity.name} (${result.targetCity.iata})`
            : result.targetCity.name,
          population: result.targetCity.population,
          passengerCount: result.targetCity.passengerCount,
          iata: result.targetCity.iata,
          metric: session.metric || metric,
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

      const targetDisplayName = result.targetCity?.iata
        ? `${result.targetCity.name} (${result.targetCity.iata})`
        : result.targetCity?.name;

      const updatedRings = [...rings];
      updatedRings[currentRingIndex] = {
        ...activeRing,
        isCurrent: false,
        isFailed: true,
        triesUsed: totalTries === -1 ? 1 : totalTries,
        targetCityName: targetDisplayName,
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

  // Keyboard shortcut listener for Space & Enter
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
    let url = `${window.location.origin}/play/georings?scale=${scale}&mode=${mode}&metric=${metric}&seed=${seedParam}`;
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
      const iata = "iata" in c ? c.iata : undefined;
      const passengerCount = "passengerCount" in c ? c.passengerCount : undefined;

      const formattedLabel = iata ? `${name} (${iata})` : name;

      extraMarkers.push({
        id: `preview_${id}`,
        lat,
        lon,
        label: rank ? `${rank}. ${formattedLabel}` : formattedLabel,
        population: c.population,
        passengerCount,
        iata,
        metric: session?.metric || metric,
        type: "top",
      });
    };

    pinnedReviewCities.forEach((city) => addPreview(city));
    if (hoveredReviewCity) {
      addPreview(hoveredReviewCity);
    }

    if (extraMarkers.length === 0) return markers;

    const filteredBase = markers.filter((m) => {
      const key = `${m.lat.toFixed(4)},${m.lon.toFixed(4)}`;
      return !addedCoords.has(key);
    });

    return [...filteredBase, ...extraMarkers];
  }, [markers, isReviewing, pinnedReviewCities, hoveredReviewCity, session?.metric, metric]);

  const focusedCity = useMemo(() => {
    if (!isReviewing || !hoveredReviewCity) return null;
    const lat = "latitude" in hoveredReviewCity ? hoveredReviewCity.latitude : undefined;
    const lon = "longitude" in hoveredReviewCity ? hoveredReviewCity.longitude : undefined;
    if (lat === undefined || lon === undefined) return null;
    const name = "name" in hoveredReviewCity ? hoveredReviewCity.name : hoveredReviewCity.cityName;
    const rank = "rank" in hoveredReviewCity ? hoveredReviewCity.rank : undefined;
    const iata = "iata" in hoveredReviewCity ? hoveredReviewCity.iata : undefined;
    const formattedLabel = iata ? `${name} (${iata})` : name;

    return {
      lat,
      lon,
      label: rank ? `${rank}. ${formattedLabel}` : formattedLabel,
      population: hoveredReviewCity.population,
      passengerCount: "passengerCount" in hoveredReviewCity ? hoveredReviewCity.passengerCount : undefined,
      iata,
      metric: session?.metric || metric,
    };
  }, [isReviewing, hoveredReviewCity, session?.metric, metric]);

  // If no metric is specified, render the Lobby View
  if (isLobby) {
    return <GeoRingsLobby />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 h-14 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
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
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white hidden lg:block">
              GeoRings
            </h1>
          </div>
        </div>

        {/* Center: Mode Indicator, Scale Switcher & Metric Switcher (Concept 2 - Switcher Hybride) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mode Switcher : Daily | Rapide | Custom (1-Clic direct) */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (mode === "daily") {
                  initGame();
                } else {
                  router.push(`/play/georings?metric=${metric}&scale=${scale}&mode=daily`);
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "daily"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
              }`}
              title="Défi officiel du jour"
            >
              <span>📅 Du Jour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode === "free") {
                  initGame();
                } else {
                  router.push(`/play/georings?metric=${metric}&scale=${scale}&mode=free`);
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "free"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
              }`}
              title="Partie rapide standard"
            >
              <Zap className="w-3 h-3" />
              <span>Rapide</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                mode === "custom"
                  ? "bg-purple-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
              }`}
              title="Personnaliser les anneaux, rayons et règles"
            >
              <Sliders className="w-3 h-3 text-purple-400" />
              <span>Custom</span>
            </button>
          </div>

          {/* Sélecteur de Territoire / Échelle en Dropdown */}
          <div className="relative" ref={scaleMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsMetricMenuOpen(false);
                setIsScaleMenuOpen((prev) => !prev);
              }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-xs transition-all shadow-sm cursor-pointer"
              title="Changer d'échelle géographique"
            >
              <span className="text-base">{currentScaleMeta.flag}</span>
              <span className="font-bold text-white group-hover:text-blue-300 transition-colors">
                {currentScaleMeta.label}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                  isScaleMenuOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {isScaleMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-64 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1 text-left animate-in fade-in duration-150">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Échelle Géographique
                </span>
                {(["fr", "eu", "world"] as GameScale[]).map((s) => {
                  const meta = scaleMeta[s];
                  const isSelected = scale === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setIsScaleMenuOpen(false);
                        router.push(`/play/georings?metric=${metric}&scale=${s}&mode=${mode}`);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.flag}</span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{meta.label}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">{meta.desc}</p>
                        </div>
                      </div>
                      {isSelected && <span className="text-xs text-blue-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sélecteur de Critère / Métrique en Dropdown (Évolutif pour futurs critères) */}
          <div className="relative" ref={metricMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsScaleMenuOpen(false);
                setIsMetricMenuOpen((prev) => !prev);
              }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-xs transition-all shadow-sm cursor-pointer"
              title="Changer de critère de jeu (Villes, Aéroports...)"
            >
              <span className="text-base">{currentMetricMeta.icon}</span>
              <span className="font-bold text-white group-hover:text-blue-300 transition-colors">
                {currentMetricMeta.label}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                  isMetricMenuOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {isMetricMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-72 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1 text-left animate-in fade-in duration-150">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Données & Critères Cibles
                </span>
                {(["population", "airports"] as GameMetric[]).map((m) => {
                  const meta = metricMeta[m];
                  const isSelected = metric === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setIsMetricMenuOpen(false);
                        if (metric !== m) {
                          router.push(`/play/georings?metric=${m}&scale=${scale}&mode=${mode}`);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{meta.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{meta.label}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">{meta.desc}</p>
                        </div>
                      </div>
                      {isSelected && <span className="text-xs text-blue-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Restart Button - Non disponible en Défi du Jour */}
          {mode !== "daily" && (
            <button
              type="button"
              onClick={handleRestartSameGame}
              title="Recommencer la partie"
              aria-label="Recommencer la partie"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs"
            >
              <RotateCcw className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          )}

          {isGameOver && (
            <button
              type="button"
              onClick={() => setShowGameOverModal(true)}
              title="Voir le bilan final de la partie"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Bilan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Paramètres de jeu"
            aria-label="Paramètres de jeu"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            title="Règles du jeu"
            aria-label="Règles du jeu"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            title="Défier un ami sur cette même partie"
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
                metric={metric}
                onSelectCity={handleSelectCity}
                onSkip={isReviewing ? handleNextRing : handleSkipRing}
                onCityNotFound={(query) =>
                  setFeedback({
                    text: isAirports
                      ? `Aéroport "${query}" introuvable. Essayez le nom de ville, IATA (ex: CDG) ou nom officiel.`
                      : `Ville "${query}" introuvable. Vérifiez l'orthographe.`,
                    type: "warning",
                  })
                }
                showDropdown={settings.showAutocompleteDropdown}
                disabled={isGameOver || isSubmitting || loading || isReviewing}
                placeholder={
                  isReviewing
                    ? "Anneau terminé — Espace pour continuer..."
                    : isAirports
                    ? "Rechercher un aéroport (ex. CDG, Orly, Heathrow, Nice)..."
                    : "Tapez la ville la plus peuplée..."
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

          {/* Integrated Feedback / Direction Hint Row */}
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
        initialMetric={metric}
      />

      {/* Rules Modal */}
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
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isAirports ? "bg-sky-500/15 border border-sky-500/30 text-sky-400" : "bg-blue-500/15 border border-blue-500/30 text-blue-400"}`}>
                  {isAirports ? <Plane className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Règles : {isAirports ? "Aéroports & Trafic" : "Villes & Population"}
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
                <span className="font-bold text-white block mb-1">🎯 1. Objectif</span>
                À partir d'un {isAirports ? "aéroport de départ" : "centre géographique"}, découvrez{" "}
                {isAirports ? (
                  <strong>l'aéroport au plus fort trafic annuel de passagers</strong>
                ) : (
                  <strong>la ville la plus peuplée</strong>
                )}{" "}
                située à l'intérieur de chaque anneau concentrique successif.
              </div>

              {isAirports && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="font-bold text-white block mb-1">✈️ 2. Recherche multi-clés</span>
                  Tapez le nom de la ville desservie (ex: <em>Nice</em>), le nom de l'aéroport (ex: <em>Charles de Gaulle</em>, <em>Orly</em>) ou son code IATA à 3 lettres (ex: <em>CDG</em>, <em>LHR</em>).
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">⭕ {isAirports ? "3" : "2"}. Anneaux Concentriques</span>
                Le premier anneau est un cercle proche du centre. Les anneaux suivants s'étendent de plus en plus loin pour couvrir l'ensemble du territoire.
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">❤️ {isAirports ? "4" : "3"}. Vies & Tentatives</span>
                Chaque proposition essayée apparaît sur la carte en vert (succès) ou rouge (erreur). Si vos vies s'épuisent, la bonne réponse est révélée et le jeu avance.
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-bold text-white block mb-1">🧭 {isAirports ? "5" : "4"}. Boussole Directionnelle</span>
                En cas d'erreur dans l'anneau, un indice directionnel vous guide vers la cible depuis votre essai.
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                J'ai compris
              </button>
            </div>
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
              cityName: session.seedCity.cityName,
              iata: session.seedCity.iata,
              lat: session.seedCity.latitude,
              lon: session.seedCity.longitude,
              population: session.seedCity.population,
              passengerCount: session.seedCity.passengerCount,
            }}
            activeRadiusKm={rings[currentRingIndex]?.outerRadiusKm}
            completedRadiiKm={completedRadii}
            markers={displayedMarkers}
            showBorders={settings.showBorders}
            mapTheme={settings.mapTheme}
            metric={session.metric || metric}
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
            <span>{isAirports ? "Hub de départ :" : "Centre :"}</span>
            <b className="text-blue-400 font-semibold">
              {isAirports
                ? `${session.seedCity.cityName ? `${session.seedCity.cityName} — ` : ""}${session.seedCity.name}${session.seedCity.iata ? ` (${session.seedCity.iata})` : ""}`
                : session.seedCity.name}
            </b>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-medium">
              {isAirports ? "✈️ Aéroports" : "👥 Villes"}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-[10px] text-slate-500">
              {mode === "daily" ? "Du Jour" : mode === "custom" ? "Custom" : "Partie Rapide"}
            </span>
          </div>
        )}

        {/* Ring Review Learning Panel (Left Side) */}
        {isReviewing && rings[currentRingIndex] && (
          <RingReviewCard
            ringIndex={currentRingIndex}
            innerRadiusKm={rings[currentRingIndex].innerRadiusKm}
            outerRadiusKm={rings[currentRingIndex].outerRadiusKm}
            guesses={currentRingGuesses}
            topCities={currentRingTopCities}
            metric={session?.metric || metric}
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
          metric={session.metric || metric}
          seed={session.seed}
          seedCityName={
            isAirports
              ? `${session.seedCity.cityName ? `${session.seedCity.cityName} — ` : ""}${session.seedCity.name}${session.seedCity.iata ? ` (${session.seedCity.iata})` : ""}`
              : session.seedCity.name
          }
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
