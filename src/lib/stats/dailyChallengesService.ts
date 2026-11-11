import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { GameSessionRecord } from "./types";
import { getGuestSessions } from "./statsService";

export interface DailyChallengeStatus {
  completed: boolean;
  score?: number;
  maxScore?: number;
  ringsCompleted?: number;
  totalRings?: number;
  date?: string;
  accuracyPercent?: number;
  distanceKm?: number;
}

export type DailyStatusMap = Record<string, DailyChallengeStatus>;

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSessionFromToday(s: GameSessionRecord): boolean {
  const localToday = getTodayDateString();
  const utcToday = new Date().toISOString().split("T")[0];

  const dateStr = s.created_at ? s.created_at.split("T")[0] : "";
  if (dateStr === localToday || dateStr === utcToday) return true;

  const seed = s.summary_data?.seed;
  if (typeof seed === "string") {
    if (seed.includes(localToday) || seed.includes(utcToday)) return true;
  }

  return false;
}

export function getChallengeKeyForSession(session: GameSessionRecord): string | null {
  const mode = session.summary_data?.mode;
  if (mode !== "daily") return null;

  if (session.game_mode === "blindpoint") {
    const pack = session.variant;
    if (pack === "villes_france") return "blindpoint_villes_france";
    if (pack === "villes_europe") return "blindpoint_villes_europe";
    if (pack === "villes_monde") return "blindpoint_villes_monde";
    if (pack === "lieux_paris") return "blindpoint_lieux_paris";
    if (pack === "lieux_monde" || pack === "monuments_monde") return "blindpoint_lieux_monde";
  }

  if (session.game_mode === "georings") {
    const metric =
      session.summary_data?.metric ||
      (session.variant === "airports" ? "airports" : "population");
    const scale = session.difficulty; // "fr", "eu", "world"

    if (metric === "airports") {
      if (scale === "fr") return "georings_airports_fr";
      if (scale === "world") return "georings_airports_world";
    } else {
      if (scale === "fr") return "georings_population_fr";
      if (scale === "eu") return "georings_population_eu";
      if (scale === "world") return "georings_population_world";
    }
  }

  return null;
}

export async function getDailyChallengesStatus(
  userId?: string | null
): Promise<DailyStatusMap> {
  const statusMap: DailyStatusMap = {};
  const supabase = getSupabaseBrowserClient();

  let allSessions: GameSessionRecord[] = [];

  // 1. Always read guest sessions from local storage as well
  const guestSessions = getGuestSessions();
  allSessions = [...guestSessions];

  // 2. If authenticated, fetch recent sessions from Supabase
  if (userId && supabase) {
    try {
      const { data: dbSessions, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && dbSessions) {
        // Merge DB sessions, avoiding duplicate IDs if any
        const existingIds = new Set(allSessions.map((s) => s.id).filter(Boolean));
        for (const s of dbSessions) {
          if (!existingIds.has(s.id)) {
            allSessions.push(s);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch cloud daily sessions:", err);
    }
  }

  // 3. Filter daily sessions played today
  const todayDailySessions = allSessions.filter(
    (s) => s.summary_data?.mode === "daily" && isSessionFromToday(s)
  );

  // 4. Map to challenge keys
  for (const s of todayDailySessions) {
    const key = getChallengeKeyForSession(s);
    if (!key) continue;

    const current = statusMap[key];
    const score = s.score ?? 0;
    const maxScore =
      s.max_score ??
      (s.game_mode === "blindpoint" ? 25000 : s.rings_completed ?? 5);

    // If first entry or better score, record it
    if (!current || score > (current.score ?? 0)) {
      statusMap[key] = {
        completed: true,
        score,
        maxScore,
        ringsCompleted: s.rings_completed ?? s.score,
        totalRings: s.total_rings ?? 5,
        accuracyPercent: s.accuracy_percent ?? undefined,
        distanceKm: s.distance_km ?? undefined,
        date: s.created_at,
      };
    }
  }

  return statusMap;
}
