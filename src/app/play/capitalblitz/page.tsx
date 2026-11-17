"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Clock,
  Globe,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  RotateCcw,
  Play,
  Compass,
} from "lucide-react";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";
import { CapitalBlitzActiveGame } from "@/components/game/capitalblitz/CapitalBlitzActiveGame";
import { CapitalBlitzContinent, CapitalBlitzMode } from "@/lib/games/capitalblitz/types";

function CapitalBlitzContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isPlaying = searchParams.get("play") === "1";
  const mode = (searchParams.get("mode") as CapitalBlitzMode) || "sprint60";
  const rawSeed = searchParams.get("seed") || undefined;
  const continent = (searchParams.get("continent") as CapitalBlitzContinent) || "all";

  // Active in-game view
  if (isPlaying) {
    return (
      <CapitalBlitzActiveGame
        key={`blitz-${mode}-${rawSeed || "session"}-${continent}`}
        mode={mode}
        seed={rawSeed}
        onBackToLobby={() => router.push("/play/capitalblitz")}
      />
    );
  }

  // Cockpit / Selection Lobby View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-white select-none">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QuickMenuDrawer />

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 group-hover:scale-105 transition-all shadow-md shadow-amber-500/10">
                <Zap className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-none">
                  Capital Blitz
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                  Sprint Contre-la-montre
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LeaderboardTriggerButton
              initialGame="capitalblitz"
              initialVariant="all"
              label="Classement"
            />
            {/* UserNav hors jeu affiche la série en cours */}
            <UserNav />
          </div>
        </div>
      </nav>

      {/* Main Cockpit Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* 1. Daily Sprint Hero Card */}
        <section className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-44 h-44 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Défi Officiel du Jour
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
              Graine du Jour • 60s
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sprint Mondial du Jour
            </h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Même séquence de pays pour tous les joueurs aujourd'hui. Marquez le score le plus élevé en 60 secondes et hissez-vous au sommet du classement !
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push("/play/capitalblitz?mode=daily&play=1")}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Lancer le Défi du Jour (60s)</span>
            </button>
          </div>
        </section>

        {/* 2. Free Practice Modes by Territory */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span>Modes Entraînement & Continents</span>
            </h3>
            <span className="text-xs text-slate-500">Parties libres illimitées</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              {
                id: "all",
                title: "Monde Entier",
                desc: "166 capitales mondiales toutes zones confondues",
                icon: "🌍",
                badge: "Classique",
              },
              {
                id: "Europe",
                title: "Europe",
                desc: "47 nations du continent européen",
                icon: "🇪🇺",
                badge: "Populaire",
              },
              {
                id: "Africa",
                title: "Afrique",
                desc: "50 capitales africaines de Dakar au Caire",
                icon: "🌍",
                badge: "Challenge",
              },
              {
                id: "Americas",
                title: "Amériques",
                desc: "35 capitales du Nord, Centrale et du Sud",
                icon: "🌎",
                badge: "Varié",
              },
              {
                id: "Asia",
                title: "Asie",
                desc: "45 capitales orientales et du Moyen-Orient",
                icon: "🌏",
                badge: "Expert",
              },
              {
                id: "Oceania",
                title: "Océanie",
                desc: "Nations insulaires et archipels du Pacifique",
                icon: "🏝️",
                badge: "Exotique",
              },
            ].map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/play/capitalblitz?mode=practice&continent=${pack.id}&play=1`
                  )
                }
                className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all text-left flex items-start justify-between shadow-lg cursor-pointer"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl shrink-0">{pack.icon}</span>
                    <span className="font-extrabold text-white text-base group-hover:text-amber-300 transition-colors truncate">
                      {pack.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                      {pack.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pack.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CapitalBlitzPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400">
          <Zap className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <CapitalBlitzContent />
    </Suspense>
  );
}
