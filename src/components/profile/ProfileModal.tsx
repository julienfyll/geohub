"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  Edit2,
  Check,
  Flame,
  Trophy,
  Gamepad2,
  Calendar,
  Compass,
  Plane,
  Target,
  LogOut,
  AlertCircle,
  Loader2,
  Map,
  BarChart3,
  History,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getAggregatedStats } from "@/lib/stats/statsService";
import { UserSummaryStats } from "@/lib/stats/types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "stats" | "history" | "account";
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = "stats",
}) => {
  const { user, profile, streak, signOut, updateUsername } = useAuth();
  const [stats, setStats] = useState<UserSummaryStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "history" | "account">(initialTab);
  const [statsModeFilter, setStatsModeFilter] = useState<"all" | "georings" | "blindpoint">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Edit username state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingStats(true);
      getAggregatedStats(user?.id)
        .then((s) => setStats(s))
        .finally(() => setLoadingStats(false));

      if (profile?.username) {
        setNewUsername(profile.username);
      }
    }
  }, [isOpen, user?.id, profile?.username]);

  if (!isOpen || !mounted) return null;

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;
    setIsSavingUsername(true);
    setUsernameError(null);

    const res = await updateUsername(newUsername);
    setIsSavingUsername(false);

    if (res.success) {
      setIsEditingUsername(false);
    } else {
      setUsernameError(res.error || "Impossible de mettre à jour le pseudo.");
    }
  };

  const displayName = profile?.username || user?.user_metadata?.name || "Joueur";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 bg-slate-950/85 backdrop-blur-md flex items-center justify-center min-h-screen animate-fade-in">
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg border border-blue-400/30 shadow-lg shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-blue-200" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{displayName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {user ? "Connecté" : "Invité"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {user ? user.email : "Sauvegardes locales (Mode invité)"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-2 border-b border-slate-800 bg-slate-950/25 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistiques & Atlas</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique ({stats?.recentSessions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "account"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mon Profil</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* ========================================================================= */}
          {/* TAB 1: STATISTIQUES & ACCÈS CARTE ATLAS */}
          {/* ========================================================================= */}
          {activeTab === "stats" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Hero Card: Accès Carte Atlas & Heatmap */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider border border-blue-400/30">
                      🗺️ Carte Interactive
                    </span>
                    <span className="text-xs text-slate-400">152 points mondiaux</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">Atlas & Maîtrise Géographique</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Visualise l'ensemble de tes parties sur le globe : zones de chaleur, taux de réussite par région (France, Europe, Monde) et historique détaillé.
                  </p>
                </div>

                <a
                  href="/prototypes/player-atlas-heatmap.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all shrink-0 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explorer ma Carte</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Mode Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs shadow-inner">
                  <button
                    type="button"
                    onClick={() => setStatsModeFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                      statsModeFilter === "all"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Tous les modes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsModeFilter("georings")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                      statsModeFilter === "georings"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    GeoRings
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsModeFilter("blindpoint")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                      statsModeFilter === "blindpoint"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Blind Point
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  {statsModeFilter === "all" && "Vue agrégée (tous jeux)"}
                  {statsModeFilter === "georings" && "Mode GeoRings uniquement"}
                  {statsModeFilter === "blindpoint" && "Mode Blind Point uniquement"}
                </span>
              </div>

              {/* Stats Summary Cards (Strictly filtered by selected mode) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {statsModeFilter === "all" && (
                  <>
                    {/* Total Games */}
                    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5 text-blue-400" /> Parties
                      </span>
                      <span className="text-2xl font-black text-white mt-1.5">
                        {loadingStats ? "..." : stats?.totalGames ?? 0}
                      </span>
                    </div>

                    {/* Current Streak */}
                    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Série
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-2xl font-black text-amber-400">
                          {streak.current_streak || 0}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          (max {streak.best_streak || 0})
                        </span>
                      </div>
                    </div>

                    {/* Perfects / Masteries */}
                    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Victoires
                      </span>
                      <span className="text-2xl font-black text-emerald-400 mt-1.5">
                        {loadingStats ? "..." : stats?.perfectGames ?? 0}
                      </span>
                    </div>

                    {/* Average Score */}
                    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-indigo-400" /> Score moy.
                      </span>
                      <span className="text-2xl font-black text-indigo-300 mt-1.5">
                        {loadingStats ? "..." : stats?.averageScore ?? 0}
                      </span>
                    </div>
                  </>
                )}

                {statsModeFilter === "georings" && (
                  <>
                    {/* GeoRings Games */}
                    <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-400" /> Parties Rings
                      </span>
                      <span className="text-2xl font-black text-white mt-1.5">
                        {loadingStats ? "..." : stats?.georingsGames ?? 0}
                      </span>
                    </div>

                    {/* Tries average */}
                    <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Essais moy.
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-2xl font-black text-emerald-400">1.4</span>
                        <span className="text-xs text-slate-400 font-semibold">/ anneau</span>
                      </div>
                    </div>

                    {/* Rings Won */}
                    <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" /> Anneaux max
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-2xl font-black text-amber-300">5 / 5</span>
                        <span className="text-xs text-slate-400 font-semibold">(100%)</span>
                      </div>
                    </div>

                    {/* 1st Try Success */}
                    <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-blue-400" /> 1er coup
                      </span>
                      <span className="text-2xl font-black text-blue-300 mt-1.5">
                        {loadingStats ? "..." : stats?.perfectGames ?? 0} victoires
                      </span>
                    </div>
                  </>
                )}

                {statsModeFilter === "blindpoint" && (
                  <>
                    {/* Blind Point Games */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400" /> Parties Blind
                      </span>
                      <span className="text-2xl font-black text-white mt-1.5">
                        {loadingStats ? "..." : stats?.blindpointGames ?? 0}
                      </span>
                    </div>

                    {/* Average Distance */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                        <Map className="w-3.5 h-3.5 text-blue-400" /> Écart moyen
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-2xl font-black text-blue-300">24</span>
                        <span className="text-xs text-slate-400 font-semibold">km</span>
                      </div>
                    </div>

                    {/* Precision % */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Précision
                      </span>
                      <span className="text-2xl font-black text-emerald-400 mt-1.5">
                        86.4 %
                      </span>
                    </div>

                    {/* Average Score */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Score moy.
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-2xl font-black text-amber-300">
                          {loadingStats ? "..." : stats?.averageScore ?? 4520}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">/ 5000</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mode Breakdown (Strictly displays ONLY selected mode when filtered) */}
              <div className="bg-slate-800/30 border border-slate-800/70 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {statsModeFilter === "all" && "Performances par Jeu"}
                    {statsModeFilter === "georings" && "Détail Performance GeoRings"}
                    {statsModeFilter === "blindpoint" && "Détail Performance Blind Point"}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {statsModeFilter === "georings" && "Métriques d'essais & d'anneaux"}
                    {statsModeFilter === "blindpoint" && "Métriques de distance & précision"}
                  </span>
                </div>

                <div className={`grid gap-3 text-sm ${statsModeFilter === "all" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {/* GeoRings Block */}
                  {(statsModeFilter === "all" || statsModeFilter === "georings") && (
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-200 font-bold text-xs">
                          <Compass className="w-4 h-4 text-blue-400" /> GeoRings
                        </span>
                        <span className="font-bold text-blue-300 text-xs">{stats?.georingsGames ?? 0} parties</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                        <div className="flex flex-col">
                          <span className="text-slate-400">Anneaux réussis</span>
                          <span className="font-mono font-bold text-blue-300 text-sm">5 / 5 max</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">Moyenne d'essais</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">1.4 / anneau</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/40">
                        <span>Taux de réussite : <strong className="text-emerald-400">92 %</strong></span>
                        <span>Résolu au 1er essai : <strong className="text-blue-300">76 %</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Blind Point Block */}
                  {(statsModeFilter === "all" || statsModeFilter === "blindpoint") && (
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-200 font-bold text-xs">
                          <Target className="w-4 h-4 text-emerald-400" /> Blind Point
                        </span>
                        <span className="font-bold text-emerald-300 text-xs">{stats?.blindpointGames ?? 0} parties</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                        <div className="flex flex-col">
                          <span className="text-slate-400">Précision moyenne</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">86.4 %</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">Écart moyen</span>
                          <span className="font-mono font-bold text-blue-300 text-sm">24 km</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/40">
                        <span>Score moyen : <strong className="text-amber-400">4 520 / 5 000</strong></span>
                        <span>Moins de 10 km : <strong className="text-emerald-400">68 %</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Territorial Mastery Quick Overview */}
              <div className="bg-slate-800/30 border border-slate-800/70 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {statsModeFilter === "all" && "Couverture du Territoire"}
                    {statsModeFilter === "georings" && "Maîtrise Territoriale Rings (Anneaux)"}
                    {statsModeFilter === "blindpoint" && "Précision Territoriale Blind (Distance)"}
                  </h4>
                  <a
                    href="/prototypes/player-atlas-heatmap.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Voir sur la carte →
                  </a>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-slate-300">🇫🇷 France Métropolitaine</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {statsModeFilter === "all" && "12 / 13 régions (92%)"}
                        {statsModeFilter === "georings" && "1.2 essai / anneau (94% réussis)"}
                        {statsModeFilter === "blindpoint" && "18 km d'écart moyen"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-slate-300">🇪🇺 Europe</span>
                      <span className="text-blue-400 font-mono font-bold">
                        {statsModeFilter === "all" && "18 pays explorés (81%)"}
                        {statsModeFilter === "georings" && "1.8 essai / anneau (84% réussis)"}
                        {statsModeFilter === "blindpoint" && "42 km d'écart moyen"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "81%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: HISTORIQUE RÉCENT */}
          {/* ========================================================================= */}
          {activeTab === "history" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Dernières parties jouées
              </h4>

              {loadingStats ? (
                <div className="py-8 flex justify-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : !stats?.recentSessions || stats.recentSessions.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-sm">
                  Aucune partie enregistrée pour le moment. Lance une partie pour commencer ton historique !
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentSessions.map((session, idx) => {
                    const isRings = session.game_mode === "georings";
                    const isAirports = session.variant === "airports";
                    const dateStr = session.created_at
                      ? new Intl.DateTimeFormat("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(session.created_at))
                      : "Récemment";

                    return (
                      <div
                        key={session.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isRings
                                ? isAirports
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {isRings ? (
                              isAirports ? (
                                <Plane className="w-4 h-4" />
                              ) : (
                                <Compass className="w-4 h-4" />
                              )
                            ) : (
                              <Target className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {isRings
                                  ? isAirports
                                    ? "GeoRings (Aéroports)"
                                    : "GeoRings (Villes)"
                                  : "Blind Point"}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300">
                                {session.difficulty}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> {dateStr}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-blue-400 block font-mono">
                            {isRings && session.rings_completed !== null && session.total_rings !== null
                              ? `${session.rings_completed}/${session.total_rings} anneaux`
                              : `${session.score} pts`}
                          </span>
                          {session.accuracy_percent !== null && session.accuracy_percent !== undefined && (
                            <span className="text-[11px] text-slate-400">
                              {Math.round(Number(session.accuracy_percent))}% précision
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MON PROFIL & COMPTE */}
          {/* ========================================================================= */}
          {activeTab === "account" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Identité du Joueur
                </span>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-semibold block">Pseudo public :</label>
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="px-3 py-1.5 text-sm bg-slate-800 border border-blue-500 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                        placeholder="Nouveau pseudo"
                        maxLength={25}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {isSavingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Valider</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(profile?.username || "");
                          setUsernameError(null);
                        }}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-sm font-bold text-white">{displayName}</span>
                      {user && (
                        <button
                          onClick={() => setIsEditingUsername(true)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Modifier
                        </button>
                      )}
                    </div>
                  )}

                  {usernameError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {usernameError}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-xs text-slate-400 block">Adresse e-mail :</span>
                  <span className="text-xs font-mono text-slate-300 block mt-0.5">
                    {user ? user.email : "Non renseigné (Compte invité)"}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {user && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Compte synchronisé avec Google
            </span>
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};