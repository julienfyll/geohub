"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sliders,
  Play,
  Copy,
  Check,
  Globe,
  Clock,
  Layers,
  Sparkles,
  MapPin,
  Eye,
  CheckSquare,
  Square,
  Share2,
} from "lucide-react";
import {
  BlindPointPack,
  BlindPointDifficulty,
  BlindPointMapTheme,
} from "@/lib/games/blindpoint/types";

interface BlindPointCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPack?: BlindPointPack;
  initialDifficulty?: BlindPointDifficulty | "all";
}

const AVAILABLE_PACKS: {
  id: BlindPointPack;
  name: string;
  badge: string;
  icon: string;
  countLabel: string;
  isWorld: boolean;
  category: "villes" | "lieux";
}[] = [
  {
    id: "villes_france",
    name: "Villes de France",
    badge: "France",
    icon: "🇫🇷",
    countLabel: "139 villes & métropoles",
    isWorld: false,
    category: "villes",
  },
  {
    id: "lieux_paris",
    name: "Monuments de Paris",
    badge: "Paris Intra-muros",
    icon: "🗼",
    countLabel: "105 sites & trésors",
    isWorld: false,
    category: "lieux",
  },
  {
    id: "lieux_france",
    name: "Châteaux & Patrimoine",
    badge: "France",
    icon: "🏰",
    countLabel: "58 châteaux de la Loire & édifices",
    isWorld: false,
    category: "lieux",
  },
  {
    id: "villes_monde",
    name: "Villes du Monde",
    badge: "Monde",
    icon: "🌍",
    countLabel: "167 métropoles (6 continents)",
    isWorld: true,
    category: "villes",
  },
  {
    id: "lieux_monde",
    name: "Merveilles du Monde",
    badge: "UNESCO",
    icon: "🏛️",
    countLabel: "50 merveilles de l'humanité",
    isWorld: true,
    category: "lieux",
  },
];

const CONTINENTS = [
  { code: "", label: "🌍 Tous continents" },
  { code: "EU", label: "🇪🇺 Europe" },
  { code: "AS", label: "🌏 Asie" },
  { code: "AF", label: "🌍 Afrique" },
  { code: "NA", label: "🌎 Amérique du Nord" },
  { code: "SA", label: "🌎 Amérique du Sud" },
  { code: "OC", label: "🌏 Océanie" },
];

