"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import {
  ArrowLeft,
  RotateCcw,
  Sliders,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MapPin,
  Check,
  X,
  ArrowRight,
  Settings,
} from "lucide-react";
import { useSettings } from "@/lib/settings/useSettings";
import { BASEMAP_STYLES } from "@/components/map/BlindPointMap";
import { BlindPointMapTheme } from "@/lib/games/blindpoint/types";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";
import { RestartConfirmModal } from "@/components/game/RestartConfirmModal";
import {
  ALL_METRO_LINES,
  METRO_TOPOLOGY_STATIONS,
  METRO_LINE_TOPOLOGY,
  METRO_LINE_COLORS,
  MetroStationTopology,
  getDistanceMeters,
  getCanonicalPairKey,
  getLineSegmentOffset,
} from "@/lib/games/blindpoint/data/metro_topology";

export interface BlindPointRetraceGameProps {
  initialTolerance?: string; // "chill", "500", "300", "150", "75"
  initialOrderMode?: "random" | "sequential";
  selectedLines?: string[];
  onBackToLobby: () => void;
  onOpenCustomModal: () => void;
}

export const BlindPointRetraceGame: React.FC<BlindPointRetraceGameProps> = ({
  initialTolerance = "300",
  initialOrderMode = "random",
  selectedLines = ["1", "4", "6"],
  onBackToLobby,
  onOpenCustomModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Filter stations based on selected lines
  const activeStations = useMemo(() => {
    return METRO_TOPOLOGY_STATIONS.filter((s) =>
      s.lines.some((l) => selectedLines.includes(l))
    );
  }, [selectedLines]);

  // Sort selected lines according to official metro order (1, 2, ..., 14)
  const sortedSelectedLines = useMemo(() => {
    const lineOrder = ALL_METRO_LINES.map((l) => l.id);
    return [...selectedLines].sort((a, b) => {
      const idxA = lineOrder.indexOf(a);
      const idxB = lineOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [selectedLines]);

  // Game state (Zéro persistance cross-session : chaque nouvelle partie démarre vierge)
  const [tolerance, setTolerance] = useState<string>(initialTolerance);
  const [orderMode, setOrderMode] = useState<"random" | "sequential">(initialOrderMode);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(() => new Set());

  // Visual Map Theme (Sombre, Clair, Satellite)
  const [mapTheme, setMapTheme] = useState<BlindPointMapTheme>("dark");
  const currentThemeRef = useRef<BlindPointMapTheme>("dark");

  // Settings modal visibility (Roue crantée ⚙️)
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Proactive cleanup : purge toute ancienne session stockée dans le navigateur
  useEffect(() => {
    try {
      localStorage.removeItem("geohub_retrace_metro_discovered");
    } catch {
      // ignore
    }
  }, []);

  // Synchronise les états locaux en cas de changement de props
  useEffect(() => {
    setTolerance(initialTolerance);
  }, [initialTolerance]);

  useEffect(() => {
    setOrderMode(initialOrderMode);
  }, [initialOrderMode]);

  // User settings (Passage auto partagé avec GeoRings)
  const { settings: appSettings, updateSetting } = useSettings();
  const autoAdvance = appSettings.autoAdvance;

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

  // Review state after successful station validation (identique à la mécanique GeoRings)
  const [reviewState, setReviewState] = useState<{
    station: MetroStationTopology;
    distMeters: number;
    newTracks: string[];
    nextDiscovered: Set<string>;
  } | null>(null);

  const reviewStateRef = useRef<typeof reviewState>(null);
  useEffect(() => {
    reviewStateRef.current = reviewState;
  }, [reviewState]);

  const [reviewTimeLeftMs, setReviewTimeLeftMs] = useState(1500);

  // Pick next station to place
  const pickNextStation = useCallback(
    (currentDiscovered: Set<string>) => {
      const undiscovered = activeStations.filter((s) => !currentDiscovered.has(s.id));
      if (undiscovered.length === 0) {
        setCurrentTarget(null);
        setIsCompletedModalOpen(true);
        return;
      }
      // Pick next in sequence or randomly according to orderMode
      let next: MetroStationTopology;
      if (orderMode === "sequential") {
        next = undiscovered[0];
      } else {
        const randomIndex = Math.floor(Math.random() * undiscovered.length);
        next = undiscovered[randomIndex];
      }
      setCurrentTarget(next);
      setPendingGuess(null);
    },
    [activeStations, orderMode]
  );

  // Smoothly advances to the next target station & dezooms camera to Paris overview
  const handleProceedNextStation = useCallback(() => {
    if (!reviewStateRef.current) return;

    const { nextDiscovered } = reviewStateRef.current;
    setReviewState(null);
    setFeedback(null);

    // Dézoom fluide vers la vue globale de Paris
    mapRef.current?.flyTo({
      center: [2.3488, 48.8534],
      zoom: 12.3,
      duration: 600,
      pitch: 0,
      bearing: 0,
    });

    // Proposer la station suivante
    pickNextStation(nextDiscovered);
  }, [pickNextStation]);

  // Auto-advance countdown timer (1.5s)
  useEffect(() => {
    if (!reviewState || !autoAdvance) {
      setReviewTimeLeftMs(1500);
      return;
    }

    setReviewTimeLeftMs(1500);
    const intervalMs = 100;
    const timer = setInterval(() => {
      setReviewTimeLeftMs((prev) => {
        if (prev <= intervalMs) {
          clearInterval(timer);
          handleProceedNextStation();
          return 0;
        }
        return prev - intervalMs;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [reviewState, autoAdvance, handleProceedNextStation]);

  const reviewProgressPercent = Math.max(
    0,
    Math.min(100, ((1500 - reviewTimeLeftMs) / 1500) * 100)
  );
  const reviewSecondsLeft = Math.ceil(reviewTimeLeftMs / 1000);

  // Initialize or resume next target
  useEffect(() => {
    pickNextStation(discoveredIds);
  }, [activeStations, pickNextStation]);

  const progressPercent = useMemo(() => {
    if (activeStations.length === 0) return 0;
    return Math.round((discoveredIds.size / activeStations.length) * 100);
  }, [discoveredIds.size, activeStations.length]);

  /**
   * Updates line track layers on MapLibre
   * Incorporates parallel offset rendering for shared multi-line segments (Mini Metro style)
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
      el.className = "group relative cursor-pointer select-none flex items-center justify-center";
      el.style.width = "0px";
      el.style.height = "0px";

      const dotsHtml = station.lines
        .map(
          (line) => `
          <span style="background-color: ${METRO_LINE_COLORS[line]?.bg || "#fff"}; color: ${
            METRO_LINE_COLORS[line]?.text || "#000"
          };" class="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm shrink-0">
            ${line}
          </span>
        `
        )
        .join("");

      el.innerHTML = `
        <div class="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center -space-x-1.5 p-1 rounded-full bg-slate-950/90 border-2 border-white shadow-xl transition-transform hover:scale-125 shrink-0 pointer-events-auto">
          ${dotsHtml}
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-2 py-0.5 rounded-md bg-slate-900/95 border border-slate-700 text-white text-[11px] font-bold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ${station.name}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(station.coords)
        .addTo(map);

      markersMapRef.current.set(station.id, marker);
    },
    []
  );

  /**
   * Setup map sources and layers (guess point + metro tracks)
   */
  const setupHardwareLayers = useCallback(
    (map: maplibregl.Map) => {
      // Hardware-accelerated Guess Point
      if (!map.getSource("guess-source")) {
        map.addSource("guess-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        // Drop shadow
        map.addLayer({
          id: "guess-shadow",
          type: "circle",
          source: "guess-source",
          paint: {
            "circle-radius": 13,
            "circle-color": "#020617",
            "circle-opacity": 0.5,
          },
        });

        // Contrasting white border ring
        map.addLayer({
          id: "guess-outer",
          type: "circle",
          source: "guess-source",
          paint: {
            "circle-radius": 10,
            "circle-color": "#ffffff",
            "circle-opacity": 0.98,
          },
        });

        // Classic BlindPoint Blue
        map.addLayer({
          id: "guess-inner",
          type: "circle",
          source: "guess-source",
          paint: {
            "circle-radius": 7.5,
            "circle-color": "#2563eb",
          },
        });
      }

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
    },
    [selectedLines]
  );

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const rawStyle = BASEMAP_STYLES[mapTheme] || BASEMAP_STYLES.dark;
    const initialStyle =
      typeof rawStyle === "object" ? JSON.parse(JSON.stringify(rawStyle)) : rawStyle;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [2.3488, 48.8534], // Central Paris
      zoom: 12.3,
      minZoom: 10.5,
      maxZoom: 16.5,
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      minPitch: 0,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      attributionControl: false,
    });

    map.on("load", () => {
      isLoadedRef.current = true;
      mapRef.current = map;
      map.resize();
      map.getCanvas().style.cursor = "crosshair";

      setupHardwareLayers(map);

      // Render already discovered stations
      discoveredIds.forEach((id) => {
        const s = METRO_TOPOLOGY_STATIONS.find((item) => item.id === id);
        if (s) renderStationMarker(s);
      });

      // Update lines
      updateMapNetworkLayers(discoveredIds);
    });

    // Map click handler (positionnement instantané au pixel près)
    map.on("click", (e) => {
      if (reviewStateRef.current) return;
      const wrapped = e.lngLat.wrap();
      const clickCoords: [number, number] = [wrapped.lng, wrapped.lat];
      setPendingGuess(clickCoords);
    });

    // ResizeObserver pour adapter la carte immédiatement à tout changement de taille
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, []); // Run once on mount

  // Basemap style switcher effect (Sombre, Clair, Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    if (currentThemeRef.current === mapTheme) return;
    currentThemeRef.current = mapTheme;

    const rawStyle = BASEMAP_STYLES[mapTheme] || BASEMAP_STYLES.dark;
    const nextStyle =
      typeof rawStyle === "object" ? JSON.parse(JSON.stringify(rawStyle)) : rawStyle;

    let restored = false;
    const restoreAllLayers = () => {
      if (restored) return;
      if (!map.isStyleLoaded()) return;
      restored = true;
      map.off("styledata", restoreAllLayers);
      setupHardwareLayers(map);
      updateMapNetworkLayers(discoveredIds);

      // Restore pending guess point on new style
      const source = map.getSource("guess-source") as maplibregl.GeoJSONSource | undefined;
      if (source && pendingGuess) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [pendingGuess[0], pendingGuess[1]],
              },
              properties: {
                type: "guess",
              },
            },
          ],
        });
      }
    };

    map.on("styledata", restoreAllLayers);
    map.setStyle(nextStyle, { diff: false });
  }, [mapTheme, setupHardwareLayers, updateMapNetworkLayers, discoveredIds, pendingGuess]);

  // Synchronise le point d'estimation WebGL (identique à BlindPoint classique)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    const source = map.getSource("guess-source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (!pendingGuess) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [pendingGuess[0], pendingGuess[1]],
            },
            properties: {
              type: "guess",
            },
          },
        ],
      });
    }
  }, [pendingGuess]);

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

    setPendingGuess(null);

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

    setFeedback({
      type: "success",
      text: `Station ${currentTarget.name} ancrée à ${distMeters} m !`,
      distance: distMeters,
    });

    // Animate camera softly towards target to reveal newly anchored station & tracks
    mapRef.current?.flyTo({
      center: currentTarget.coords,
      zoom: 13.2,
      duration: 500,
      pitch: 0,
      bearing: 0,
    });

    // Enter review state (identique à GeoRings)
    setReviewState({
      station: currentTarget,
      distMeters,
      newTracks,
      nextDiscovered,
    });
  };

  // Global Keyboard listener: Space / Enter to validate placement OR advance to next station
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isCompletedModalOpen ||
        showConfirmReset ||
        showHelp ||
        showSettingsModal
      ) {
        return;
      }

      if (e.code === "Space" || e.key === "Enter") {
        if (reviewStateRef.current) {
          e.preventDefault();
          handleProceedNextStation();
        } else if (pendingGuess) {
          e.preventDefault();
          handleValidatePlacement();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    pendingGuess,
    handleProceedNextStation,
    isCompletedModalOpen,
    showConfirmReset,
    showHelp,
    showSettingsModal,
  ]);

  /**
   * Resets entire discovered network
   */
  const handleResetNetwork = () => {
    try {
      localStorage.removeItem("geohub_retrace_metro_discovered");
    } catch {
      // ignore
    }
    setDiscoveredIds(new Set());
    setReviewState(null);

    // Clear all markers
    markersMapRef.current.forEach((marker) => marker.remove());
    markersMapRef.current.clear();

    setPendingGuess(null);

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
        {/* Left: QuickMenuDrawer + Back to Lobby + Game Branding + Custom Modal Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <QuickMenuDrawer />

          <button
            type="button"
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all shadow-sm whitespace-nowrap cursor-pointer"
            title="Retour au lobby de sélection"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lobby</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <span className="text-xs">🚇</span>
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white hidden sm:block whitespace-nowrap">
              Retrace le Réseau
            </h1>
          </div>

          {/* Mode Switcher : SEUL bouton ouvrant la modale de configuration des lignes */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium shrink-0 ml-1">
            <button
              type="button"
              onClick={onOpenCustomModal}
              className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
              title="Configurer les lignes du défi personnalisé"
            >
              <Sliders className="w-3 h-3 text-purple-200" />
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* Center: Informative Configuration Badge with all selected line pastilles */}
        <div className="flex items-center justify-center shrink-0 min-w-0">
          <div
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm shrink-0 select-none max-w-[48vw] overflow-x-auto no-scrollbar"
            title={`Lignes sélectionnées : ${sortedSelectedLines.map((l) => `Ligne ${l}`).join(", ")}`}
          >
            <span className="text-sm shrink-0">🚇</span>
            <div className="flex items-center gap-1 shrink-0">
              {sortedSelectedLines.map((lineId) => {
                const info = METRO_LINE_COLORS[lineId];
                const bg = info?.bg || "#FFCD00";
                const text = info?.text || "#000000";
                const num = info?.num || lineId;

                return (
                  <span
                    key={lineId}
                    style={{ backgroundColor: bg, color: text }}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shadow-sm shrink-0 leading-none select-none"
                    title={`Ligne ${lineId}`}
                  >
                    {num}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Actions, Settings (⚙️), Help & UserNav */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Reset Button */}
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0 cursor-pointer"
            title="Réinitialiser le réseau découvert"
            aria-label="Réinitialiser le réseau découvert"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>

          {/* Settings Modal Trigger (Roue Crantée ⚙️) */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0 cursor-pointer"
            title="Paramètres de la partie (Thème, Tolérance, Ordre)"
            aria-label="Paramètres de la partie"
          >
            <Settings className="w-4 h-4 text-purple-400 hover:text-purple-300" />
          </button>

          {/* Rules / Help Trigger */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs shrink-0 cursor-pointer"
            title="Règles du jeu"
            aria-label="Règles du jeu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Profile */}
          <UserNav compact />
        </div>
      </header>

      {/* Floating Progression Card (Sleek Glassmorphic Widget) */}
      <div className="absolute top-16 sm:top-18 right-3 sm:right-5 z-20 pointer-events-auto">
        <div className="bg-slate-900/90 hover:bg-slate-900/95 transition-colors border border-slate-800/80 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xl flex flex-col gap-1.5 min-w-[170px] sm:min-w-[190px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Progression
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-400">
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Stations</span>
            </span>
            <span className="font-bold text-white">
              <span className="text-emerald-400">{discoveredIds.size}</span>
              <span className="text-slate-500 font-normal"> / {activeStations.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Target Station Floating Action Card (Bottom Center) */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-none">
        {reviewState ? (
          <div className="pointer-events-auto bg-slate-900/95 border border-emerald-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left: Validated Station Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Station Ancrée
                  </span>
                  <div className="flex items-center gap-1">
                    {reviewState.station.lines.map((l) => (
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
                  {reviewState.station.name}
                </h2>
                <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                  Ancrée à {reviewState.distMeters} m du point réel
                </p>
              </div>

              {/* Right: Proceed button + Auto-advance switch (identique GeoRings) */}
              <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {/* Next Station Button */}
                <button
                  type="button"
                  onClick={handleProceedNextStation}
                  className="relative overflow-hidden flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all cursor-pointer group"
                >
                  {autoAdvance && (
                    <span
                      className="absolute left-0 top-0 bottom-0 bg-white/25 transition-all pointer-events-none"
                      style={{ width: `${reviewProgressPercent}%` }}
                    />
                  )}
                  <span className="relative z-10">Station suivante</span>
                  <kbd className="relative z-10 px-1.5 py-0.5 rounded bg-purple-900/80 border border-purple-400/40 font-mono text-[9px] text-purple-200">
                    {autoAdvance ? `${reviewSecondsLeft}s` : "Espace"}
                  </kbd>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="h-6 w-px bg-slate-800" />

                {/* Auto-Advance Toggle Switch */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="retrace-auto-advance"
                    className="text-xs text-slate-300 font-medium select-none cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Auto</span>
                  </label>
                  <button
                    type="button"
                    id="retrace-auto-advance"
                    role="switch"
                    aria-checked={autoAdvance}
                    onClick={() => updateSetting("autoAdvance", !autoAdvance)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-slate-700 transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoAdvance ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                    title={autoAdvance ? "Passage automatique actif (1.5s)" : "Activer le passage automatique (1.5s)"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                        autoAdvance ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : currentTarget ? (
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
                {pendingGuess && (
                  <kbd className="px-1.5 py-0.5 rounded bg-emerald-700/80 border border-emerald-400/40 font-mono text-[9px] text-emerald-100">
                    Espace
                  </kbd>
                )}
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
                    ? "Point placé. Cliquez sur 'Valider l'ancrage' ou appuyez sur Espace."
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
              Vous avez positionné l'intégralité des stations du défi.
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="mt-3 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
            >
              Recommencer un nouveau tracé
            </button>
          </div>
        )}
      </footer>

      {/* Settings Modal (Roue crantée ⚙️) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Réglages du Tracé</h3>
                  <p className="text-[11px] text-slate-400">Options visuelles et mécaniques de jeu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Section 1: Thème de Carte */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Calque Visuel de la Carte
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "dark" as const, label: "Sombre", icon: "🌑", desc: "Nuit contrastée" },
                    { id: "voyager" as const, label: "Clair", icon: "☀️", desc: "Ivoire naturel" },
                    { id: "satellite" as const, label: "Satellite", icon: "🛰️", desc: "Photo HD" },
                  ].map((theme) => {
                    const isSelected = mapTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setMapTheme(theme.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/25 border-purple-500 text-white ring-1 ring-purple-500/60 shadow-lg shadow-purple-500/20"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="text-base mb-1">{theme.icon}</span>
                        <span className="font-bold text-xs">{theme.label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{theme.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Tolérance de validation */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Tolérance de Validation
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: "chill", label: "Chill", desc: "Libre" },
                    { id: "500", label: "500 m", desc: "Large" },
                    { id: "300", label: "300 m", desc: "Standard" },
                    { id: "150", label: "150 m", desc: "Expert" },
                    { id: "75", label: "75 m", desc: "Puriste" },
                  ].map((t) => {
                    const isSelected = tolerance === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTolerance(t.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="font-bold text-xs">{t.label}</span>
                        <span className="text-[9px] text-slate-400">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Ordre d'apparition */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Ordre d'Apparition des Stations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "random" as const, label: "🔀 Aléatoire", desc: "Dans le désordre" },
                    { id: "sequential" as const, label: "📏 Séquentiel", desc: "Station par station" },
                  ].map((o) => {
                    const isSelected = orderMode === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOrderMode(o.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/25 border-purple-500 text-purple-200 ring-1 ring-purple-500/60"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="font-bold text-xs">{o.label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{o.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Passage automatique */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200 block">Passage Automatique</span>
                  <span className="text-[11px] text-slate-400">
                    Enchaîner à la station suivante en 1.5s
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAdvance}
                  onClick={() => updateSetting("autoAdvance", !autoAdvance)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-slate-700 transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoAdvance ? "bg-emerald-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                      autoAdvance ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Enregistrer et Fermer
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Reset Modal */}
      <RestartConfirmModal
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={handleResetNetwork}
        title="Réinitialiser le réseau ?"
        message="Êtes-vous sûr de vouloir recommencer ? Toutes vos stations découvertes sur ce réseau seront effacées."
        confirmLabel="Recommencer"
        cancelLabel="Annuler"
      />

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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                  Une station vous est désignée. Cliquez sur son emplacement sur la carte muette de Paris, puis validez votre ancrage (ou appuyez sur Espace).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span className="text-xs">🚇</span>
                  2. Tracé des lignes
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Dès que deux stations adjacentes d'une même ligne sont ancrées, les rails s'illuminent avec les couleurs officielles RATP.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  3. Tolérance & Réglages
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Ajustez la vue de la carte (Sombre, Clair, Satellite), la tolérance de distance et l'ordre des stations via l'icône réglages ⚙️.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30 mt-1 cursor-pointer"
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
                Vous avez ancré avec succès l'intégralité des stations du défi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-slate-400 text-xs uppercase font-bold block mb-1">
                Stations Ancrées
              </span>
              <span className="text-emerald-400 font-black text-2xl">
                {discoveredIds.size} / {activeStations.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={onBackToLobby}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg cursor-pointer"
              >
                Retour au Lobby
              </button>
              <button
                type="button"
                onClick={handleResetNetwork}
                className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
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
