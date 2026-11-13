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
  Layers,
} from "lucide-react";
import { useDailyChallenges } from "@/lib/stats/useDailyChallenges";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";

interface ChallengeDef {
  id: string;
  game: "georings" | "blindpoint" | "borderpath";
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  linkUrl: string;
  isGeoRings: boolean;
  theme: "blue" | "sky" | "emerald" | "indigo";
}

const DAILY_CHALLENGES: ChallengeDef[] = [
  // GEORINGS (5)
  {
    id: "georings_population_fr",
    game: "georings",
    title: "France — Villes",
    subtitle: "Centre du jour fixe • 5 anneaux",
    badge: "Population",
    icon: "👥",
    linkUrl: "/play/georings?metric=population&scale=fr&mode=daily",
    isGeoRings: true,
    theme: "blue",
  },
  {
    id: "georings_population_eu",
    game: "georings",
    title: "Europe — Villes",
    subtitle: "5 anneaux à travers les capitales",
    badge: "Population",
    icon: "🇪🇺",
    linkUrl: "/play/georings?metric=population&scale=eu&mode=daily",
    isGeoRings: true,
    theme: "blue",
  },
  {
    id: "georings_population_world",
    game: "georings",
    title: "Monde — Villes",
    subtitle: "Échelle planétaire (Tokyo, NYC...)",
    badge: "Population",
    icon: "🌍",
    linkUrl: "/play/georings?metric=population&scale=world&mode=daily",
    isGeoRings: true,
    theme: "blue",
  },
  {
    id: "georings_airports_fr",
    game: "georings",
    title: "France — Aéroports",
    subtitle: "Trafic annuel passagers (DGAC)",
    badge: "Aéroports",
    icon: "✈️",
    linkUrl: "/play/georings?metric=airports&scale=fr&mode=daily",
    isGeoRings: true,
    theme: "sky",
  },
  {
    id: "georings_airports_world",
    game: "georings",
    title: "Monde — Aéroports",
    subtitle: "Grands hubs mondiaux",
    badge: "Aéroports",
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
    subtitle: "5 cibles équilibrées",
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
    subtitle: "Capitales & métropoles",
    badge: "42 villes",
    icon: "🇪🇺",
    linkUrl: "/play/blindpoint?pack=villes_europe&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
  {
    id: "blindpoint_villes_monde",
    game: "blindpoint",
    title: "Villes du Monde",
    subtitle: "Équilibrage continental",
    badge: "167 villes",
    icon: "🌍",
    linkUrl: "/play/blindpoint?pack=villes_monde&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },
  {
    id: "blindpoint_lieux_paris",
    game: "blindpoint",
    title: "Monuments de Paris",
    subtitle: "Tolérance micro-carte 1,5 km",
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
    subtitle: "Pétra, Taj Mahal, Colisée...",
    badge: "50 sites",
    icon: "🏛️",
    linkUrl: "/play/blindpoint?pack=lieux_monde&mode=daily&play=1",
    isGeoRings: false,
    theme: "emerald",
  },

  // BORDERPATH (5)
  {
    id: "borderpath_monde",
    game: "borderpath",
    title: "Monde Continental",
    subtitle: "Frontières terrestres reliées",
    badge: "167 pays",
    icon: "🌍",
    linkUrl: "/play/borderpath?pack=monde&mode=daily&play=1",
    isGeoRings: false,
    theme: "indigo",
  },
  {
    id: "borderpath_europe",
    game: "borderpath",
    title: "Europe",
    subtitle: "Du Portugal à l'Oural",
    badge: "46 pays",
    icon: "🇪🇺",
    linkUrl: "/play/borderpath?pack=europe&mode=daily&play=1",
    isGeoRings: false,
    theme: "indigo",
  },
  {
    id: "borderpath_france_departements",
    game: "borderpath",
    title: "France — 96 Dépts",
    subtitle: "Voisinage contigu métropolitain",
    badge: "96 dépts",
    icon: "🇫🇷",
    linkUrl: "/play/borderpath?pack=france_departements&mode=daily&play=1",
    isGeoRings: false,
    theme: "indigo",
  },
  {
    id: "borderpath_ameriques",
    game: "borderpath",
    title: "Amériques",
    subtitle: "Corridor panaméricain Nord/Sud",
    badge: "35 pays",
    icon: "🌎",
    linkUrl: "/play/borderpath?pack=ameriques&mode=daily&play=1",
    isGeoRings: false,
    theme: "indigo",
  },
  {
    id: "borderpath_afrique",
    game: "borderpath",
    title: "Afrique",
    subtitle: "Traversée Sahara, Sahel et Rift",
    badge: "54 pays",
    icon: "🌍",
    linkUrl: "/play/borderpath?pack=afrique&mode=daily&play=1",
    isGeoRings: false,
    theme: "indigo",
  },
];

export const DailyChallengeHubView: React.FC = () => {
  const { statusMap, loading } = useDailyChallenges();
  const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "done">("all");
  const [gameFilter, setGameFilter] = useState<"all" | "georings" | "blindpoint" | "borderpath">("all");
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

  const borderpathList = useMemo(() => {
    return filteredChallenges.filter((c) => c.game === "borderpath");
  }, [filteredChallenges]);

  // Share daily summary to clipboard
  const handleShare = () => {
    const text = `🏆 Mes Défis du Jour GeoHub (${new Date().toLocaleDateString("fr-FR")}) :\n` +
      `✅ ${completedCount}/${totalCount} complétés (${completionPercent}%)\n` +
      `🎯 Score cumulé : ${totalCumulativeScore.toLocaleString("fr-FR")} pts\n` +
      `Rejoignez-moi sur https://geohub-sage.vercel.app/play/daily-challenge`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const renderChallengeItem = (item: ChallengeDef) => {
    const status = statusMap[item.id];
    const isDone = !!status?.completed;

    const playBtnClass =
      item.theme === "emerald"
        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
        : item.theme === "indigo"
        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
        : item.theme === "sky"
        ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/25"
        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25";

    const scoreDisplay =
      status?.ringsCompleted !== undefined && item.game === "georings"
        ? `${status.ringsCompleted}/${status.totalRings || 5} ann.`
        : status?.attempts !== undefined && item.game === "borderpath"
        ? `${status.attempts} coups`
        : `${status?.score?.toLocaleString("fr-FR")} pts`;

    return (
      <div
        key={item.id}
        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
          isDone
            ? "bg-slate-950/70 border-emerald-500/40 shadow-sm"
            : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-xl shrink-0 select-none">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {item.title}
              </h4>
              {item.badge && (
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  • {item.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {item.subtitle}
            </p>
          </div>
        </div>

        {/* Action Button Area */}
        {isDone ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black font-mono">
              {scoreDisplay}
            </span>
            <Link
              href={item.linkUrl}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs transition-colors shadow-sm"
            >
              Rejouer
            </Link>
          </div>
        ) : (
          <Link
            href={item.linkUrl}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 hover:scale-[1.02] flex items-center gap-1 ${playBtnClass}`}
          >
            <span>Jouer</span>
            <span>→</span>
          </Link>
        )}
      </div>
    );
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
                5 GeoRings • 5 Blind Point • 5 BorderPath
              </span>
            </div>

            {/* 15 Pastilles d'état */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
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
      <section className="max-w-7xl mx-auto px-6 pt-6 pb-2 w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tous ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("todo")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "todo"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>À relever ({remainingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("done")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "done"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Relevés ({completedCount})</span>
          </button>
        </div>

        {/* Game Filter */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setGameFilter("all")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              gameFilter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tous les jeux
          </button>
          <button
            type="button"
            onClick={() => setGameFilter("georings")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
              gameFilter === "georings"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🧭</span>
            <span>GeoRings</span>
          </button>
          <button
            type="button"
            onClick={() => setGameFilter("blindpoint")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
              gameFilter === "blindpoint"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎯</span>
            <span>Blind Point</span>
          </button>
          <button
            type="button"
            onClick={() => setGameFilter("borderpath")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
              gameFilter === "borderpath"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🗺️</span>
            <span>BorderPath</span>
          </button>
        </div>
      </section>

      {/* Main Challenge Panels */}
      <section className="max-w-7xl mx-auto px-6 py-4 flex-1 w-full space-y-6">
        <div
          className={`grid gap-6 ${
            gameFilter === "all"
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 max-w-xl mx-auto"
          }`}
        >
          {/* PANEL 1 : GEORINGS */}
          {georingsList.length > 0 && (
            <div className="bg-slate-900/90 border-2 border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="space-y-3.5">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                    🧭
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white leading-tight truncate">
                      GeoRings
                    </h3>
                    <span className="text-xs text-slate-400 block truncate">
                      5 anneaux concentriques • 3 vies
                    </span>
                  </div>
                </div>

                {/* List of GeoRings Challenges */}
                <div className="space-y-2">
                  {georingsList.map(renderChallengeItem)}
                </div>
              </div>

              <div className="pt-3 mt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Entraînement libre</span>
                <Link
                  href="/play/georings"
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Page Dédiée</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* PANEL 2 : BLIND POINT */}
          {blindpointList.length > 0 && (
            <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="space-y-3.5">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                    🎯
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white leading-tight truncate">
                      Blind Point
                    </h3>
                    <span className="text-xs text-slate-400 block truncate">
                      5 manches quotidiennes • Carte muette
                    </span>
                  </div>
                </div>

                {/* List of Blind Point Challenges */}
                <div className="space-y-2">
                  {blindpointList.map(renderChallengeItem)}
                </div>
              </div>

              <div className="pt-3 mt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Entraînement libre</span>
                <Link
                  href="/play/blindpoint"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Page Dédiée</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* PANEL 3 : BORDERPATH */}
          {borderpathList.length > 0 && (
            <div className="bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="space-y-3.5">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                    🗺️
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white leading-tight truncate">
                      BorderPath
                    </h3>
                    <span className="text-xs text-slate-400 block truncate">
                      5 parcours quotidiens • Connexion contiguë
                    </span>
                  </div>
                </div>

                {/* List of BorderPath Challenges */}
                <div className="space-y-2">
                  {borderpathList.map(renderChallengeItem)}
                </div>
              </div>

              <div className="pt-3 mt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Entraînement libre</span>
                <Link
                  href="/play/borderpath"
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Page Dédiée</span>
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
