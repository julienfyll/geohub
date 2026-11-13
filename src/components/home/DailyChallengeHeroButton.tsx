"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { useDailyChallenges } from "@/lib/stats/useDailyChallenges";

const ALL_DAILY_KEYS = [
  "georings_population_fr",
  "georings_population_eu",
  "georings_population_world",
  "georings_airports_fr",
  "georings_airports_world",
  "blindpoint_villes_france",
  "blindpoint_villes_europe",
  "blindpoint_villes_monde",
  "blindpoint_lieux_paris",
  "blindpoint_lieux_monde",
];

export const DailyChallengeHeroButton: React.FC = () => {
  const { statusMap, loading } = useDailyChallenges();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown to 00:00 UTC
  useEffect(() => {
    const updateTime = () => {
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
      setCountdown(`${hours}h ${String(mins).padStart(2, "0")}m`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Compute completed count
  const completedCount = ALL_DAILY_KEYS.reduce((acc, key) => {
    return statusMap[key]?.completed ? acc + 1 : acc;
  }, 0);

  const totalCount = ALL_DAILY_KEYS.length;
  const isAllDone = completedCount === totalCount;
  const hasStarted = completedCount > 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
      <Link
        href="/play/daily-challenge"
        className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-950/15 text-slate-950">
          <Trophy className="w-4 h-4 fill-slate-950" />
        </span>

        <span className="tracking-tight">Accéder aux Défis du Jour</span>

        {/* Dynamic status pill */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/20 text-slate-950 font-mono text-xs font-black">
          {!mounted || loading ? (
            <span className="w-8 h-3 bg-slate-950/30 rounded animate-pulse" />
          ) : isAllDone ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950 stroke-[3]" />
              <span>10/10 Fait</span>
            </>
          ) : (
            <span>
              {completedCount} / {totalCount} faits
            </span>
          )}
        </span>

        <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Reset Timer Badge */}
      {countdown && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-400">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Reset dans <strong className="text-amber-300 font-mono font-bold">{countdown}</strong>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">(00:00 UTC)</span>
        </div>
      )}
    </div>
  );
};
