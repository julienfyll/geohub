"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getAggregatedStats } from "@/lib/stats/statsService";
import { UserSummaryStats } from "@/lib/stats/types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, streak, signOut, updateUsername } = useAuth();
  const [stats, setStats] = useState<UserSummaryStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl border border-blue-400/30 shadow-lg">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-blue-200" />
              )}
            </div>

            <div>
              {/* Username edit row */}
              {isEditingUsername ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="px-2.5 py-1 text-sm bg-slate-800 border border-blue-500 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Nouveau pseudo"
                    maxLength={25}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={isSavingUsername}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                    title="Valider"
                  >
                    {isSavingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUsername(false);
                      setNewUsername(profile?.username || "");
                      setUsernameError(null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{displayName}</h3>
                  {user && (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="p-1 rounded-md text-slate-500 hover:text-blue-400 hover:bg-slate-800/80 transition-colors"
                      title="Modifier le pseudo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {usernameError && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {usernameError}
                </p>
              )}

              <p className="text-xs text-slate-400 mt-0.5">
                {user ? user.email : "Mode Invité (sauvegardes locales)"}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Games */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-blue-400" /> Parties
              </span>
              <span className="text-2xl font-black text-white mt-2">
                {loadingStats ? "..." : stats?.totalGames ?? 0}
              </span>
            </div>

            {/* Current Streak */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Série
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-amber-400">
                  {streak.current_streak || 0}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (max {streak.best_streak || 0})
                </span>
              </div>
            </div>

            {/* Perfects / Masteries */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Victoires
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-2">
                {loadingStats ? "..." : stats?.perfectGames ?? 0}
              </span>
            </div>

            {/* Average Score */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" /> Score moy.
              </span>
              <span className="text-2xl font-black text-indigo-300 mt-2">
                {loadingStats ? "..." : stats?.averageScore ?? 0}
              </span>
            </div>
          </div>

          {/* Mode Breakdown */}
          <div className="bg-slate-800/30 border border-slate-800/70 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Activité par jeu
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <Compass className="w-4 h-4 text-blue-400" /> GeoRings
                </span>
                <span className="font-bold text-white">{stats?.georingsGames ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <Target className="w-4 h-4 text-emerald-400" /> Blind Point
                </span>
                <span className="font-bold text-white">{stats?.blindpointGames ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Games List */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Historique récent
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
                        <span className="text-sm font-extrabold text-blue-400 block">
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
        </div>

        {/* Footer */}
        {user && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Compte lié à Google
            </span>
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
