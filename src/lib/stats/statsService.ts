import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { GameSessionRecord, UserStreak, UserSummaryStats } from "./types";

const LOCAL_STORAGE_GUEST_SESSIONS = "geohub_guest_sessions";
const LOCAL_STORAGE_GUEST_STREAK = "geohub_guest_streak";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// Guest LocalStorage Management
// -------------------------------------------------------------
export function getGuestSessions(): GameSessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GUEST_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read guest sessions:", e);
    return [];
  }
}

export function getGuestStreak(): UserStreak {
  if (typeof window === "undefined") {
    return { user_id: "guest", current_streak: 0, best_streak: 0, last_played_date: null };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GUEST_STREAK);
    if (!raw) {
      return { user_id: "guest", current_streak: 0, best_streak: 0, last_played_date: null };
    }
    const parsed = JSON.parse(raw);
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    // Check if streak was broken (last played before yesterday)
    if (parsed.last_played_date && parsed.last_played_date !== today && parsed.last_played_date !== yesterday) {
      parsed.current_streak = 0;
    }
    return parsed;
  } catch (e) {
    return { user_id: "guest", current_streak: 0, best_streak: 0, last_played_date: null };
  }
}

function updateGuestStreak(): UserStreak {
  const streak = getGuestStreak();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (streak.last_played_date === today) {
    return streak;
  }

  let newCurrent = 1;
  if (streak.last_played_date === yesterday) {
    newCurrent = (streak.current_streak || 0) + 1;
  }

  const newBest = Math.max(streak.best_streak || 0, newCurrent);
  const updated: UserStreak = {
    user_id: "guest",
    current_streak: newCurrent,
    best_streak: newBest,
    last_played_date: today,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_GUEST_STREAK, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to write guest streak:", e);
  }
  return updated;
}

// -------------------------------------------------------------
// Cloud & Hybrid Session Recording
// -------------------------------------------------------------
export async function recordGameSession(
  sessionData: Omit<GameSessionRecord, "id" | "user_id" | "created_at">,
  userId?: string | null
): Promise<{ success: boolean; isCloud: boolean }> {
  const supabase = getSupabaseBrowserClient();

  // 1. If authenticated, save to Supabase
  if (userId && supabase) {
    try {
      const payload = {
        user_id: userId,
        game_mode: sessionData.game_mode,
        variant: sessionData.variant,
        difficulty: sessionData.difficulty,
        score: sessionData.score,
        max_score: sessionData.max_score ?? null,
        rings_completed: sessionData.rings_completed ?? null,
        total_rings: sessionData.total_rings ?? null,
        accuracy_percent: sessionData.accuracy_percent ?? null,
        distance_km: sessionData.distance_km ?? null,
        time_spent_seconds: sessionData.time_spent_seconds ?? null,
        summary_data: sessionData.summary_data ?? {},
      };

      const { error } = await supabase.from("game_sessions").insert([payload]);
      if (error) {
        console.error("Supabase record error:", error);
        throw error;
      }

      // Update cloud streak
      await updateUserCloudStreak(userId);
      return { success: true, isCloud: true };
    } catch (err) {
      console.warn("Cloud save failed, falling back to local guest storage:", err);
    }
  }

  // 2. Otherwise save locally for guests
  try {
    const existing = getGuestSessions();
    const newRecord: GameSessionRecord = {
      ...sessionData,
      id: "local_" + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newRecord, ...existing].slice(0, 100); // keep up to 100 recent
    localStorage.setItem(LOCAL_STORAGE_GUEST_SESSIONS, JSON.stringify(updated));
    updateGuestStreak();
    return { success: true, isCloud: false };
  } catch (e) {
    console.error("Guest save error:", e);
    return { success: false, isCloud: false };
  }
}

