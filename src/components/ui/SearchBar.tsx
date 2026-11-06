"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { GameScale } from "@/lib/games/types";

export interface SearchCityItem {
  id: string;
  name: string;
  countryCode: string;
  scale?: GameScale;
}

interface SearchBarProps {
  scale: GameScale;
  onSelectCity: (city: SearchCityItem) => void;
  onCityNotFound?: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  scale,
  onSelectCity,
  onCityNotFound,
  disabled = false,
  placeholder = "Entrez le nom d'une ville...",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchCityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}&scale=${scale}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, scale]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: SearchCityItem) => {
    onSelectCity(city);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleDirectSubmit = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(searchQuery)}&scale=${scale}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          handleSelect(data.results[0]);
          return;
        }
      }
      if (onCityNotFound) {
        onCityNotFound(searchQuery);
      }
    } catch (err) {
      console.error("Direct search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      if (results.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (results.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      // 1. If an item was explicitly highlighted via arrows
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
        return;
      }

      // 2. If suggestions are loaded, auto-pick the 1st (top match) without requiring arrow/click!
      if (results.length > 0) {
        handleSelect(results[0]);
        return;
      }

      // 3. If user typed fast and hit Enter before autocomplete finished loading
      if (query.trim().length >= 2) {
        handleDirectSubmit(query.trim());
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-3 bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white placeholder-slate-400 text-sm font-medium shadow-xl backdrop-blur-md transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <Loader2 className="absolute right-3.5 w-4 h-4 text-blue-400 animate-spin pointer-events-none" />
        )}
      </div>

      {/* Autocomplete Dropdown - Anti-cheat: No population shown */}
      {isOpen && results.length > 0 && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto divide-y divide-slate-800"
        >
          {results.map((city, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                  isSelected ? "bg-blue-600/30 text-white" : "hover:bg-slate-800/80 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-sm">{city.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {city.countryCode}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