export const BlindPointCustomModal: React.FC<BlindPointCustomModalProps> = ({
  isOpen,
  onClose,
  initialPack = "villes_france",
  initialDifficulty = "all",
}) => {
  const router = useRouter();

  // 1. Packs selection (Multiple checkboxes)
  const [selectedPacks, setSelectedPacks] = useState<BlindPointPack[]>([initialPack]);

  // 2. Continent filter (for world targets)
  const [continent, setContinent] = useState<string>("");

  // 3. Difficulty level
  const [difficulty, setDifficulty] = useState<BlindPointDifficulty | "all">(initialDifficulty);

  // 4. Rounds count
  const [roundsCount, setRoundsCount] = useState<number>(5);

  // 5. Timer per round (seconds, 0 = infinite)
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // 6. Map layout conditions (soft overrides)
  const [mapTheme, setMapTheme] = useState<BlindPointMapTheme>("dark");
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);

  // 7. Seed & Copy state
  const [seed, setSeed] = useState<string>(() => `custom-${Date.now().toString(36)}`);
  const [copied, setCopied] = useState<boolean>(false);

  // Reset seed when opening modal
  useEffect(() => {
    if (isOpen) {
      setSeed(`custom-${Date.now().toString(36)}`);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle pack in list
  const togglePack = (packId: BlindPointPack) => {
    setSelectedPacks((prev) => {
      if (prev.includes(packId)) {
        if (prev.length === 1) return prev; // At least one pack required
        return prev.filter((p) => p !== packId);
      } else {
        return [...prev, packId];
      }
    });
  };

  const hasWorldPack = selectedPacks.some(
    (p) => p === "villes_monde" || p === "lieux_monde" || p === "monuments_monde"
  );

  // Build the shareable challenge URL
  const buildChallengeUrl = (includeOrigin = true) => {
    const origin = typeof window !== "undefined" && includeOrigin ? window.location.origin : "";
    const packsStr = selectedPacks.join(",");
    let url = `${origin}/play/blindpoint?mode=custom&packs=${packsStr}&rounds=${roundsCount}`;
    if (timerSeconds > 0) url += `&timer=${timerSeconds}`;
    if (difficulty !== "all") url += `&diff=${difficulty}`;
    if (hasWorldPack && continent) url += `&continent=${continent}`;
    if (mapTheme !== "dark") url += `&theme=${mapTheme}`;
    if (!showBorders) url += `&borders=0`;
    if (!showRoads) url += `&roads=0`;
    url += `&seed=${seed}&play=1`;
    return url;
  };

  const handleCopyLink = async () => {
    const fullUrl = buildChallengeUrl(true);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleLaunchGame = () => {
    const localUrl = buildChallengeUrl(false);
    onClose();
    router.push(localUrl);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto select-none">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Créateur de Défi Personnalisé</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                  Custom
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Combinez vos thèmes, réglez le chrono et imposez vos règles pour défier vos amis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Thématiques combinables */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>1. Thématiques & Packs à inclure</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedPacks.length} sélectionné{selectedPacks.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_PACKS.map((p) => {
              const isChecked = selectedPacks.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePack(p.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isChecked
                      ? "bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-500/10 text-white"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{p.icon}</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.countLabel}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-slate-700 bg-slate-900/60 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Filtre Continent (si au moins 1 pack monde coché) */}
        {hasWorldPack && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-150">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Zone Géographique (Packs Monde)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CONTINENTS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setContinent(c.code)}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    continent === c.code
                      ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Nombre de Manches & Difficulté */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Manches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Nombre de Manches</span>
              </label>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs">
                {roundsCount} manches
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={3}
                max={50}
                step={1}
                value={roundsCount}
                onChange={(e) => setRoundsCount(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span className="font-mono">3 min</span>
                <span className="text-slate-400 font-medium">
                  Max : {(roundsCount * 5000).toLocaleString("fr-FR")} pts
                </span>
                <span className="font-mono">50 max</span>
              </div>
            </div>
          </div>

          {/* Difficulté */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Niveau de Difficulté</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "all" as const, label: "🎲 Tous" },
                { id: "facile" as const, label: "🟢 Facile" },
                { id: "moyen" as const, label: "🟡 Moyen" },
                { id: "difficile" as const, label: "🔴 Difficile" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all ${
                    difficulty === d.id
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Tolérance de distance standard calibrée
            </span>
          </div>
        </div>

        {/* Section 4: Chronomètre & Layout de la Carte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Chronomètre */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>4. Chronomètre par Manche</span>
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[
                { sec: 0, label: "Off" },
                { sec: 10, label: "10s" },
                { sec: 15, label: "15s" },
                { sec: 30, label: "30s" },
                { sec: 60, label: "60s" },
              ].map((t) => (
                <button
                  key={t.sec}
                  type="button"
                  onClick={() => setTimerSeconds(t.sec)}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold text-center transition-all ${
                    timerSeconds === t.sec
                      ? "bg-rose-600 border-rose-500 text-white shadow-sm"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map Layout Soft Override */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>5. Thème & Repères de Carte</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "dark" as const, label: "🌙 Sombre" },
                { id: "satellite" as const, label: "🛰️ Satellite" },
                { id: "voyager" as const, label: "☀️ Clair" },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setMapTheme(th.id)}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all ${
                    mapTheme === th.id
                      ? "bg-sky-600 border-sky-500 text-white shadow-sm"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => setShowBorders((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                {showBorders ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>Frontières</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRoads((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                {showRoads ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>Réseau routier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Link Preview & Action CTAs */}
        <div className="border-t border-slate-800/90 pt-4 flex flex-col gap-3">
          {/* Share Link Preview Box */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex-1 min-w-0 px-2 font-mono text-[11px] text-slate-400 truncate">
              {buildChallengeUrl(true)}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 shadow-sm ${
                copied
                  ? "bg-emerald-600 text-white shadow-emerald-600/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>

          {/* Main Launch Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>Défier des amis (Partager)</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchGame}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/25 border border-purple-400/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Lancer le Défi ({roundsCount} Manches)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
