"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Flame,
  User,
  Loader2,
  BarChart3,
  Map,
  History,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ProfileModal } from "@/components/profile/ProfileModal";

interface UserNavProps {
  compact?: boolean;
}

export const UserNav: React.FC<UserNavProps> = ({ compact = false }) => {
  const { user, profile, streak, loading, signInWithGoogle, signOut } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalTab, setModalTab] = useState<"stats" | "history" | "account">("stats");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.username || user?.user_metadata?.name || "Joueur";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const openModalWithTab = (tab: "stats" | "history" | "account") => {
    setModalTab(tab);
    setShowDropdown(false);
    setShowProfileModal(true);
  };

  return (
    <>
      <div className="relative flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
        
        {/* Streak Badge Button -> Direct to Stats */}
        <button
          onClick={() => openModalWithTab("stats")}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 transition-colors shadow-sm cursor-pointer ${
            compact ? "hidden lg:flex" : ""
          }`}
          title="Voir vos statistiques et séries"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Série : {streak.current_streak || 0} {streak.current_streak > 1 ? "jours" : "jour"}</span>
        </button>

        {/* User Account / Avatar Button -> Toggles Dropdown Menu */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          </div>
        ) : (
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`relative flex items-center gap-1.5 p-0.5 rounded-full bg-slate-900 border transition-all shadow-sm cursor-pointer group ${
              showDropdown
                ? "border-blue-500 ring-2 ring-blue-500/30"
                : "border-slate-700/80 hover:border-blue-400"
            }`}
            title="Menu profil & statistiques"
            aria-label="Menu profil et statistiques"
            aria-expanded={showDropdown}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-blue-600/30 flex items-center justify-center text-blue-300 font-bold text-xs group-hover:bg-blue-600/40 transition-colors">
                  <User className="w-4 h-4 text-slate-200 group-hover:text-white" />
                </div>
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white mr-1 transition-transform ${showDropdown ? "rotate-180 text-blue-400" : ""}`} />
          </button>
        )}

        {/* ========================================================================= */}
        {/* DROPDOWN MENU (Resulting menu when clicking top-right profile) */}
        {/* ========================================================================= */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header: User identity & streak */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-blue-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate">{displayName}</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {user ? user.email : "Mode Invité (local)"}
                  </span>
                </div>
              </div>

              {/* Streak badge inside dropdown */}
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Série du jour :
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {streak.current_streak || 0} jours
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 text-xs">
              
              {/* Choice 1: Statistiques & Maîtrise */}
              <button
                onClick={() => openModalWithTab("stats")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">Statistiques & Atlas</span>
                    <span className="text-[10px] text-slate-400 block">Performances & bilan</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  Atlas
                </span>
              </button>

              {/* Choice 2: Carte Atlas & Heatmap (Direct Fullscreen Access) */}
              <a
                href="/prototypes/player-atlas-heatmap.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowDropdown(false)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Map className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">Carte Atlas & Heatmap</span>
                    <span className="text-[10px] text-slate-400 block">Maîtrise spatiale en direct</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
              </a>

              {/* Choice 3: Historique */}
              <button
                onClick={() => openModalWithTab("history")}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer group text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <History className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-200 group-hover:text-white">Historique des parties</span>
                  <span className="text-[10px] text-slate-500 block">10 dernières sessions</span>
                </div>
              </button>

              {/* Choice 4: Mon Profil */}
              <button
                onClick={() => openModalWithTab("account")}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer group text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold block text-slate-200 group-hover:text-white">Mon Profil & Pseudo</span>
                  <span className="text-[10px] text-slate-500 block">Gérer son identité</span>
                </div>
              </button>
            </div>

            {/* Footer: Auth Action */}
            <div className="mt-2 pt-2 border-t border-slate-800">
              {user ? (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signInWithGoogle();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Connexion Google (1 clic)</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Profile & Stats Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialTab={modalTab}
      />
    </>
  );
};