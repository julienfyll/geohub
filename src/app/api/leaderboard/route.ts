import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") || "georings";
  const variant =
    searchParams.get("variant") ||
    (game === "georings" ? "cities" : game === "borderpath" ? "monde" : "villes_france");
  const difficulty = searchParams.get("difficulty") || (game === "georings" ? "fr" : "moyen");
  const scope = searchParams.get("scope") || "daily";
  const dateParam = searchParams.get("date");

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      gameMode: game as any,
      variant,
      scope: scope as any,
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
        date: targetDateStr,
        totalPlayers: 0,
        entries: [],
        currentUserRank: null,
      });
    }

    const entries: LeaderboardEntry[] = streakRows.map((row: any, idx: number) => {
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        rank: idx + 1,
        userId: row.user_id,
        username: prof?.username || "Joueur",
        avatarUrl: prof?.avatar_url || null,
        score: row.current_streak,
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
      .order("created_at", { ascending: false });
  } else if (scope === "alltime") {
    // All-time: fetch highest-scoring sessions (limit 1000)
    sessionQuery = sessionQuery
      .order("score", { ascending: false })
      .limit(1000);
  } else {
    // Daily: 1 day range, chronological to pick 1st official attempt
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
      scope: scope as any,
      date: targetDateStr,
      totalPlayers: 0,
      entries: [],
      currentUserRank: null,
    });
  }

  // Helper comparator: returns true if candidate is better than currentBest
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
      const timeA = a.time_spent_seconds ?? 99999;
      const timeB = b.time_spent_seconds ?? 99999;
      if (timeA !== timeB) return timeA < timeB;

      // 4. Earliest finish
      return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
    } else if (targetGame === "borderpath") {
      // 1. Score DESC (won/completed games first)
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
      const timeA = a.time_spent_seconds ?? 99999;
      const timeB = b.time_spent_seconds ?? 99999;
      if (timeA !== timeB) return timeA < timeB;

      // 5. Earliest finish
      return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
    } else {
      // Blind Point:
      // 1. Score DESC (out of 25000)
      if (b.score !== a.score) return a.score > b.score;

      // 2. Distance KM ASC (lower distance error is better)
      const distA = a.distance_km ?? 99999;
      const distB = b.distance_km ?? 99999;
      if (distA !== distB) return distA < distB;

      // 3. Time spent ASC
      const timeA = a.time_spent_seconds ?? 99999;
      const timeB = b.time_spent_seconds ?? 99999;
      if (timeA !== timeB) return timeA < timeB;

      // 4. Earliest finish
      return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
    }
  }

  // Filter for daily mode sessions
  // For daily: pick 1st official attempt
  // For week and alltime: pick best performance per user
  const userFilteredSessions = new Map<string, any>();
  for (const session of sessionRows) {
    const isDaily = session.summary_data?.mode === "daily";
    if (!isDaily) continue;

    if (scope === "daily") {
      if (!userFilteredSessions.has(session.user_id)) {
        userFilteredSessions.set(session.user_id, session);
      }
    } else {
      // week or alltime: keep the user's best session
      const existing = userFilteredSessions.get(session.user_id);
      if (!existing || isBetterSession(session, existing, game)) {
        userFilteredSessions.set(session.user_id, session);
      }
    }
  }

  const uniqueSessions = Array.from(userFilteredSessions.values());

  // Sort ranked entries
  uniqueSessions.sort((a, b) => (isBetterSession(a, b, game) ? -1 : 1));

  const allEntries: LeaderboardEntry[] = uniqueSessions.map((session, idx) => {
    const prof = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
    let detail = "";
    const timeSec = session.time_spent_seconds;
    const timeStr = timeSec && timeSec > 0
      ? ` • ${Math.floor(timeSec / 60)}m${(timeSec % 60).toString().padStart(2, "0")}s`
      : "";

    if (game === "georings") {
      const rings = session.rings_completed ?? session.score ?? 0;
      const total = session.total_rings ?? 5;
      const tries = session.summary_data?.totalTriesUsed;
      detail = tries
        ? `${rings}/${total} anneaux (${tries} coups${timeStr})`
        : `${rings}/${total} anneaux${timeStr}`;
    } else if (game === "borderpath") {
      const attempts = session.summary_data?.totalAttempts;
      const corridor = session.summary_data?.corridorCount;
      const errors = session.summary_data?.errorCount;
      if (session.score === 0) {
        detail = "Abandon";
      } else if (attempts) {
        detail = `${attempts} coups${corridor ? ` • ${corridor} ét.` : ""}${errors > 0 ? ` (${errors} err.)` : ""}${timeStr}`;
      } else {
        detail = `${session.score} pts${timeStr}`;
      }
    } else {
      const distKm = session.distance_km;
      detail = distKm !== null && distKm !== undefined
        ? distKm < 1
          ? `${Math.round(distKm * 1000)} m d'écart${timeStr}`
          : `${Math.round(distKm)} km d'écart${timeStr}`
        : `${session.score} pts${timeStr}`;
    }

    return {
      rank: idx + 1,
      userId: session.user_id,
      username: prof?.username || "Joueur",
      avatarUrl: prof?.avatar_url || null,
      score: session.score,
      maxScore: session.max_score ?? (game === "georings" ? 5 : game === "borderpath" ? 10000 : 25000),
      detailText: detail,
      accuracyPercent: session.accuracy_percent ? Number(session.accuracy_percent) : undefined,
      timeSpentSeconds: session.time_spent_seconds ? Number(session.time_spent_seconds) : undefined,
      createdAt: session.created_at,
      isCurrentUser: currentUserId === session.user_id,
    };
  });

  const currentUserEntry = allEntries.find((e) => e.isCurrentUser);

  return NextResponse.json({
    gameMode: game as any,
    variant,
    scope: scope as any,
    date: targetDateStr,
    totalPlayers: allEntries.length,
    entries: allEntries.slice(0, 50),
    currentUserRank: currentUserEntry
      ? { rank: currentUserEntry.rank, entry: currentUserEntry }
      : null,
  });
}
