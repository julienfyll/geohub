import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") || "georings";
  const variant = searchParams.get("variant") || (game === "georings" ? "cities" : "villes_france");
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
  // 2. SCOPE: DAILY CHALLENGE (Défi du jour)
  // -------------------------------------------------------------------
  const { data: sessionRows, error: sessionErr } = await supabase
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
    .eq("variant", variant)
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .order("created_at", { ascending: true }); // chronological to take 1st attempt

  if (sessionErr || !sessionRows) {
    console.error("Session leaderboard err:", sessionErr);
    return NextResponse.json({
      gameMode: game as any,
      variant,
      scope: "daily",
      date: targetDateStr,
      totalPlayers: 0,
      entries: [],
      currentUserRank: null,
    });
  }

  // Filter for daily mode and keep ONLY the 1st attempt per user for fairness
  const userFirstAttempts = new Map<string, any>();
  for (const session of sessionRows) {
    const isDaily = session.summary_data?.mode === "daily";
    if (!isDaily) continue;

    if (!userFirstAttempts.has(session.user_id)) {
      userFirstAttempts.set(session.user_id, session);
    }
  }

  const uniqueSessions = Array.from(userFirstAttempts.values());

  // Sort logic
  uniqueSessions.sort((a, b) => {
    if (game === "georings") {
      // 1. Rings completed DESC
      const ringsA = a.rings_completed ?? a.score ?? 0;
      const ringsB = b.rings_completed ?? b.score ?? 0;
      if (ringsB !== ringsA) return ringsB - ringsA;

      // 2. Tries used ASC (if stored in summary)
      const triesA = a.summary_data?.totalTriesUsed ?? 15;
      const triesB = b.summary_data?.totalTriesUsed ?? 15;
      if (triesA !== triesB) return triesA - triesB;

      // 3. Earliest finish
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      // Blind Point:
      // 1. Score DESC (out of 25000)
      if (b.score !== a.score) return b.score - a.score;

      // 2. Distance KM ASC (lower distance error is better)
      const distA = a.distance_km ?? 99999;
      const distB = b.distance_km ?? 99999;
      if (distA !== distB) return distA - distB;

      // 3. Earliest finish
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
  });

  const allEntries: LeaderboardEntry[] = uniqueSessions.map((session, idx) => {
    const prof = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
    let detail = "";

    if (game === "georings") {
      const rings = session.rings_completed ?? session.score ?? 0;
      const total = session.total_rings ?? 5;
      const tries = session.summary_data?.totalTriesUsed;
      detail = tries ? `${rings}/${total} anneaux (${tries} coups)` : `${rings}/${total} anneaux`;
    } else {
      const distKm = session.distance_km;
      detail = distKm !== null && distKm !== undefined
        ? distKm < 1 ? `${Math.round(distKm * 1000)} m d'écart` : `${Math.round(distKm)} km d'écart`
        : `${session.score} pts`;
    }

    return {
      rank: idx + 1,
      userId: session.user_id,
      username: prof?.username || "Joueur",
      avatarUrl: prof?.avatar_url || null,
      score: session.score,
      maxScore: session.max_score ?? (game === "georings" ? 5 : 25000),
      detailText: detail,
      accuracyPercent: session.accuracy_percent ? Number(session.accuracy_percent) : undefined,
      createdAt: session.created_at,
      isCurrentUser: currentUserId === session.user_id,
    };
  });

  const currentUserEntry = allEntries.find((e) => e.isCurrentUser);

  return NextResponse.json({
    gameMode: game as any,
    variant,
    scope: "daily",
    date: targetDateStr,
    totalPlayers: allEntries.length,
    entries: allEntries.slice(0, 50),
    currentUserRank: currentUserEntry
      ? { rank: currentUserEntry.rank, entry: currentUserEntry }
      : null,
  });
}
