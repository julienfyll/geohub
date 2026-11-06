"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sliders, Globe, Heart, ShieldAlert, Sparkles, Play } from "lucide-react";
import { GameScale } from "@/lib/games/types";
import { getDefaultRadii } from "@/lib/db/sqlite";

interface CustomGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScale: GameScale;
}

const CONTINENTS = [
  { code: "", label: "🌍 Toutes régions", icon: "🌍" },
  { code: "EU", label: "🇪🇺 Europe", icon: "🇪🇺" },
  { code: "AS", label: "🌏 Asie", icon: "🌏" },
  { code: "AF", label: "🌍 Afrique", icon: "🌍" },
  { code: "NA", label: "🌎 Amérique du Nord", icon: "🌎" },
  { code: "SA", label: "🌎 Amérique du Sud", icon: "🌎" },
  { code: "OC", label: "🌏 Océanie", icon: "🌏" },
];

export const CustomGameModal: React.FC<CustomGameModalProps> = ({
  isOpen,
  onClose,
  currentScale,
}) => {
  const router = useRouter();

  const [scale, setScale] = useState<GameScale>(currentScale);
  const [continent, setContinent] = useState<string>("");
  const [numRings, setNumRings] = useState<number>(5);
  const [initialRadius, setInitialRadius] = useState<number>(200);
  const [stepRadius, setStepRadius] = useState<number>(200);
  const [lives, setLives] = useState<number>(3); // 1, 3, or -1 (infinite)

  // Maximum allowed distance safety guardrail by scale
  const maxAllowedDistance = scale === "fr" ? 1000 : scale === "eu" ? 3000 : 5000;

  // Initialize with Daily defaults when scale changes or modal opens
  useEffect(() => {
    setScale(currentScale);
    if (currentScale === "fr") {
      setInitialRadius(80);
      setStepRadius(80);
      setNumRings(5);
    } else if (currentScale === "eu") {
      setInitialRadius(200);
      setStepRadius(200);
      setNumRings(5);
    } else {
      setInitialRadius(600);
      setStepRadius(600);
      setNumRings(5);
    }
  }, [currentScale, isOpen]);

  // Dynamic Safety Clamp: ensure Rmax = R1 + (N - 1) * step <= maxAllowedDistance
  const maxPossibleStep = Math.max(10, Math.floor((maxAllowedDistance - initialRadius) / Math.max(1, numRings - 1)));
  const safeStep = Math.min(stepRadius, maxPossibleStep);

  // Compute radii list
  const computedRadii: number[] = [];
  for (let i = 0; i < numRings; i++) {
    computedRadii.push(initialRadius + i * safeStep);
  }

  const handleLaunch = () => {
    const radiiParam = computedRadii.join(",");
    let url = `/play/georings?mode=custom&scale=${scale}&radii=${radiiParam}&lives=${lives}`;
    if (scale === "world" && continent) {
      url += `&continent=${continent}`;
    }
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-5 text-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Créer une Partie Custom</h2>
              <p className="text-xs text-slate-400">Pré-rempli avec les réglages optimaux du Daily</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Scale Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            1. Échelle de Jeu
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setScale("fr");
                setInitialRadius(80);
                setStepRadius(80);
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                scale === "fr"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>🇫🇷</span> <span>France</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScale("eu");
                setInitialRadius(200);
                setStepRadius(200);
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                scale === "eu"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>🇪🇺</span> <span>Europe</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScale("world");
                setInitialRadius(600);
                setStepRadius(600);
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                scale === "world"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>🌍</span> <span>Monde</span>
            </button>
          </div>
        </div>

        {/* 2. Continent of departure (World only) */}
        {scale === "world" && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Continent de Départ (Seed)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CONTINENTS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setContinent(c.code)}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    continent === c.code
                      ? "bg-blue-600/30 border-blue-500 text-white font-semibold"
                      : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Ring Parameters with Safety Guardrails */}
        <div className="flex flex-col gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              3. Géométrie des Anneaux
            </span>
            <span className="text-[11px] text-blue-400 font-mono">
              Max : {computedRadii[computedRadii.length - 1]} km / {maxAllowedDistance} km
            </span>
          </div>

          {/* Number of rings */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Nombre d'anneaux</span>
              <span className="font-bold text-white">{numRings} anneaux</span>
            </div>
            <input
              type="range"
              min={3}
              max={8}
              value={numRings}
              onChange={(e) => setNumRings(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Initial Radius */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Rayon 1er anneau</span>
              <span className="font-bold text-white">{initialRadius} km</span>
            </div>
            <input
              type="range"
              min={scale === "fr" ? 30 : scale === "eu" ? 100 : 200}
              max={scale === "fr" ? 250 : scale === "eu" ? 600 : 1200}
              step={scale === "fr" ? 10 : 50}
              value={initialRadius}
              onChange={(e) => setInitialRadius(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Step Radius */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Incrément par anneau (pas)</span>
              <span className="font-bold text-white">+{safeStep} km</span>
            </div>
            <input
              type="range"
              min={scale === "fr" ? 30 : scale === "eu" ? 100 : 200}
              max={maxPossibleStep}
              step={scale === "fr" ? 10 : 50}
              value={safeStep}
              onChange={(e) => setStepRadius(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Live Radii Preview Badges */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
            {computedRadii.map((r, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] text-blue-300 font-mono"
              >
                #{i + 1}: {r} km
              </span>
            ))}
          </div>
        </div>

        {/* 4. Lives Rule */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>4. Nombre de Vies</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setLives(1)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                lives === 1
                  ? "bg-rose-950/80 border-rose-500 text-rose-200 font-bold"
                  : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              ⚡ 1 Vie (Mort Subite)
            </button>
            <button
              type="button"
              onClick={() => setLives(3)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                lives === 3
                  ? "bg-blue-600/30 border-blue-500 text-white font-bold"
                  : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              ❤️ 3 Vies (Standard)
            </button>
            <button
              type="button"
              onClick={() => setLives(-1)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                lives === -1
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold"
                  : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              ♾️ Infinies (Entraînement)
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Lancer la Partie Custom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
