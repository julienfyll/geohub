"use client";

import { useState, useEffect, useCallback } from "react";
import { GameSettings, DEFAULT_SETTINGS } from "./types";

const SETTINGS_KEY = "geohub_settings_v1";

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (err) {
      console.warn("Failed to read settings from localStorage:", err);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        } catch (err) {
          console.warn("Failed to save settings to localStorage:", err);
        }
        return next;
      });
    },
    []
  );

  // Reset to default settings
  const resetDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.warn("Failed to reset settings in localStorage:", err);
    }
  }, []);

  return {
    settings,
    isReady,
    updateSetting,
    resetDefaults,
  };
}
