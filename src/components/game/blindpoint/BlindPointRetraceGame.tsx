"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import {
  ArrowLeft,
  RotateCcw,
  Sliders,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Layers,
  MapPin,
  Check,
  Zap,
  ChevronDown,
  X,
} from "lucide-react";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";
import {
  METRO_TOPOLOGY_STATIONS,
  METRO_LINE_TOPOLOGY,
  METRO_LINE_COLORS,
  TOTAL_METRO_SEGMENTS,
  MetroStationTopology,
  getDistanceMeters,
  getCanonicalPairKey,
  getLineSegmentOffset,
} from "@/lib/games/blindpoint/data/metro_topology";

const STORAGE_KEY = "geohub_retrace_metro_discovered";

export interface BlindPointRetraceGameProps {
  initialTolerance?: string; // "chill", "500", "300", "150", "75"
  selectedLines?: string[];
  onBackToLobby: () => void;
  onOpenCustomModal: () => void;
}

export const BlindPointRetraceGame: React.FC<BlindPointRetraceGameProps> = ({
  initialTolerance = "300",
  selectedLines = ["1", "4", "6"],
  onBackToLobby,
  onOpenCustomModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Filter stations based on selected lines
  const activeStations = useMemo(() => {
    return METRO_TOPOLOGY_STATIONS.filter((s) =>
      s.lines.some((l) => selectedLines.includes(l))
    );
  }, [selectedLines]);

  // Game state
  const [tolerance, setTolerance] = useState<string>(initialTolerance);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {
      // ignore
    }
    return new Set();
  });

  const [currentTarget, setCurrentTarget] = useState<MetroStationTopology | null>(null);
  const [pendingGuess, setPendingGuess] = useState<[number, number] | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
    distance?: number;
  } | null>(null);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Save discovered stations to localStorage
  const saveProgress = useCallback((nextDiscovered: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(nextDiscovered)));
    } catch (e) {
      console.error("Failed to save progress to localStorage", e);
    }
  }, []);

  // Pick next station to place
  const pickNextStation = useCallback(
    (currentDiscovered: Set<string>) => {
      const undiscovered = activeStations.filter((s) => !currentDiscovered.has(s.id));
      if (undiscovered.length === 0) {
        setCurrentTarget(null);
        setIsCompletedModalOpen(true);
        return;
      }
      // Pick next in sequence or randomly
      const next = undiscovered[0];
      setCurrentTarget(next);
      setPendingGuess(null);
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
        pendingMarkerRef.current = null;
      }
    },
    [activeStations]
  );

  // Initialize or resume next target
  useEffect(() => {
    pickNextStation(discoveredIds);
  }, [activeStations, pickNextStation]);

  // Compute connected segments count
  const connectedSegmentsCount = useMemo(() => {
    let count = 0;
    selectedLines.forEach((line) => {
      const topo = METRO_LINE_TOPOLOGY[line];
      if (!topo) return;
      for (let i = 0; i < topo.length - 1; i++) {
        if (discoveredIds.has(topo[i]) && discoveredIds.has(topo[i + 1])) {
          count++;
        }
      }
    });
    return count;
  }, [discoveredIds, selectedLines]);

  const progressPercent = useMemo(() => {
    if (activeStations.length === 0) return 0;
    return Math.round((discoveredIds.size / activeStations.length) * 100);
  }, [discoveredIds.size, activeStations.length]);

  /**
   * Updates line track layers on MapLibre
   * Incorporates parallel offset rendering for shared multi-line segments (Option 1 Mini Metro style)
   */
  const updateMapNetworkLayers = useCallback(
    (currentDiscovered: Set<string>) => {
      const map = mapRef.current;
      if (!map || !isLoadedRef.current) return;

      // 1. First pass: count lines on each segment to detect shared corridors (e.g. Montparnasse <-> Denfert)
      const segmentLinesMap = new Map<string, string[]>();
      selectedLines.forEach((line) => {
        const topo = METRO_LINE_TOPOLOGY[line];
        if (!topo) return;
        for (let i = 0; i < topo.length - 1; i++) {
          const s1 = topo[i];
          const s2 = topo[i + 1];
          if (currentDiscovered.has(s1) && currentDiscovered.has(s2)) {
            const key = getCanonicalPairKey(s1, s2);
            const list = segmentLinesMap.get(key) || [];
            if (!list.includes(line)) list.push(line);
            segmentLinesMap.set(key, list);
          }
        }
      });

      // 2. Second pass: build GeoJSON features per line with calculated offset
      selectedLines.forEach((line) => {
        const topo = METRO_LINE_TOPOLOGY[line];
        if (!topo) return;
        const features: GeoJSON.Feature[] = [];

        for (let i = 0; i < topo.length - 1; i++) {
          const s1Id = topo[i];
          const s2Id = topo[i + 1];

          if (currentDiscovered.has(s1Id) && currentDiscovered.has(s2Id)) {
            const st1 = METRO_TOPOLOGY_STATIONS.find((s) => s.id === s1Id);
            const st2 = METRO_TOPOLOGY_STATIONS.find((s) => s.id === s2Id);

            if (st1 && st2) {
              const pairKey = getCanonicalPairKey(s1Id, s2Id);
              const linesInSegment = segmentLinesMap.get(pairKey) || [line];
              const offsetPx = getLineSegmentOffset(line, linesInSegment, 5.5);

              // Use canonical coordinate order (s1Id < s2Id) so offset sign remains constant across lines
              const coords =
                s1Id < s2Id ? [st1.coords, st2.coords] : [st2.coords, st1.coords];

              features.push({
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: coords,
                },
                properties: {
                  line,
                  offset: offsetPx,
                },
              });
            }
          }
        }

        const source = map.getSource(`line-track-${line}`) as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features,
          });
        }
      });
    },
    [selectedLines]
  );

  /**
   * Adds or updates a station marker on the map
   */
  const renderStationMarker = useCallback(
    (station: MetroStationTopology) => {
      const map = mapRef.current;
      if (!map) return;

      // Existing marker
      if (markersMapRef.current.has(station.id)) {
        return;
      }

      const el = document.createElement("div");
      el.className = "group relative cursor-pointer select-none";

      const dotsHtml = station.lines
        .map(
          (line) => `
          <span style="background-color: ${METRO_LINE_COLORS[line]?.bg || "#fff"}; color: ${
            METRO_LINE_COLORS[line]?.text || "#000"
          };" class="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm">
            ${line}
          </span>
        `
        )
        .join("");

      el.innerHTML = `
        <div class="flex items-center -space-x-1.5 p-1 rounded-full bg-slate-950/90 border-2 border-white shadow-xl transition-transform hover:scale-125">
          ${dotsHtml}
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-0.5 rounded-md bg-slate-900/95 border border-slate-700 text-white text-[11px] font-bold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ${station.name}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(station.coords)
        .addTo(map);

      markersMapRef.current.set(station.id, marker);
    },
    []
  );

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
      center: [2.3488, 48.8534], // Central Paris
      zoom: 12.3,
      minZoom: 10.5,
      maxZoom: 16.5,
      attributionControl: false,
    });

    map.on("load", () => {
      isLoadedRef.current = true;
      mapRef.current = map;

      // Register layers for each line (glow layer + sharp core layer)
      selectedLines.forEach((line) => {
        if (!map.getSource(`line-track-${line}`)) {
          map.addSource(`line-track-${line}`, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          // Glow layer
          map.addLayer({
            id: `line-track-${line}-glow`,
            type: "line",
            source: `line-track-${line}`,
            paint: {
              "line-color": METRO_LINE_COLORS[line]?.bg || "#FFCD00",
              "line-width": 8,
              "line-opacity": 0.35,
              "line-blur": 4,
              "line-offset": ["coalesce", ["get", "offset"], 0],
            },
          });

          // Core sharp layer
          map.addLayer({
            id: `line-track-${line}-main`,
            type: "line",
            source: `line-track-${line}`,
            paint: {
              "line-color": METRO_LINE_COLORS[line]?.bg || "#FFCD00",
              "line-width": 4,
              "line-opacity": 0.95,
              "line-offset": ["coalesce", ["get", "offset"], 0],
            },
          });
        }
      });

      // Render already discovered stations
      discoveredIds.forEach((id) => {
        const s = METRO_TOPOLOGY_STATIONS.find((item) => item.id === id);
        if (s) renderStationMarker(s);
      });

      // Update lines
      updateMapNetworkLayers(discoveredIds);
    });

    // Map click handler
    map.on("click", (e) => {
      const clickCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setPendingGuess(clickCoords);

      // Create or update orange pending pin
      if (!pendingMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-xl animate-bounce flex items-center justify-center text-[10px] text-slate-950 font-black";
        el.innerHTML = "📍";
        pendingMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(clickCoords)
          .addTo(map);
      } else {
        pendingMarkerRef.current.setLngLat(clickCoords);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, []); // Run once on mount

  /**
   * Validates the pending guess against current target station
   */
  const handleValidatePlacement = () => {
    if (!currentTarget || !pendingGuess) return;

    const distMeters = getDistanceMeters(pendingGuess, currentTarget.coords);

    // Tolerance validation check
    let isAccepted = false;
    if (tolerance === "chill") {
      isAccepted = true;
    } else {
      const maxAllowed = parseInt(tolerance, 10);
      isAccepted = distMeters <= maxAllowed;
    }

    if (!isAccepted) {
      setFeedback({
        type: "error",
        text: `À ${distMeters} m — Trop éloigné du seuil (${tolerance} m). Rapprochez-vous !`,
        distance: distMeters,
      });
      return;
    }

    // Success! Station anchored
    const nextDiscovered = new Set(discoveredIds);
    nextDiscovered.add(currentTarget.id);
    setDiscoveredIds(nextDiscovered);
    saveProgress(nextDiscovered);

    // Remove pending marker
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    // Render discovered station marker
    renderStationMarker(currentTarget);

    // Update lines with newly illuminated tracks
    updateMapNetworkLayers(nextDiscovered);

    // Check what tracks got unlocked
    const newTracks: string[] = [];
    currentTarget.lines.forEach((line) => {
      const topo = METRO_LINE_TOPOLOGY[line];
      if (!topo) return;
      const idx = topo.indexOf(currentTarget.id);
      if (idx > 0 && nextDiscovered.has(topo[idx - 1])) {
        const prev = METRO_TOPOLOGY_STATIONS.find((s) => s.id === topo[idx - 1]);
        if (prev) newTracks.push(`${currentTarget.name} ↔ ${prev.name} (L${line})`);
      }
      if (idx < topo.length - 1 && nextDiscovered.has(topo[idx + 1])) {
        const next = METRO_TOPOLOGY_STATIONS.find((s) => s.id === topo[idx + 1]);
        if (next) newTracks.push(`${currentTarget.name} ↔ ${next.name} (L${line})`);
      }
    });

    const unlockText =
      newTracks.length > 0
        ? ` • Tronçon débloqué : ${newTracks.join(", ")}`
        : "";

    setFeedback({
      type: "success",
      text: `Station ${currentTarget.name} ancrée à ${distMeters} m !${unlockText}`,
      distance: distMeters,
    });

    // Animate camera softly towards target
    mapRef.current?.flyTo({
      center: currentTarget.coords,
      zoom: 13.5,
      duration: 600,
    });

    // Advance to next station
    setTimeout(() => {
      pickNextStation(nextDiscovered);
    }, 900);
  };

  /**
   * Resets entire discovered network
   */
  const handleResetNetwork = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDiscoveredIds(new Set());

    // Clear all markers
    markersMapRef.current.forEach((marker) => marker.remove());
    markersMapRef.current.clear();

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    // Clear lines
    updateMapNetworkLayers(new Set());

    setShowConfirmReset(false);
    setIsCompletedModalOpen(false);
    setFeedback({ type: "info", text: "Réseau réinitialisé à zéro." });

    pickNextStation(new Set());
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Standardized Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 h-14 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
        {/* Left: QuickMenuDrawer + Back to Lobby + Hub Link + Game Branding */}
        <div className="flex items-center gap-2 shrink-0">
          <QuickMenuDrawer />

          <button
            type="button"
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm whitespace-nowrap"
            title="Retour au lobby de sélection"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lobby</span>
          </button>

          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm whitespace-nowrap"
            title="Retour au Hub d'accueil"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <span className="text-xs">🚇</span>
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white hidden sm:block whitespace-nowrap">
              Retrace le Réseau
            </h1>
          </div>
        </div>

        {/* Center: Mode Indicator (Custom) + Lines Selector + Tolerance Selector + Live Metric Corridor */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={onOpenCustomModal}
              className="px-2.5 py-1 rounded-lg flex items-center gap-1 bg-purple-600 text-white font-semibold shadow-sm whitespace-nowrap"
              title="Mode Défi Custom actif"
            >
              <Sliders className="w-3 h-3 text-purple-200" />
              <span>Custom</span>
            </button>
          </div>

          {/* Territory / Lines Selector */}
          <button
            type="button"
            onClick={onOpenCustomModal}
            className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-xs transition-all shadow-sm cursor-pointer shrink-0"
            title="Modifier les lignes sélectionnées"
          >
            <span className="text-sm shrink-0">🚇</span>
            <span className="font-bold text-white group-hover:text-purple-300 transition-colors hidden sm:inline whitespace-nowrap">
              {selectedLines.length === 16 ? "Tout le Réseau (16L)" : `${selectedLines.length} Lignes`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform shrink-0" />
          </button>

          {/* Tolerance Selector Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm text-xs shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase hidden md:inline">Tolérance :</span>
            <select
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
              title="Ajuster le seuil de distance de validation"
            >
              <option value="chill" className="bg-slate-900 text-white">Chill (Libre)</option>
              <option value="500" className="bg-slate-900 text-white">500 m</option>
              <option value="300" className="bg-slate-900 text-white">300 m (Standard)</option>
              <option value="150" className="bg-slate-900 text-white">150 m (Expert)</option>
              <option value="75" className="bg-slate-900 text-white">75 m (Puriste)</option>
            </select>
          </div>

          {/* Mission Progress Corridor (Desktop) */}
          <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner whitespace-nowrap shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progression :</span>
            <span className="font-extrabold text-amber-400">{progressPercent}%</span>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span><strong>{discoveredIds.size}</strong>/{activeStations.length} st.</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Layers className="w-3 h-3 text-blue-400" />
              <span><strong>{connectedSegmentsCount}</strong>/{TOTAL_METRO_SEGMENTS} tr.</span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Help & UserNav */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Progress Badge (< xl) */}
          <div className="flex xl:hidden items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-amber-400 shrink-0">
            <span>{progressPercent}%</span>
            <span className="text-slate-500 font-normal hidden sm:inline">({discoveredIds.size}/{activeStations.length})</span>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0"
            title="Réinitialiser le réseau découvert"
            aria-label="Réinitialiser le réseau découvert"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>

          {/* Lines & Settings Modal Trigger */}
          <button
            type="button"
            onClick={onOpenCustomModal}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border border-purple-500/40 transition-all text-xs shrink-0"
            title="Configurer les lignes & options"
            aria-label="Configurer les lignes & options"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Rules / Help Trigger */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0"
            title="Règles du jeu"
            aria-label="Règles du jeu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Profile */}
          <UserNav compact />
        </div>
      </header>

      {/* Target Station Floating Action Card (Bottom Center) */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-none">
        {currentTarget ? (
          <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-400">
                    Station à placer
                  </span>
                  <div className="flex items-center gap-1">
                    {currentTarget.lines.map((l) => (
                      <span
                        key={l}
                        style={{
                          backgroundColor: METRO_LINE_COLORS[l]?.bg || "#FFCD00",
                          color: METRO_LINE_COLORS[l]?.text || "#000",
                        }}
                        className="px-1.5 py-0.5 rounded-full font-black text-[10px] shadow-sm"
                      >
                        L{l}
                      </span>
                    ))}
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {currentTarget.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentTarget.hint}
                </p>
              </div>

              {/* Validate placement button */}
              <button
                type="button"
                onClick={handleValidatePlacement}
                disabled={!pendingGuess}
                className={`py-3 px-5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg ${
                  pendingGuess
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 active:scale-95 cursor-pointer"
                    : "bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Valider l'ancrage</span>
              </button>
            </div>

            {/* Instruction or Feedback Message */}
            {feedback ? (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                  feedback.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-200"
                    : feedback.type === "error"
                    ? "bg-rose-950/60 border border-rose-500/40 text-rose-200 animate-shake"
                    : "bg-slate-800/60 text-slate-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{feedback.text}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {pendingGuess
                    ? "Point placé. Cliquez sur 'Valider l'ancrage' pour vérifier."
                    : "Cliquez sur la carte où vous pensez que se trouve la station."}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="pointer-events-auto bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl text-center">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h3 className="text-lg font-black text-white">Réseau 100% Retracé !</h3>
            <p className="text-xs text-slate-300 mt-1">
              Vous avez relié l'intégralité des stations et des tronçons.
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="mt-3 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Recommencer un nouveau tracé
            </button>
          </div>
        )}
      </footer>

      {/* Confirmation Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Réinitialiser le Réseau ?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Toutes vos stations découvertes et tronçons illuminés seront effacés.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetNetwork}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Confirmer l'effacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules / Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <span className="text-sm">🚇</span>
                </div>
                <h3 className="text-base font-black text-white">Règles — Retrace le Réseau</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  1. Ancrer chaque station
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Une station vous est désignée. Cliquez sur son emplacement sur la carte muette de Paris, puis validez votre ancrage.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  2. Illuminer les tronçons (Mini Metro)
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Dès que deux stations adjacentes d'une même ligne sont ancrées, les rails s'illuminent avec les couleurs officielles RATP. Les tronçons partagés tracent des voies parallèles distinctes.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  3. Tolérance & Sauvegarde
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Ajustez la tolérance selon votre niveau (Chill à Puriste 75 m). Votre avancée est sauvegardée automatiquement dans votre navigateur.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30 mt-1"
            >
              Compris, continuer à jouer
            </button>
          </div>
        </div>
      )}

      {/* 100% Network Completed Celebration Modal */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Chef de Réseau Émérite !
              </h2>
              <p className="text-xs text-slate-300 mt-1.5">
                Vous avez retracé avec brio l'intégralité des stations et des tronçons du Métro de Paris.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Stations</span>
                <span className="text-white font-black text-base">{activeStations.length} / {activeStations.length}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Tronçons</span>
                <span className="text-emerald-400 font-black text-base">{TOTAL_METRO_SEGMENTS}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={onBackToLobby}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg"
              >
                Retour au Hub des Jeux
              </button>
              <button
                type="button"
                onClick={handleResetNetwork}
                className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Recommencer une partie à zéro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
