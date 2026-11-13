"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Share2,
  Check,
  Compass,
  MapPin,
  Play,
  RotateCcw,
  Flame,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useDailyChallenges } from "@/lib/stats/useDailyChallenges";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";

interface ChallengeDef {
  id: string;
  game: "georings" | "blindpoint";
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  linkUrl: string;
  isGeoRings: boolean;
  theme: "blue" | "sky" | "emerald";
}

const DAILY_CHALLENGES: ChallengeDef[] = [
  // GEORINGS (5)
  {
    id: "georings_population_fr",
    game: "georings",
    title: "France — Population",
    subtitle: "Centre du jour fixe • 5 anneaux concentriques",
    badge: "Quotidien #1",
    icon: "👥",
    linkUrl: "/play/georings?metric=population&scale=fr&mode=daily",
    isGeoRings: true,
    theme: "blue",
  },
  {
    id: "georings_population_eu",
    game: "georings",
    title: "Europe — Population",
    subtitle: "5 anneaux à travers les capitales européennes",
    badge: "Quotidien #2",
    icon: "🇪🇺",
    linkUrl: "/play/georings?metric=population&scale=eu&mode=daily",
    isGeoRings: true,
    theme: "blue",
  },
  {
    id: "georings_population_world",
    game: "georings",
    title: "Monde — Population",
    subtitle: "Échelle planétaire (Tokyo, NYC, São Paulo...)",
    badge: "Quotidien #3",
    icon: "🌍",
    linkUrl: "/play/georings?metric=population&scale=world&mode=daily",
    isGeoRings: true,
    theme: "blue",
  },
  {
    id: "georings_airports_fr",
    game: "georings",
    title: "France — Aéroports",
    subtitle: "Critère : Trafic passagers annuel (DGAC)",
    badge: "DGAC",
    icon: "✈️",
    linkUrl: "/play/georings?metric=airports&scale=fr&mode=daily",
    isGeoRings: true,
    theme: "sky",
  },
  {
    id: "georings_airports_world",
    game: "georings",
    title: "Monde — Aéroports",
    subtitle: "Grands hubs mondiaux (Atlanta, Dubaï, Heathrow...)",
    badge: "Grands Hubs",
    icon: "🛫",
    linkUrl: "/play/georings?metric=airports&scale=world&mode=daily",
    isGeoRings: true,
    theme: "sky",
  },

  // BLIND POINT (5)
  {
    id: "blindpoint_villes_france",
    game: "blindpoint",
    title: "Villes de France",
    subtitle: "Calibré : 2 faciles • 2 moyennes • 1 terroir",
    badge: "139 villes",
    icon: "🇫🇷",
    linkUrl: "/play/blindpoint?pack=villes_france&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
  {
    id: "blindpoint_villes_europe",
    game: "blindpoint",
    title: "Villes d'Europe",
    subtitle: "Calibré : 2 faciles • 2 moyennes • 1 perle",
    badge: "42 métropoles",
    icon: "🇪🇺",
    linkUrl: "/play/blindpoint?pack=villes_europe&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
  {
    id: "blindpoint_villes_monde",
    game: "blindpoint",
    title: "Villes du Monde",
    subtitle: "Équilibrage continental progressif (5 continents)",
    badge: "167 mégapoles",
    icon: "🌍",
    linkUrl: "/play/blindpoint?pack=villes_monde&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
  {
    id: "blindpoint_lieux_paris",
    game: "blindpoint",
    title: "Monuments de Paris",
    subtitle: "Micro-carte Paris Intra • Tolérance 1,5 km",
    badge: "105 trésors",
    icon: "🗼",
    linkUrl: "/play/blindpoint?pack=lieux_paris&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
  {
    id: "blindpoint_lieux_monde",
    game: "blindpoint",
    title: "Merveilles du Monde",
    subtitle: "Pétra, Taj Mahal, Colisée, Machu Picchu...",
    badge: "50 merveilles",
    icon: "🏛️",
    linkUrl: "/play/blindpoint?pack=lieux_monde&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
];

export const DailyChallengeHubView: React.FC = () => {
  const { statusMap, loading } = useDailyChallenges();
  const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "done">("all");
  const [gameFilter, setGameFilter] = useState<"all" | "georings" | "blindpoint">("all");
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<string>("");

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  // Countdown timer to 00:00 UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrowUtc = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0
        )
      );
      const diffMs = tomorrowUtc.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(
          secs
        ).padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stats calculation
  const completedCount = useMemo(() => {
    return DAILY_CHALLENGES.filter((c) => statusMap[c.id]?.completed).length;
  }, [statusMap]);

  const totalCount = DAILY_CHALLENGES.length;
  const remainingCount = totalCount - completedCount;
  const completionPercent = Math.round((completedCount / totalCount) * 100);

  const totalCumulativeScore = useMemo(() => {
    return DAILY_CHALLENGES.reduce((sum, c) => {
      const s = statusMap[c.id];
      if (s?.completed && s.score) {
        return sum + s.score;
      }
      return sum;
    }, 0);
  }, [statusMap]);

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return DAILY_CHALLENGES.filter((c) => {
      const isCompleted = !!statusMap[c.id]?.completed;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "done" && isCompleted) ||
        (statusFilter === "todo" && !isCompleted);

      const matchesGame = gameFilter === "all" || c.game === gameFilter;
      return matchesStatus && matchesGame;
    });
  }, [statusMap, statusFilter, gameFilter]);

  const georingsList = useMemo(() => {
    return filteredChallenges.filter((c) => c.game === "georings");
  }, [filteredChallenges]);

  const blindpointList = useMemo(() => {
    return filteredChallenges.filter((c) => c.game === "blindpoint");
  }, [filteredChallenges]);

  // Share daily summary to clipboard
  const handleShare = () => {
    const text = `🏆 Mes Défis du Jour GeoHub (${new Date().toLocaleDateString("fr-FR")}) :\n` +
      `✅ ${completedCount}/10 complétés (${completionPercent}%)\n` +
      `🎯 Score cumulé : ${totalCumulativeScore.toLocaleString("fr-FR")} pts\n` +
      `Rejoignez-moi sur https://geohub-sage.vercel.app/play/daily-challenge`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Platform Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QuickMenuDrawer />
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-none">
                  GeoHub
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                  Arcade Géographique
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LeaderboardTriggerButton
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              label="Classement"
            />
            <UserNav />
          </div>
        </div>
      </nav>

      {/* Sub-Header Breadcrumb & UTC Countdown */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Défis Quotidiens Officiels</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Reset dans : <strong className="text-amber-400 font-bold">{countdown || "--:--:--"}</strong>
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">(00:00 UTC)</span>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden py-8 px-6 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                <span>★ Rendez-vous Officiel Quotidien</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight capitalize flex items-center gap-3">
                <span>Les Défis du Jour</span>
                <span className="text-xs sm:text-sm font-normal text-slate-400 font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  {todayFormatted}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Tirages officiels uniques avec graines déterministes. Une seule tentative officielle est comptabilisée par jour pour les classements. Entraînez-vous ensuite librement à volonté !
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Partager mon bilan</span>
                  </>
                )}
              </button>
              <LeaderboardTriggerButton
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                label="Classement Général"
              />
            </div>
          </div>

          {/* Performance KPIs Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            {/* KPI 1 : Completed */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Complétés Aujourd'hui
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  {completedCount}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {totalCount}</span>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold mt-1">
                {completionPercent}% accomplis
              </span>
            </div>

            {/* KPI 2 : Remaining */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Restants à Relever
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {remainingCount}
                </span>
                <span className="text-xs text-slate-400">à jouer</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {remainingCount === 0 ? "Grand Chelem validé ! 🎉" : "Reset à 00:00 UTC"}
              </span>
            </div>

            {/* KPI 3 : Cumulative Score */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Score Cumulé du Jour
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {totalCumulativeScore.toLocaleString("fr-FR")}
                </span>
                <span className="text-[11px] text-slate-400">pts</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold mt-1">
                {completedCount > 0 ? "Points enregistrés" : "En attente du 1er tirage"}
              </span>
            </div>

            {/* KPI 4 : Daily Streak */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Série Quotidienne
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-orange-400 font-mono flex items-center gap-1">
                  <Flame className="w-5 h-5 fill-orange-400 text-orange-500" />
                  <span>Actif</span>
                </span>
              </div>
              <span className="text-[10px] text-orange-300 font-semibold mt-1">
                Fidélité récompensée
              </span>
            </div>
          </div>

          {/* Overall Visual Progress Bar & 10 Status Dots */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-200">
                Progression du jour :{" "}
                <strong className="text-amber-400 font-mono">
                  {completedCount} / {totalCount} Défis Relevés
                </strong>
              </span>
              <span className="text-slate-400 text-[11px]">
                5 GeoRings (cercles bleus) • 5 Blind Point (cercles émeraudes)
              </span>
            </div>

            {/* 10 Pastilles d'état */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {DAILY_CHALLENGES.map((challenge, idx) => {
                const isCompleted = !!statusMap[challenge.id]?.completed;
                const isGr = challenge.game === "georings";

                return (
                  <Link
                    key={challenge.id}
                    href={challenge.linkUrl}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isCompleted
                        ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                    title={`${challenge.title} : ${isCompleted ? "Relevé" : "À relever"}`}
                  >
                    <span className="text-sm">{challenge.icon}</span>
                    <span
                      className={`text-[9px] font-bold font-mono ${
                        isCompleted ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isCompleted ? "Fait" : `#${idx + 1}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="max-w-6xl mx-auto px-6 pt-6 pb-2 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              statusFilter === "all"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tous les défis ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("todo")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              statusFilter === "todo"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>À relever ({remainingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("done")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              statusFilter === "done"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Relevés ({completedCount})</span>
          </button>
        </div>

        {/* Game Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Jeu :</span>
          </span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setGameFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                gameFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setGameFilter("georings")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                gameFilter === "georings"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🧭 GeoRings (5)
            </button>
            <button
              type="button"
              onClick={() => setGameFilter("blindpoint")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                gameFilter === "blindpoint"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎯 Blind Point (5)
            </button>
          </div>
        </div>
      </section>

      {/* Main Challenge Panels */}
      <section className="max-w-6xl mx-auto px-6 py-4 flex-1 w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PANEL 1 : GEORINGS */}
          {georingsList.length > 0 && (
            <div className="bg-slate-900/90 border-2 border-blue-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-lg">
                      🧭
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        GeoRings — Cercles Concentriques
                      </h3>
                      <span className="text-xs text-slate-400">
                        5 anneaux quotidiens • 3 vies
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 border border-blue-500/40 px-2.5 py-1 rounded-lg font-bold">
                    5 déclinaisons
                  </span>
                </div>

                {/* List of GeoRings Challenges */}
                <div className="space-y-2.5">
                  {georingsList.map((item) => {
                    const status = statusMap[item.id];
                    const isDone = !!status?.completed;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isDone
                            ? "bg-slate-950/80 border-emerald-500/40 shadow-sm"
                            : "bg-slate-950/80 border-slate-800 hover:border-blue-500/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white whitespace-nowrap">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-blue-400 font-mono font-bold">
                                • {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Status Button Area */}
                        {isDone ? (
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Fait</span>
                              </span>
                              <span className="text-[11px] font-black text-emerald-300 font-mono mt-0.5">
                                {status.ringsCompleted}/{status.totalRings || 5} anneaux
                              </span>
                            </div>
                            <Link
                              href={item.linkUrl}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs transition-all shadow-sm"
                            >
                              Rejouer
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>À relever</span>
                            </span>
                            <Link
                              href={item.linkUrl}
                              className="px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                            >
                              Jouer →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Modifier le centre ou les anneaux ?</span>
                <Link
                  href="/play/georings"
                  className="text-blue-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Page Dédiée GeoRings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* PANEL 2 : BLIND POINT */}
          {blindpointList.length > 0 && (
            <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        Blind Point — Précision Aveugle
                      </h3>
                      <span className="text-xs text-slate-400">
                        5 manches quotidiennes • Carte muette
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold">
                    5 déclinaisons
                  </span>
                </div>

                {/* List of Blind Point Challenges */}
                <div className="space-y-2.5">
                  {blindpointList.map((item) => {
                    const status = statusMap[item.id];
                    const isDone = !!status?.completed;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isDone
                            ? "bg-slate-950/80 border-emerald-500/40 shadow-sm"
                            : "bg-slate-950/80 border-slate-800 hover:border-emerald-500/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white whitespace-nowrap">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                • {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Status Button Area */}
                        {isDone ? (
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Fait</span>
                              </span>
                              <span className="text-[11px] font-black text-emerald-300 font-mono mt-0.5">
                                {status.score?.toLocaleString("fr-FR")} pts
                              </span>
                            </div>
                            <Link
                              href={item.linkUrl}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs transition-all shadow-sm"
                            >
                              Rejouer
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                              <span>À relever</span>
                            </span>
                            <Link
                              href={item.linkUrl}
                              className="px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition-all bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25"
                            >
                              Jouer →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Entraînement libre ou custom ?</span>
                <Link
                  href="/play/blindpoint"
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Page Dédiée Blind Point</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GeoHub — Défis Quotidiens Officiels.</p>
          <Link href="/" className="text-slate-400 hover:text-white underline">
            Retourner au catalogue des mini-jeux
          </Link>
        </div>
      </footer>
    </div>
  );
};
