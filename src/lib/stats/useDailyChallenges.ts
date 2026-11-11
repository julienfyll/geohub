"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  DailyStatusMap,
  getDailyChallengesStatus,
} from "./dailyChallengesService";

export function useDailyChallenges() {
  const { user } = useAuth();
  const [statusMap, setStatusMap] = useState<DailyStatusMap>({});
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getDailyChallengesStatus(user?.id);
      setStatusMap(data);
    } catch (err) {
      console.error("Error loading daily challenges status:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();

    // Re-check when window regains focus (e.g. after returning from another tab or game)
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  return { statusMap, loading, refresh };
}
