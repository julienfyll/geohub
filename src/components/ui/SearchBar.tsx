"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { City, GameScale } from "@/lib/games/types";

interface SearchBarProps {
  scale: GameScale;
  onSelectCity: (city: City) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  scale,
  onSelectCity,
  disabled = false,
  placeholder = "Entrez le nom d'une ville...",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
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

  const handleSelect = (city: City) => {
    onSelectCity(city);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
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

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto divide-y divide-slate-800">
          {results.map((city, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                  isSelected ? "bg-blue-600/30 text-white" : "hover:bg-slate-800/80 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-sm">{city.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {city.countryCode}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {city.population.toLocaleString("fr-FR")} hab.
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
