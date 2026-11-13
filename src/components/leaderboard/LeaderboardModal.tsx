"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Trophy,
  X,
  Compass,
  MapPin,
  Flame,
  Calendar,
  Medal,
  ChevronRight,
  Loader2,
  Users,
  Plane,
  Target,
  Sparkles,
  Layers,
} from "lucide-react";
import { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/types";
import { useAuth } from "@/lib/auth/AuthContext";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: "georings" | "blindpoint" | "borderpath";
  initialVariant?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  initialGame = "georings",
  initialVariant,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"georings" | "blindpoint" | "borderpath" | "streaks">(initialGame);
  const [activeVariant, setActiveVariant] = useState<string>(
    initialVariant || (initialGame === "georings" ? "cities" : initialGame === "borderpath" ? "monde" : "villes_france")
  );
  const [dateOffset, setDateOffset] = useState<0 | 1>(0); // 0 = today, 1 = yesterday
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialGame) setActiveTab(initialGame);
      if (initialVariant) setActiveVariant(initialVariant);
    }
  }, [isOpen, initialGame, initialVariant]);

  // Handle activeVariant default when activeTab switches
  useEffect(() => {
    if (activeTab === "georings" && !["cities", "airports"].includes(activeVariant)) {
      setActiveVariant("cities");
    } else if (
      activeTab === "blindpoint" &&
      !["villes_france", "villes_europe", "villes_monde", "lieux_paris", "lieux_monde"].includes(activeVariant)
    ) {
      setActiveVariant("villes_france");
    } else if (
      activeTab === "borderpath" &&
      !["monde", "europe", "france_departements", "ameriques", "afrique"].includes(activeVariant)
    ) {
      setActiveVariant("monde");
    }
  }, [activeTab, activeVariant]);

  const handleTabChange = (tab: "georings" | "blindpoint" | "borderpath" | "streaks") => {
    setActiveTab(tab);
    if (tab === "georings") {
      setActiveVariant("cities");
    } else if (tab === "blindpoint") {
      setActiveVariant("villes_france");
    } else if (tab === "borderpath") {
      setActiveVariant("monde");
    }
  };

  // Fetch leaderboard data
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    const targetDate = new Date();
    if (dateOffset === 1) {
      targetDate.setDate(targetDate.getDate() - 1);
    }
    const dateStr = targetDate.toISOString().split("T")[0];

    const scope = activeTab === "streaks" ? "streaks" : "daily";
    const game = activeTab === "streaks" ? "georings" : activeTab;
    const url = `/api/leaderboard?game=${game}&variant=${activeVariant}&scope=${scope}&date=${dateStr}`;

    fetch(url)
      .then((res) => res.json())
      .then((json: LeaderboardResponse) => {
        setData(json);
      })
      .catch((err) => {
        console.error("Leaderboard fetch error:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, activeTab, activeVariant, dateOffset]);

  if (!isOpen || !mounted) return null;

  const entries = data?.entries || [];
  const top3 = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  const accentText =
    activeTab === "blindpoint"
      ? "text-emerald-400"
      : activeTab === "borderpath"
      ? "text-indigo-400"
      : activeTab === "streaks"
      ? "text-amber-400"
      : "text-blue-400";

  const userRowBg =
    activeTab === "blindpoint"
      ? "bg-emerald-600/20 border-emerald-500/50 shadow-sm"
      : activeTab === "borderpath"
      ? "bg-indigo-600/20 border-indigo-500/50 shadow-sm"
      : activeTab === "streaks"
      ? "bg-amber-600/20 border-amber-500/50 shadow-sm"
      : "bg-blue-600/20 border-blue-500/50 shadow-sm";

  const userBadgeBg =
    activeTab === "blindpoint"
      ? "bg-emerald-600"
      : activeTab === "borderpath"
      ? "bg-indigo-600"
      : activeTab === "streaks"
      ? "bg-amber-600"
      : "bg-blue-600";

  const userTextColor =
    activeTab === "blindpoint"
      ? "text-emerald-300 font-bold"
      : activeTab === "borderpath"
      ? "text-indigo-300 font-bold"
      : activeTab === "streaks"
      ? "text-amber-300 font-bold"
      : "text-blue-300 font-bold";

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md flex items-center justify-center min-h-screen animate-fade-in">
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Classements Officiels
              </h3>
              <p className="text-xs text-slate-400">
                Comparez vos performances avec les joueurs de GeoHub
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Tabs (Game Mode) */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-800/60 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleTabChange("georings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "georings"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>GeoRings</span>
            </button>

            <button
              onClick={() => handleTabChange("blindpoint")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "blindpoint"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Blind Point</span>
            </button>

            <button
              onClick={() => handleTabChange("borderpath")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "borderpath"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>BorderPath</span>
            </button>

            <button
              onClick={() => handleTabChange("streaks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "streaks"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Séries Records</span>
            </button>
          </div>

          {/* Date Toggle (Today / Yesterday) */}
          {activeTab !== "streaks" && (
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDateOffset(0)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  dateOffset === 0
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setDateOffset(1)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  dateOffset === 1
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Hier
              </button>
            </div>
          )}
        </div>

        {/* Secondary Variant Filters */}
        {activeTab !== "streaks" && (
          <div className="px-5 py-2.5 bg-slate-950/20 border-b border-slate-800/40 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Déclinaison :
            </span>

            {activeTab === "georings" ? (
              <>
                <button
                  onClick={() => setActiveVariant("cities")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "cities"
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Villes (Population)</span>
                </button>
                <button
                  onClick={() => setActiveVariant("airports")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "airports"
                      ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Aéroports (Passagers)</span>
                </button>
              </>
            ) : activeTab === "borderpath" ? (
              <>
                <button
                  onClick={() => setActiveVariant("monde")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "monde"
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🌍 Monde
                </button>
                <button
                  onClick={() => setActiveVariant("europe")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "europe"
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🇪🇺 Europe
                </button>
                <button
                  onClick={() => setActiveVariant("france_departements")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "france_departements"
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🇫🇷 96 Dépts
                </button>
                <button
                  onClick={() => setActiveVariant("ameriques")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "ameriques"
                      ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🌎 Amériques
                </button>
                <button
                  onClick={() => setActiveVariant("afrique")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "afrique"
                      ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🌍 Afrique
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveVariant("villes_france")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "villes_france"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🇫🇷 Villes
                </button>
                <button
                  onClick={() => setActiveVariant("villes_europe")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "villes_europe"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🇪🇺 Europe
                </button>
                <button
                  onClick={() => setActiveVariant("villes_monde")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "villes_monde"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🌍 Monde
                </button>
                <button
                  onClick={() => setActiveVariant("lieux_paris")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "lieux_paris"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🗼 Paris
                </button>
                <button
                  onClick={() => setActiveVariant("lieux_monde")}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                    activeVariant === "lieux_monde"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      : "border-transparent bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  🏛️ Merveilles
                </button>
              </>
            )}
          </div>
        )}

        {/* List Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-semibold">Chargement du classement...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-slate-800">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-slate-300">Aucune partie enregistrée</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Soyez le premier à relever ce défi quotidien et prenez la tête du classement !
              </p>
            </div>
          ) : (
            <>
              {/* Podium for Top 3 */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 pb-3">
                {/* 2nd Place */}
                {top3[1] && (
                  <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col items-center text-center justify-end">
                    <span className="text-xl select-none mb-1">🥈</span>
                    <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-400 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                      {top3[1].avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={top3[1].avatarUrl} alt={top3[1].username} className="w-full h-full object-cover" />
                      ) : (
                        top3[1].username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-bold text-white mt-1.5 truncate max-w-full">
                      {top3[1].username}
                    </span>
                    <span className={`text-[11px] font-extrabold ${accentText} mt-0.5`}>
                      {top3[1].detailText}
                    </span>
                  </div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-800/80 border-2 border-amber-500/50 flex flex-col items-center text-center justify-end shadow-lg shadow-amber-500/10">
                    <span className="text-2xl select-none mb-1">🥇</span>
                    <div className="w-12 h-12 rounded-full bg-amber-600 border-2 border-amber-300 overflow-hidden flex items-center justify-center font-bold text-sm text-white shadow-md">
                      {top3[0].avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={top3[0].avatarUrl} alt={top3[0].username} className="w-full h-full object-cover" />
                      ) : (
                        top3[0].username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-amber-200 mt-1.5 truncate max-w-full">
                      {top3[0].username}
                    </span>
                    <span className="text-xs font-black text-amber-400 mt-0.5">
                      {top3[0].detailText}
                    </span>
                  </div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col items-center text-center justify-end">
                    <span className="text-xl select-none mb-1">🥉</span>
                    <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-amber-700 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                      {top3[2].avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={top3[2].avatarUrl} alt={top3[2].username} className="w-full h-full object-cover" />
                      ) : (
                        top3[2].username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-bold text-white mt-1.5 truncate max-w-full">
                      {top3[2].username}
                    </span>
                    <span className={`text-[11px] font-extrabold ${accentText} mt-0.5`}>
                      {top3[2].detailText}
                    </span>
                  </div>
                )}
              </div>

              {/* Ranks 4 to 50 */}
              {restEntries.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    Suite du classement ({entries.length} participants)
                  </span>

                  {restEntries.map((entry) => (
                    <div
                      key={entry.userId + entry.rank}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                        entry.isCurrentUser
                          ? userRowBg
                          : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-400 w-6 text-center">
                          #{entry.rank}
                        </span>

                        <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {entry.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                          ) : (
                            entry.username.charAt(0).toUpperCase()
                          )}
                        </div>

                        <span className={`font-semibold truncate max-w-[140px] sm:max-w-[200px] ${entry.isCurrentUser ? userTextColor : "text-white"}`}>
                          {entry.username} {entry.isCurrentUser && "(Vous)"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`font-bold ${accentText} font-mono`}>
                          {entry.detailText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Current User Rank Bottom Footer */}
        {data?.currentUserRank && (
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md ${userBadgeBg} text-white font-mono font-bold text-xs`}>
                #{data.currentUserRank.rank}
              </span>
              <span className="text-slate-300">
                Votre classement du jour ({data.currentUserRank.entry.username})
              </span>
            </div>
            <span className={`font-mono ${accentText} font-bold`}>
              {data.currentUserRank.entry.detailText}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
