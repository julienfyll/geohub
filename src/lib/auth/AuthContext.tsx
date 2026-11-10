"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserProfile, UserStreak } from "@/lib/stats/types";
import {
  migrateGuestSessionsToCloud,
  getGuestStreak,
  updateUserCloudStreak,
} from "@/lib/stats/statsService";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  streak: UserStreak;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  streak: { user_id: "guest", current_streak: 0, best_streak: 0, last_played_date: null },
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUsername: async () => ({ success: false }),
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<UserStreak>(getGuestStreak());
  const [loading, setLoading] = useState(true);

  // Fetch or ensure profile
  const fetchProfileAndStreak = useCallback(async (currentUser: User) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      // 1. Fetch profile
      let { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      // If trigger hasn't finished yet or table was empty, fallback create
      if (!prof && profErr) {
        const rawName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "Explorateur";

        const newProf = {
          id: currentUser.id,
          email: currentUser.email || "",
          username: rawName,
          avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
        };

        const { data: createdProf } = await supabase
          .from("profiles")
          .upsert(newProf)
          .select()
          .single();

        prof = createdProf;
      }

      if (prof) {
        setProfile(prof);
      }

      // 2. Fetch streak
      const { data: userStreak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (userStreak) {
        setStreak(userStreak);
      } else {
        // Init cloud streak if empty
        const initial = await updateUserCloudStreak(currentUser.id);
        if (initial) setStreak(initial);
      }

      // 3. Migrate any guest sessions saved locally
      migrateGuestSessionsToCloud(currentUser.id).catch((err) =>
        console.warn("Silent guest session migration err:", err)
      );
    } catch (err) {
      console.error("Error fetching user profile & streak:", err);
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then((res) => {
      const session = res.data?.session;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfileAndStreak(currentUser).finally(() => setLoading(false));
      } else {
        setStreak(getGuestStreak());
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfileAndStreak(currentUser);
      } else {
        setProfile(null);
        setStreak(getGuestStreak());
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndStreak]);

  const signInWithGoogle = async (redirectPath?: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      alert("Configuration Supabase manquante.");
      return;
    }

    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const nextPath = redirectPath || (typeof window !== "undefined" ? window.location.pathname : "/");
    const callbackUrl = `${currentOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      console.error("Sign in error:", error);
      alert("Erreur lors de la connexion Google : " + error.message);
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setStreak(getGuestStreak());
  };

  const updateUsername = async (newUsername: string) => {
    const clean = newUsername.trim();
    if (!clean || clean.length < 2) {
      return { success: false, error: "Le pseudo doit comporter au moins 2 caractères." };
    }
    if (clean.length > 25) {
      return { success: false, error: "Le pseudo ne doit pas dépasser 25 caractères." };
    }

    if (!user) {
      return { success: false, error: "Non connecté." };
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { success: false, error: "Client Supabase non initialisé." };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: clean, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "Ce pseudo est déjà pris par un autre joueur." };
        }
        return { success: false, error: error.message };
      }

      setProfile((prev) => (prev ? { ...prev, username: clean } : null));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Erreur inconnue." };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndStreak(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        streak,
        loading,
        signInWithGoogle,
        signOut,
        updateUsername,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
