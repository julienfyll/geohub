"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Compass,
  MapPin,
  Home,
  Plane,
  Users,
  ChevronRight,
  Trophy,
  Layers,
} from "lucide-react";
import { LeaderboardModal } from "@/components/leaderboard/LeaderboardModal";

interface QuickMenuDrawerProps {
  currentPath?: string;
}

export const QuickMenuDrawer: React.FC<QuickMenuDrawerProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleNav = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Drawer Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm group"
        title="Ouvrir le menu de navigation rapide"
        aria-label="Menu principal"
      >
        <Menu className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
        <span className="hidden sm:inline font-bold">Menu</span>
      </button>

      {/* Backdrop & Drawer Panel */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Sliding Sidebar Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-900 border-r border-slate-800 h-screen shadow-2xl flex flex-col z-10 animate-slide-right overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                  <Compass className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-base font-extrabold tracking-tight text-white block leading-none">
                    GeoHub
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                    Navigation Rapide
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="p-4 space-y-6 flex-1">
              {/* Home & Leaderboard Quick Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleNav("/")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700/60 hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Hub Principal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowLeaderboard(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-blue-500/10 hover:from-amber-500/20 hover:to-blue-500/20 text-amber-200 font-bold text-xs border border-amber-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Classements & Records</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Game 1 : Blind Point */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Blind Point
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNav("/play/blindpoint")}
                    className="text-[10px] text-slate-400 hover:text-white transition-colors font-semibold"
                  >
                    Lobby
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNav("/play/blindpoint?pack=villes_france&difficulty=moyen&mode=daily&play=1")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 block">🇫🇷 Villes</span>
                    <span className="text-[10px] text-slate-500">Du Jour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/blindpoint?pack=lieux_paris&mode=daily&play=1")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 block">🗼 Paris</span>
                    <span className="text-[10px] text-slate-500">105 lieux</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/blindpoint?pack=lieux_france&mode=daily&play=1")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 block">🏰 Patrimoine</span>
                    <span className="text-[10px] text-slate-500">Châteaux</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/blindpoint?pack=villes_monde&difficulty=moyen&mode=daily&play=1")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 block">🌍 Monde</span>
                    <span className="text-[10px] text-slate-500">Métropoles</span>
                  </button>
                </div>
              </div>

              {/* Game 2 : GeoRings */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> GeoRings
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNav("/play/georings")}
                    className="text-[10px] text-slate-400 hover:text-white transition-colors font-semibold"
                  >
                    Lobby
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNav("/play/georings?metric=population&scale=fr&mode=daily")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-400" /> Villes FR
                    </span>
                    <span className="text-[10px] text-slate-500">Population</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/georings?metric=population&scale=world&mode=daily")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-400" /> Villes Monde
                    </span>
                    <span className="text-[10px] text-slate-500">Population</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/georings?metric=airports&scale=fr&mode=daily")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <Plane className="w-3 h-3 text-sky-400" /> Aéroports FR
                    </span>
                    <span className="text-[10px] text-slate-500">Passagers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/georings?metric=airports&scale=eu&mode=daily")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <Plane className="w-3 h-3 text-sky-400" /> Aéroports EU
                    </span>
                    <span className="text-[10px] text-slate-500">Passagers</span>
                  </button>
                </div>
              </div>

              {/* Game 3 : BorderPath */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> BorderPath
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNav("/play/borderpath")}
                    className="text-[10px] text-slate-400 hover:text-white transition-colors font-semibold"
                  >
                    Lobby
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNav("/play/borderpath?pack=monde&mode=daily")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 block">🌍 Monde</span>
                    <span className="text-[10px] text-slate-500">Du Jour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav("/play/borderpath?pack=france_departements&mode=daily")}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200 block">🇫🇷 Départements</span>
                    <span className="text-[10px] text-slate-500">96 métropolitains</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-center">
              <span className="text-[11px] text-slate-500 font-medium">
                GeoHub — Arcade Géographique © 2026
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </>
  );
};
