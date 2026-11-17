import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/types";

export const dynamic = "force-dynamic";

function formatDistance(distKm: number | null | undefined): string {
  if (distKm === null || distKm === undefined) return "0 km d'écart";
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m d'écart`;
  }
  return `${Math.round(distKm)} km d'écart`;
}

function formatTime(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m${secs.toString().padStart(2, "0")}s`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") || "georings";
  const variant =
    searchParams.get("variant") ||
    (game === "georings" ? "cities" : game === "borderpath" ? "monde" : "villes_france");
  const scope = (searchParams.get("scope") || "daily") as "daily" | "week" | "alltime" | "streaks";
  const scoringMode = (searchParams.get("scoringMode") || "best_run") as "best_run" | "championship";
  const dateParam = searchParams.get("date");

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      gameMode: game as any,
      variant,
      scope: scope as any,
      scoringMode,
      date: new Date().toISOString().split("T")[0],
      totalPlayers: 0,
      entries: [],
      currentUserRank: null,
    });
  }

  // Get current user if logged in
  let currentUserId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id || null;
  } catch (e) {
    // Guest or no session
  }

  // Target date range (UTC)
  const targetDateStr = dateParam || new Date().toISOString().split("T")[0];
  const startOfDay = `${targetDateStr}T00:00:00.000Z`;
  const endOfDay = `${targetDateStr}T23:59:59.999Z`;

  // -------------------------------------------------------------------
  // 1. SCOPE: STREAKS (Séries consécutives)
  // -------------------------------------------------------------------
  if (scope === "streaks") {
    const { data: streakRows, error: streakErr } = await supabase
      .from("user_streaks")
      .select(`
        user_id,
        current_streak,
        best_streak,
        last_played_date,
        profiles!inner (
          id,
          username,
          avatar_url
        )
      `)
      .gt("current_streak", 0)
      .order("current_streak", { ascending: false })
      .order("best_streak", { ascending: false })
      .limit(50);

    if (streakErr || !streakRows) {
      console.error("Streak leaderboard err:", streakErr);
      return NextResponse.json({
        gameMode: game as any,
        variant,
        scope: "streaks",
        scoringMode: "best_run",
        date: targetDateStr,
        totalPlayers: 0,
        entries: [],
        currentUserRank: null,
      });
    }

    const entries: LeaderboardEntry[] = streakRows.map((row: any, idx: number) => {
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const primaryCriterion = `${row.current_streak} j de série`;
      const secondaryCriterion = `Record : ${row.best_streak} j`;
      const tieBreakerCriterion = row.last_played_date ? `Dernier défi : ${row.last_played_date}` : "";
      return {
        rank: idx + 1,
        userId: row.user_id,
        username: prof?.username || "Joueur",
        avatarUrl: prof?.avatar_url || null,
        score: row.current_streak,
        primaryCriterion,
        secondaryCriterion,
        tieBreakerCriterion,
        isTieBroken: false,
        detailText: `🔥 Série : ${row.current_streak} j (record : ${row.best_streak} j)`,
        createdAt: row.last_played_date || targetDateStr,
        isCurrentUser: currentUserId === row.user_id,
      };
    });

    const currentUserEntry = entries.find((e) => e.isCurrentUser);

    return NextResponse.json({
      gameMode: game as any,
      variant,
      scope: "streaks",
      scoringMode: "best_run",
      date: targetDateStr,
      totalPlayers: entries.length,
      entries,
      currentUserRank: currentUserEntry
        ? { rank: currentUserEntry.rank, entry: currentUserEntry }
        : null,
    });
  }

  // -------------------------------------------------------------------
  // 2. SCOPES: DAILY, WEEK, ALLTIME
  // -------------------------------------------------------------------
  let sessionQuery = supabase
    .from("game_sessions")
    .select(`
      id,
      user_id,
      game_mode,
      variant,
      difficulty,
      score,
      max_score,
      rings_completed,
      total_rings,
      accuracy_percent,
      distance_km,
      time_spent_seconds,
      summary_data,
      created_at,
      profiles!inner (
        id,
        username,
        avatar_url
      )
    `)
    .eq("game_mode", game)
    .eq("variant", variant);

  if (scope === "week") {
    // Current ISO week: Monday 00:00:00 UTC to Sunday 23:59:59 UTC
    const refDate = new Date(dateParam || new Date());
    const dayOfWeek = (refDate.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
    const monday = new Date(refDate);
    monday.setUTCDate(refDate.getUTCDate() - dayOfWeek);
    monday.setUTCHours(0, 0, 0, 0);
    const startOfWeek = monday.toISOString();

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);
    const endOfWeek = sunday.toISOString();

    sessionQuery = sessionQuery
      .gte("created_at", startOfWeek)
      .lte("created_at", endOfWeek)
      .order("created_at", { ascending: true });
  } else if (scope === "alltime") {
    // Chronological order to respect first attempt per day
    sessionQuery = sessionQuery
      .order("created_at", { ascending: true })
      .limit(3000);
  } else {
    // Daily: 1 day range
    sessionQuery = sessionQuery
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: true });
  }

  const { data: sessionRows, error: sessionErr } = await sessionQuery;

  if (sessionErr || !sessionRows) {
    console.error("Session leaderboard err:", sessionErr);
    return NextResponse.json({
      gameMode: game as any,
      variant,
      scope,
      scoringMode,
      date: targetDateStr,
      totalPlayers: 0,
      entries: [],
      currentUserRank: null,
    });
  }

  // -------------------------------------------------------------------
  // Deduplication: Official daily run is the 1st attempt per user per day
  // Map of userId -> Map of dateStr (YYYY-MM-DD) -> session
  // -------------------------------------------------------------------
  const userDailyRuns = new Map<string, Map<string, any>>();
  for (const session of sessionRows) {
    const isDaily = session.summary_data?.mode === "daily";
    if (!isDaily) continue;

    const dateKey = session.created_at ? session.created_at.split("T")[0] : targetDateStr;
    if (!userDailyRuns.has(session.user_id)) {
      userDailyRuns.set(session.user_id, new Map());
    }
    const userRuns = userDailyRuns.get(session.user_id)!;
    if (!userRuns.has(dateKey)) {
      userRuns.set(dateKey, session);
    }
  }

  // -------------------------------------------------------------------
  // Comparator for single session ("Meilleur Run")
  // -------------------------------------------------------------------
  function isBetterSession(a: any, b: any, targetGame: string): boolean {
    if (!b) return true;
    if (!a) return false;

    if (targetGame === "georings") {
      // 1. Rings completed DESC
      const ringsA = a.rings_completed ?? a.score ?? 0;
      const ringsB = b.rings_completed ?? b.score ?? 0;
      if (ringsA !== ringsB) return ringsA > ringsB;

      // 2. Tries used ASC
      const triesA = a.summary_data?.totalTriesUsed ?? 15;
      const triesB = b.summary_data?.totalTriesUsed ?? 15;
      if (triesA !== triesB) return triesA < triesB;

      // 3. Time spent ASC (faster is better)
      const timeA = a.time_spent_seconds && a.time_spent_seconds > 0 ? Number(a.time_spent_seconds) : 99999;
      const timeB = b.time_spent_seconds && b.time_spent_seconds > 0 ? Number(b.time_spent_seconds) : 99999;
      if (timeA !== timeB) return timeA < timeB;

      // 4. Earliest finish
      return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
    } else if (targetGame === "borderpath") {
      // 1. Score DESC (completed games first)
      if (b.score !== a.score) return a.score > b.score;

      // 2. Total attempts ASC (fewer attempts = better)
      const attA = a.summary_data?.totalAttempts ?? 999;
      const attB = b.summary_data?.totalAttempts ?? 999;
      if (attA !== attB) return attA < attB;

      // 3. Errors ASC
      const errA = a.summary_data?.errorCount ?? 999;
      const errB = b.summary_data?.errorCount ?? 999;
      if (errA !== errB) return errA < errB;

      // 4. Time spent ASC
      const timeA = a.time_spent_seconds && a.time_spent_seconds > 0 ? Number(a.time_spent_seconds) : 99999;
      const timeB = b.time_spent_seconds && b.time_spent_seconds > 0 ? Number(b.time_spent_seconds) : 99999;
      if (timeA !== timeB) return timeA < timeB;

      // 5. Earliest finish
      return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
    } else {
      // Blind Point:
      // 1. Score DESC
      if (b.score !== a.score) return a.score > b.score;

      // 2. Distance KM ASC (lower distance error is better)
      const distA = a.distance_km ?? 99999;
      const distB = b.distance_km ?? 99999;
      if (distA !== distB) return distA < distB;

      // 3. Time spent ASC
      const timeA = a.time_spent_seconds && a.time_spent_seconds > 0 ? Number(a.time_spent_seconds) : 99999;
      const timeB = b.time_spent_seconds && b.time_spent_seconds > 0 ? Number(b.time_spent_seconds) : 99999;
      if (timeA !== timeB) return timeA < timeB;

      // 4. Earliest finish
      return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
    }
  }

  // -------------------------------------------------------------------
  // Aggregator for Championship Mode
  // -------------------------------------------------------------------
  interface ChampionshipAgg {
    userId: string;
    profile: any;
    challengesCount: number;
    totalScore: number;
    maxScore: number;
    // GeoRings
    totalRings: number;
    totalMaxRings: number;
    totalTries: number;
    // BlindPoint
    totalDistanceKm: number;
    // BorderPath
    totalAttempts: number;
    totalCorridors: number;
    totalErrors: number;
    // Common
    totalTimeSeconds: number;
    hasTimeRecorded: boolean;
    lastCreatedAt: string;
  }

  function isBetterChampionship(a: ChampionshipAgg, b: ChampionshipAgg, targetGame: string): boolean {
    if (targetGame === "georings") {
      // 1. Total rings DESC
      if (a.totalRings !== b.totalRings) return a.totalRings > b.totalRings;
      // 2. Total tries ASC
      if (a.totalTries !== b.totalTries) return a.totalTries < b.totalTries;
      // 3. Total time ASC
      if (a.hasTimeRecorded && b.hasTimeRecorded && a.totalTimeSeconds !== b.totalTimeSeconds) {
        return a.totalTimeSeconds < b.totalTimeSeconds;
      }
      // 4. Challenges count DESC
      if (a.challengesCount !== b.challengesCount) return a.challengesCount > b.challengesCount;
      return new Date(a.lastCreatedAt).getTime() < new Date(b.lastCreatedAt).getTime();
    } else if (targetGame === "borderpath") {
      // 1. Total score DESC
      if (a.totalScore !== b.totalScore) return a.totalScore > b.totalScore;
      // 2. Total attempts ASC
      if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts < b.totalAttempts;
      // 3. Total errors ASC
      if (a.totalErrors !== b.totalErrors) return a.totalErrors < b.totalErrors;
      // 4. Total time ASC
      if (a.hasTimeRecorded && b.hasTimeRecorded && a.totalTimeSeconds !== b.totalTimeSeconds) {
        return a.totalTimeSeconds < b.totalTimeSeconds;
      }
      // 5. Challenges count DESC
      if (a.challengesCount !== b.challengesCount) return a.challengesCount > b.challengesCount;
      return new Date(a.lastCreatedAt).getTime() < new Date(b.lastCreatedAt).getTime();
    } else {
      // Blind Point
      // 1. Total score DESC
      if (a.totalScore !== b.totalScore) return a.totalScore > b.totalScore;
      // 2. Total distance ASC
      if (a.totalDistanceKm !== b.totalDistanceKm) return a.totalDistanceKm < b.totalDistanceKm;
      // 3. Total time ASC
      if (a.hasTimeRecorded && b.hasTimeRecorded && a.totalTimeSeconds !== b.totalTimeSeconds) {
        return a.totalTimeSeconds < b.totalTimeSeconds;
      }
      // 4. Challenges count DESC
      if (a.challengesCount !== b.challengesCount) return a.challengesCount > b.challengesCount;
      return new Date(a.lastCreatedAt).getTime() < new Date(b.lastCreatedAt).getTime();
    }
  }

  let allEntries: LeaderboardEntry[] = [];

  if (scoringMode === "championship") {
    // -----------------------------------------------------------------
    // MODE: CHAMPIONNAT (Cumul de la période sélectionnée)
    // -----------------------------------------------------------------
    const aggs: ChampionshipAgg[] = [];

    userDailyRuns.forEach((runsMap, userId) => {
      const runs = Array.from(runsMap.values());
      if (runs.length === 0) return;

      const firstRow = runs[0];
      const prof = Array.isArray(firstRow.profiles) ? firstRow.profiles[0] : firstRow.profiles;

      let totalScore = 0;
      let maxScore = 0;
      let totalRings = 0;
      let totalMaxRings = 0;
      let totalTries = 0;
      let totalDistanceKm = 0;
      let totalAttempts = 0;
      let totalCorridors = 0;
      let totalErrors = 0;
      let totalTimeSeconds = 0;
      let hasTimeRecorded = false;
      let lastCreatedAt = runs[0].created_at;

      for (const r of runs) {
        totalScore += r.score ?? 0;
        maxScore += r.max_score ?? (game === "georings" ? 5 : game === "borderpath" ? 10000 : 25000);
        totalRings += r.rings_completed ?? r.score ?? 0;
        totalMaxRings += r.total_rings ?? 5;
        totalTries += r.summary_data?.totalTriesUsed ?? 15;
        totalDistanceKm += r.distance_km ? Number(r.distance_km) : 0;
        totalAttempts += r.summary_data?.totalAttempts ?? (r.score > 0 ? 6 : 99);
        totalCorridors += r.summary_data?.corridorCount ?? 0;
        totalErrors += r.summary_data?.errorCount ?? 0;

        if (r.time_spent_seconds && Number(r.time_spent_seconds) > 0) {
          totalTimeSeconds += Number(r.time_spent_seconds);
          hasTimeRecorded = true;
        }

        if (new Date(r.created_at).getTime() > new Date(lastCreatedAt).getTime()) {
          lastCreatedAt = r.created_at;
        }
      }

      aggs.push({
        userId,
        profile: prof,
        challengesCount: runs.length,
        totalScore,
        maxScore,
        totalRings,
        totalMaxRings,
        totalTries,
        totalDistanceKm,
        totalAttempts,
        totalCorridors,
        totalErrors,
        totalTimeSeconds,
        hasTimeRecorded,
        lastCreatedAt,
      });
    });

    aggs.sort((a, b) => (isBetterChampionship(a, b, game) ? -1 : 1));

    allEntries = aggs.map((agg, idx) => {
      let primaryCriterion = "";
      let secondaryCriterion = "";
      let tieBreakerCriterion = "";

      const timeFormatted = agg.hasTimeRecorded ? formatTime(agg.totalTimeSeconds) : "";

      if (game === "georings") {
        primaryCriterion = `${agg.totalRings} ${agg.totalRings > 1 ? "anneaux" : "anneau"}`;
        secondaryCriterion = `${agg.challengesCount} ${agg.challengesCount > 1 ? "défis" : "défi"} • ${agg.totalTries} coups`;
        tieBreakerCriterion = timeFormatted ? `⏱️ ${timeFormatted}` : "";
      } else if (game === "borderpath") {
        primaryCriterion = `${agg.totalScore.toLocaleString("fr-FR")} pts`;
        secondaryCriterion = `${agg.challengesCount} ${agg.challengesCount > 1 ? "défis" : "défi"} • ${agg.totalAttempts} coups`;
        tieBreakerCriterion = [
          agg.totalErrors > 0 ? `${agg.totalErrors} err.` : null,
          timeFormatted ? `⏱️ ${timeFormatted}` : null,
        ]
          .filter(Boolean)
          .join(" • ");
      } else {
        // Blind Point
        primaryCriterion = `${agg.totalScore.toLocaleString("fr-FR")} pts`;
        secondaryCriterion = `${agg.challengesCount} ${agg.challengesCount > 1 ? "défis" : "défi"} • ${formatDistance(agg.totalDistanceKm)}`;
        tieBreakerCriterion = timeFormatted ? `⏱️ ${timeFormatted}` : "";
      }

      const detailText = `${primaryCriterion} • ${secondaryCriterion}${tieBreakerCriterion ? ` • ${tieBreakerCriterion}` : ""}`;

      return {
        rank: idx + 1,
        userId: agg.userId,
        username: agg.profile?.username || "Joueur",
        avatarUrl: agg.profile?.avatar_url || null,
        score: agg.totalScore,
        maxScore: agg.maxScore,
        primaryCriterion,
        secondaryCriterion,
        tieBreakerCriterion,
        isTieBroken: false,
        detailText,
        challengesPlayed: agg.challengesCount,
        timeSpentSeconds: agg.hasTimeRecorded ? agg.totalTimeSeconds : undefined,
        createdAt: agg.lastCreatedAt,
        isCurrentUser: currentUserId === agg.userId,
      };
    });
  } else {
    // -----------------------------------------------------------------
    // MODE: MEILLEUR RUN (Record individuel sur la période sélectionnée)
    // -----------------------------------------------------------------
    const bestUserSessions: any[] = [];

    userDailyRuns.forEach((runsMap) => {
      const runs = Array.from(runsMap.values());
      if (runs.length === 0) return;

      let best = runs[0];
      for (let i = 1; i < runs.length; i++) {
        if (isBetterSession(runs[i], best, game)) {
          best = runs[i];
        }
      }
      bestUserSessions.push(best);
    });

    bestUserSessions.sort((a, b) => (isBetterSession(a, b, game) ? -1 : 1));

    allEntries = bestUserSessions.map((session, idx) => {
      const prof = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
      const timeSec = session.time_spent_seconds ? Number(session.time_spent_seconds) : null;
      const timeFormatted = formatTime(timeSec);

      let primaryCriterion = "";
      let secondaryCriterion = "";
      let tieBreakerCriterion = "";

      if (game === "georings") {
        const rings = session.rings_completed ?? session.score ?? 0;
        const total = session.total_rings ?? 5;
        const tries = session.summary_data?.totalTriesUsed ?? 15;
        primaryCriterion = `${rings}/${total} anneaux`;
        secondaryCriterion = `${tries} coups`;
        tieBreakerCriterion = timeFormatted ? `⏱️ ${timeFormatted}` : "";
      } else if (game === "borderpath") {
        const attempts = session.summary_data?.totalAttempts;
        const corridor = session.summary_data?.corridorCount;
        const errors = session.summary_data?.errorCount ?? 0;
        primaryCriterion = session.score === 0 ? "Abandon" : `${session.score.toLocaleString("fr-FR")} pts`;
        secondaryCriterion = attempts ? `${attempts} coups` : `${corridor || 0} étapes`;
        tieBreakerCriterion = [
          errors > 0 ? `${errors} err.` : null,
          timeFormatted ? `⏱️ ${timeFormatted}` : null,
        ]
          .filter(Boolean)
          .join(" • ");
      } else {
        // Blind Point
        const distKm = session.distance_km;
        primaryCriterion = `${session.score.toLocaleString("fr-FR")} pts`;
        secondaryCriterion = formatDistance(distKm);
        tieBreakerCriterion = timeFormatted ? `⏱️ ${timeFormatted}` : "";
      }

      const detailText = `${primaryCriterion} • ${secondaryCriterion}${tieBreakerCriterion ? ` • ${tieBreakerCriterion}` : ""}`;

      return {
        rank: idx + 1,
        userId: session.user_id,
        username: prof?.username || "Joueur",
        avatarUrl: prof?.avatar_url || null,
        score: session.score,
        maxScore: session.max_score ?? (game === "georings" ? 5 : game === "borderpath" ? 10000 : 25000),
        primaryCriterion,
        secondaryCriterion,
        tieBreakerCriterion,
        isTieBroken: false,
        detailText,
        accuracyPercent: session.accuracy_percent ? Number(session.accuracy_percent) : undefined,
        timeSpentSeconds: timeSec || undefined,
        createdAt: session.created_at,
        isCurrentUser: currentUserId === session.user_id,
      };
    });
  }

  // -------------------------------------------------------------------
  // Tie-breaker detection across all entries:
  // If entry i shares identical primary and secondary criteria with
  // its neighbor (rank above or below), mark as tied and tie-broken by C3
  // -------------------------------------------------------------------
  for (let i = 0; i < allEntries.length; i++) {
    const current = allEntries[i];
    const prev = allEntries[i - 1];
    const next = allEntries[i + 1];

    const tiedWithPrev =
      prev &&
      prev.primaryCriterion === current.primaryCriterion &&
      prev.secondaryCriterion === current.secondaryCriterion;

    const tiedWithNext =
      next &&
      next.primaryCriterion === current.primaryCriterion &&
      next.secondaryCriterion === current.secondaryCriterion;

    if (tiedWithPrev || tiedWithNext) {
      current.isTieBroken = true;
      if (!current.tieBreakerCriterion) {
        current.tieBreakerCriterion = "Date d'obtention";
      }
    }
  }

  const currentUserEntry = allEntries.find((e) => e.isCurrentUser);

  return NextResponse.json({
    gameMode: game as any,
    variant,
    scope,
    scoringMode,
    date: targetDateStr,
    totalPlayers: allEntries.length,
    entries: allEntries.slice(0, 50),
    currentUserRank: currentUserEntry
      ? { rank: currentUserEntry.rank, entry: currentUserEntry }
      : null,
  });
}
