"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BorderPathEntity,
  BorderPathGraph,
} from "@/lib/games/borderpath/types";
import { searchEntities } from "@/lib/games/borderpath/engine";
import { Search, CornerDownLeft, Undo2, AlertCircle, CheckCircle2, Flag } from "lucide-react";

interface BorderPathInputProps {
  currentEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  graph: BorderPathGraph;
  visitedIds: string[];
  isComplete: boolean;
  onSelectCandidate: (entity: BorderPathEntity) => void;
  onUndoLastStep: () => void;
  feedbackMessage?: { text: string; type: "error" | "success" | "info" } | null;
}

export const BorderPathInput: React.FC<BorderPathInputProps> = ({
  currentEntity,
  targetEntity,
  graph,
  visitedIds,
  isComplete,
  onSelectCandidate,
  onUndoLastStep,
  feedbackMessage,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Auto-focus input on mount and keep focused
  useEffect(() => {
    if (!isComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isComplete, currentEntity]);

  // Compute suggestions via engine's client-side fuzzy search
  const suggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    return searchEntities(query, graph, 6);
  }, [query, graph]);

  // Open dropdown when query is not empty and suggestions exist
  useEffect(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [suggestions]);

  // Trigger shake animation when an error message is passed
  useEffect(() => {
    if (feedbackMessage?.type === "error") {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleSelect = useCallback(
    (entity: BorderPathEntity) => {
      onSelectCandidate(entity);
      setQuery("");
      setIsOpen(false);
      setSelectedIndex(0);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [onSelectCandidate]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Enter key: submit selected item or top suggestion
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && suggestions.length > 0) {
        const chosen = suggestions[selectedIndex] || suggestions[0];
        handleSelect(chosen);
      }
      return;
    }

    // 2. Arrow Down: navigate list
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      }
      return;
    }

    // 3. Arrow Up: navigate list
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
      return;
    }

    // 4. Escape: clear query & close dropdown
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setIsOpen(false);
      return;
    }

    // 5. Backspace on empty input: Undo last step
    if (e.key === "Backspace" && query === "" && visitedIds.length > 0) {
      e.preventDefault();
      onUndoLastStep();
      return;
    }
  };

  const isCurrentNeighbor = (id: string) => {
    return currentEntity.neighbors.includes(id);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto px-4 z-30">
      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`mb-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md transition-all animate-slide-up ${
            feedbackMessage.type === "error"
              ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : feedbackMessage.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
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
        className={`relative flex items-center bg-slate-900/90 border-2 rounded-2xl shadow-2xl backdrop-blur-xl transition-all ${
          isShaking
            ? "border-red-500 animate-shake"
            : isOpen
            ? "border-blue-500 ring-4 ring-blue-500/20"
            : "border-slate-700 hover:border-slate-600 focus-within:border-blue-500"
        } ${isComplete ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="pl-4 pr-2 text-slate-400 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            De {currentEntity.name} vers
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez le nom d'un pays voisin ou limitrophe..."
          className="w-full py-3.5 px-2 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base font-semibold focus:outline-none"
          autoComplete="off"
          spellCheck="false"
          disabled={isComplete}
        />

        {/* Enter key badge */}
        <div className="pr-3 flex items-center gap-1.5 shrink-0">
          {visitedIds.length > 0 && (
            <button
              type="button"
              onClick={onUndoLastStep}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Annuler la dernière étape (Retour arrière)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-[11px] font-mono font-bold text-slate-400 border border-slate-700">
            <span>Entrée</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-4 right-4 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 divide-y divide-slate-800/80 max-h-72 overflow-y-auto"
        >
          {suggestions.map((entity, idx) => {
            const isNeighbor = isCurrentNeighbor(entity.id);
            const isVisited = visitedIds.includes(entity.id);
            const isTarget = entity.id === targetEntity.id;
            const isSelected = idx === selectedIndex;

            return (
              <li
                key={entity.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(entity)}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-600/20 text-white" : "text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{entity.flagEmoji || "📍"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-white">
                        {entity.name}
                      </span>
                      {entity.id.match(/^\d+$/) && (
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {entity.id}
                        </span>
                      )}
                    </div>
                    {entity.capitalOrChefLieu && (
                      <span className="text-xs text-slate-400 block">
                        Chef-lieu / Capitale : {entity.capitalOrChefLieu}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isTarget && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      🎯 Destination
                    </span>
                  )}

                  {isNeighbor ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                      Voisin direct
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-semibold">
                      Non adjacent
                    </span>
                  )}

                  {isVisited && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                      Déjà visité
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Helpful keyboard navigation instructions */}
      <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-slate-400">↑ / ↓</strong> pour naviguer
          </span>
          <span>
            <strong className="text-slate-400">Entrée</strong> pour valider
          </span>
          <span>
            <strong className="text-slate-400">Échap</strong> pour effacer
          </span>
        </div>
        {visitedIds.length > 0 && (
          <span>
            <strong className="text-slate-400">Retour arrière</strong> annule la dernière étape
          </span>
        )}
      </div>
    </div>
  );
};