// -------------------------------------------------------------
// Cloud Streak Maintenance
// -------------------------------------------------------------
export async function updateUserCloudStreak(userId: string): Promise<UserStreak | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !userId) return null;

  try {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const { data: existingStreak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!existingStreak) {
      // First streak entry
      const newStreak = {
        user_id: userId,
        current_streak: 1,
        best_streak: 1,
        last_played_date: today,
      };
      await supabase.from("user_streaks").insert([newStreak]);
      return newStreak;
    }

    if (existingStreak.last_played_date === today) {
      return existingStreak;
    }

    let newCurrent = 1;
    if (existingStreak.last_played_date === yesterday) {
      newCurrent = (existingStreak.current_streak || 0) + 1;
    }

    const newBest = Math.max(existingStreak.best_streak || 0, newCurrent);
    const updated = {
      current_streak: newCurrent,
      best_streak: newBest,
      last_played_date: today,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("user_streaks").update(updated).eq("user_id", userId);
    return { user_id: userId, ...updated };
  } catch (err) {
    console.error("Error updating cloud streak:", err);
    return null;
  }
}

// -------------------------------------------------------------
// Guest-to-Cloud Migration on First Sign-In
// -------------------------------------------------------------
export async function migrateGuestSessionsToCloud(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !userId) return 0;

  const guestSessions = getGuestSessions();
  if (guestSessions.length === 0) return 0;

  try {
    const payload = guestSessions.map((s) => ({
      user_id: userId,
      game_mode: s.game_mode,
      variant: s.variant,
      difficulty: s.difficulty,
      score: s.score,
      max_score: s.max_score ?? null,
      rings_completed: s.rings_completed ?? null,
      total_rings: s.total_rings ?? null,
      accuracy_percent: s.accuracy_percent ?? null,
      distance_km: s.distance_km ?? null,
      time_spent_seconds: s.time_spent_seconds ?? null,
      summary_data: s.summary_data ?? {},
      created_at: s.created_at || new Date().toISOString(),
    }));

    const { error } = await supabase.from("game_sessions").insert(payload);
    if (!error) {
      localStorage.removeItem(LOCAL_STORAGE_GUEST_SESSIONS);
      await updateUserCloudStreak(userId);
      return payload.length;
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
  return 0;
}

// -------------------------------------------------------------
// Aggregated Stats Calculation
// -------------------------------------------------------------
export async function getAggregatedStats(userId?: string | null): Promise<UserSummaryStats> {
  const supabase = getSupabaseBrowserClient();

  let sessions: GameSessionRecord[] = [];
  let streak: UserStreak = {
    user_id: userId || "guest",
    current_streak: 0,
    best_streak: 0,
    last_played_date: null,
  };

  if (userId && supabase) {
    try {
      const { data: dbSessions } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      const { data: dbStreak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (dbSessions) sessions = dbSessions;
      if (dbStreak) streak = dbStreak;
    } catch (e) {
      console.error("Failed to fetch cloud stats:", e);
    }
  } else {
    sessions = getGuestSessions();
    streak = getGuestStreak();
  }

  const totalGames = sessions.length;
  const georingsGames = sessions.filter((s) => s.game_mode === "georings").length;
  const blindpointGames = sessions.filter((s) => s.game_mode === "blindpoint").length;

  const perfectGames = sessions.filter((s) => {
    if (s.game_mode === "georings") {
      return (
        s.rings_completed &&
        s.total_rings &&
        s.rings_completed === s.total_rings
      );
    }
    if (s.game_mode === "blindpoint") {
      return s.max_score && s.score >= s.max_score * 0.95;
    }
    return false;
  }).length;

  const totalScore = sessions.reduce((acc, s) => acc + (s.score || 0), 0);
  const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

  return {
    totalGames,
    georingsGames,
    blindpointGames,
    perfectGames,
    averageScore,
    currentStreak: streak.current_streak || 0,
    bestStreak: streak.best_streak || 0,
    recentSessions: sessions.slice(0, 10),
  };
}
