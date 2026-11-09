"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sliders, Globe, Heart, Shield, Play } from "lucide-react";
import { GameScale } from "@/lib/games/types";

interface CustomGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScale: GameScale;
}

const CONTINENTS = [
  { code: "", label: "🌍 Toutes régions" },
  { code: "EU", label: "🇪🇺 Europe" },
  { code: "AS", label: "🌏 Asie" },
  { code: "AF", label: "🌍 Afrique" },
  { code: "NA", label: "🌎 Amérique du Nord" },
  { code: "SA", label: "🌎 Amérique du Sud" },
  { code: "OC", label: "🌏 Océanie" },
];

/**
 * Geographical scale boundaries and parameter ranges.
 * The final ring radius R_final = R_1 + (N - 1) * step MUST NEVER exceed maxAllowedDistance.
 */
const SCALE_BOUNDS: Record<
  GameScale,
  {
    maxAllowedDistance: number;
    initMin: number;
    initMax: number;
    initStep: number;
    stepMin: number;
    stepMax: number;
    stepStep: number;
    defaultInit: number;
    defaultStep: number;
    defaultRings: number;
    scaleLabel: string;
  }
> = {
  fr: {
    maxAllowedDistance: 1000,
    initMin: 20,
    initMax: 300,
    initStep: 10,
    stepMin: 10,
    stepMax: 250,
    stepStep: 10,
    defaultInit: 80,
    defaultStep: 80,
    defaultRings: 5,
    scaleLabel: "France métropolitaine",
  },
  eu: {
    maxAllowedDistance: 3000,
    initMin: 50,
    initMax: 800,
    initStep: 25,
    stepMin: 25,
    stepMax: 600,
    stepStep: 25,
    defaultInit: 200,
    defaultStep: 200,
    defaultRings: 5,
    scaleLabel: "Continent européen",
  },
  world: {
    maxAllowedDistance: 5000,
    initMin: 100,
    initMax: 2000,
    initStep: 50,
    stepMin: 50,
    stepMax: 1500,
    stepStep: 50,
    defaultInit: 600,
    defaultStep: 600,
    defaultRings: 5,
    scaleLabel: "Monde entier",
  },
};

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

  const bounds = SCALE_BOUNDS[scale];

  // Reset to calibrated scale defaults when scale changes or modal opens
  const applyScaleDefaults = (targetScale: GameScale) => {
    setScale(targetScale);
    const b = SCALE_BOUNDS[targetScale];
    setInitialRadius(b.defaultInit);
    setStepRadius(b.defaultStep);
    setNumRings(b.defaultRings);
  };

  useEffect(() => {
    applyScaleDefaults(currentScale);
  }, [currentScale, isOpen]);

  // Dynamic maximum rings permitted given current stepRadius and initialRadius
  const maxPossibleRings = Math.max(
    2,
    Math.min(12, 1 + Math.floor((bounds.maxAllowedDistance - initialRadius) / stepRadius))
  );

  // Dynamic maximum step permitted given current numRings and initialRadius
  const maxPossibleStep = Math.max(
    bounds.stepMin,
    Math.min(
      bounds.stepMax,
      Math.floor((bounds.maxAllowedDistance - initialRadius) / Math.max(1, numRings - 1))
    )
  );
  const snappedMaxStep = Math.max(
    bounds.stepMin,
    Math.floor(maxPossibleStep / bounds.stepStep) * bounds.stepStep
  );

  // Dynamic maximum initial radius permitted given current numRings and stepRadius
  const maxPossibleInit = Math.max(
    bounds.initMin,
    Math.min(bounds.initMax, bounds.maxAllowedDistance - (numRings - 1) * stepRadius)
  );
  const snappedMaxInit = Math.max(
    bounds.initMin,
    Math.floor(maxPossibleInit / bounds.initStep) * bounds.initStep
  );

  // Dynamic handlers ensuring R_final = R_1 + (N - 1) * step NEVER exceeds bounds.maxAllowedDistance
  const handleStepRadiusChange = (newStep: number) => {
    setStepRadius(newStep);
    // Increasing increment dynamically reduces the maximum number of rings allowed
    const maxRingsForNewStep = Math.max(
      2,
      Math.min(12, 1 + Math.floor((bounds.maxAllowedDistance - initialRadius) / newStep))
    );
    if (numRings > maxRingsForNewStep) {
      setNumRings(maxRingsForNewStep);
    }
  };

  const handleNumRingsChange = (newRings: number) => {
    setNumRings(newRings);
    // Increasing rings dynamically reduces the maximum step allowed
    const maxStepForNewRings = Math.max(
      bounds.stepMin,
      Math.floor((bounds.maxAllowedDistance - initialRadius) / Math.max(1, newRings - 1))
    );
    const snapped = Math.floor(maxStepForNewRings / bounds.stepStep) * bounds.stepStep;
    if (stepRadius > snapped) {
      setStepRadius(Math.max(bounds.stepMin, snapped));
    }
  };

  const handleInitialRadiusChange = (newInit: number) => {
    setInitialRadius(newInit);
    // Increasing initial radius dynamically adjusts step or rings if needed
    const maxStepForNewInit = Math.max(
      bounds.stepMin,
      Math.floor((bounds.maxAllowedDistance - newInit) / Math.max(1, numRings - 1))
    );
    const snapped = Math.floor(maxStepForNewInit / bounds.stepStep) * bounds.stepStep;
    if (stepRadius > snapped) {
      setStepRadius(Math.max(bounds.stepMin, snapped));
    }
  };

  // Compute active radii list
  const activeRingsCount = Math.min(numRings, maxPossibleRings);
  const computedRadii = Array.from(
    { length: activeRingsCount },
    (_, i) => initialRadius + i * stepRadius
  );
  const finalRadius = computedRadii[computedRadii.length - 1];
  const coveragePercent = Math.min(100, Math.round((finalRadius / bounds.maxAllowedDistance) * 100));

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
              <p className="text-xs text-slate-400">Paramétrez librement vos anneaux et vos règles</p>
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
              onClick={() => applyScaleDefaults("fr")}
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
              onClick={() => applyScaleDefaults("eu")}
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
              onClick={() => applyScaleDefaults("world")}
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

        {/* 3. Dynamic Ring Parameters - Guaranteed <= bounds.maxAllowedDistance */}
        <div className="flex flex-col gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  3. Géométrie des Anneaux
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                  <Shield className="w-3 h-3" />
                  Garde-fou actif
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calcul : {initialRadius} km + ({activeRingsCount - 1} × {stepRadius} km)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">
                Limite {bounds.scaleLabel}
              </span>
              <span className="text-xs font-bold text-blue-400 font-mono bg-blue-950/80 border border-blue-500/50 px-2.5 py-1 rounded-lg inline-block">
                {finalRadius.toLocaleString("fr-FR")} km / {bounds.maxAllowedDistance.toLocaleString("fr-FR")} km
              </span>
            </div>
          </div>

          {/* Dynamic Geographic Progress Bar */}
          <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden flex items-center">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                coveragePercent >= 95 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>

          {/* Number of rings (dynamically bounded by stepRadius) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Nombre d'anneaux</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{activeRingsCount} anneaux</span>
                <span className="text-[10px] text-blue-400/90 font-mono">
                  (max : {maxPossibleRings})
                </span>
              </div>
            </div>
            <input
              type="range"
              min={2}
              max={maxPossibleRings}
              value={activeRingsCount}
              onChange={(e) => handleNumRingsChange(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Increment per ring (increasing it automatically pulls down numRings) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Incrément par anneau (pas)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">+{stepRadius} km</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (max : +{snappedMaxStep} km pour {activeRingsCount} anneaux)
                </span>
              </div>
            </div>
            <input
              type="range"
              min={bounds.stepMin}
              max={bounds.stepMax}
              step={bounds.stepStep}
              value={stepRadius}
              onChange={(e) => handleStepRadiusChange(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Initial Radius */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Rayon 1er anneau (centre)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{initialRadius} km</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (max : {snappedMaxInit} km)
                </span>
              </div>
            </div>
            <input
              type="range"
              min={bounds.initMin}
              max={bounds.initMax}
              step={bounds.initStep}
              value={initialRadius}
              onChange={(e) => handleInitialRadiusChange(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Live Radii Preview Badges */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800 max-h-24 overflow-y-auto">
            {computedRadii.map((r, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] text-blue-300 font-mono"
              >
                #{i + 1}: {r.toLocaleString("fr-FR")} km
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
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
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
            <span>Lancer la Partie Custom ({activeRingsCount} anneaux · {finalRadius.toLocaleString("fr-FR")} km)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
