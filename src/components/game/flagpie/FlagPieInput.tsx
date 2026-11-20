"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FlagPieCountry } from "@/lib/games/flagpie/types";
import { searchCountries, ALL_FLAGS } from "@/lib/games/flagpie/engine";
import { Search, CornerDownLeft, FastForward, AlertCircle, CheckCircle2 } from "lucide-react";

interface FlagPieInputProps {
  onGuess: (guessText: string) => void;
  onSkip: () => void;
  disabled?: boolean;
  pool?: FlagPieCountry[];
  feedbackMessage?: { text: string; type: "error" | "success" | "info" } | null;
}

export const FlagPieInput: React.FC<FlagPieInputProps> = ({
  onGuess,
  onSkip,
  disabled = false,
  pool = ALL_FLAGS,
  feedbackMessage,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Compute suggestions
  const suggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    return searchCountries(query, pool, 6);
  }, [query, pool]);

  // Open dropdown when query is not empty and suggestions exist
  useEffect(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [suggestions]);

  // Trigger shake animation on error
  useEffect(() => {
    if (feedbackMessage?.type === "error") {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleSelect = useCallback(
    (country: FlagPieCountry) => {
      onGuess(country.name);
      setQuery("");
      setIsOpen(false);
      setSelectedIndex(0);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [onGuess]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && suggestions.length > 0) {
        const chosen = suggestions[selectedIndex] || suggestions[0];
        handleSelect(chosen);
      } else if (query.trim()) {
        onGuess(query.trim());
        setQuery("");
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setIsOpen(false);
      return;
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto px-2 z-30">
      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`mb-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md transition-all animate-slide-up ${
            feedbackMessage.type === "error"
              ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : feedbackMessage.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-violet-500/20 text-violet-300 border border-violet-500/40"
          }`}
        >
          {feedbackMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Input Box */}
      <div
        className={`relative flex items-center bg-slate-900 border-2 rounded-2xl shadow-xl transition-all ${
          isShaking
            ? "border-red-500 animate-shake ring-4 ring-red-500/20"
            : isOpen
            ? "border-violet-500 ring-4 ring-violet-500/20"
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <div className="pl-4 text-slate-500">
          <Search className="w-5 h-5 text-violet-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Entrez le nom du pays..."
          className="w-full bg-transparent px-3 py-3.5 text-sm sm:text-base font-semibold text-white placeholder-slate-500 focus:outline-none"
        />

        <div className="pr-3 flex items-center gap-2">
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                if (isOpen && suggestions.length > 0) {
                  handleSelect(suggestions[selectedIndex] || suggestions[0]);
                } else {
                  onGuess(query.trim());
                  setQuery("");
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
            >
              <span>Valider</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Passer cette manche"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full left-2 right-2 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {suggestions.map((country, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={country.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(country)}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                  isSelected
                    ? "bg-violet-600/30 text-white font-bold"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none">{country.flag}</span>
                  <span className="font-semibold">{country.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {country.continent}
                  </span>
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-violet-400" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-slate-400">↑ / ↓</strong> naviguer
          </span>
          <span>
            <strong className="text-slate-400">Entrée</strong> valider
          </span>
          <span>
            <strong className="text-slate-400">Échap</strong> effacer
          </span>
        </div>
        <div className="text-slate-400">
          <span>🥧 5 000 ➔ 3 000 ➔ 1 000 pts</span>
        </div>
      </div>
    </div>
  );
};
