"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BorderPathPack,
  BorderPathMode,
  BorderPathMapTheme,
} from "@/lib/games/borderpath/types";
import {
  MetroStation,
  MetroLine,
  MetroHop,
} from "@/lib/games/borderpath/metroTypes";
import {
  METRO_STATIONS_MAP,
  METRO_LINES_MAP,
  generateMetroChallenge,
  validateMetroHop,
} from "@/lib/games/borderpath/metroEngine";
import { BASEMAP_STYLES } from "../BorderPathMap";
import { MetroLineDrawer } from "./MetroLineDrawer";
import { BorderPathHUD } from "../BorderPathHUD";
import { BorderPathRulesModal } from "../BorderPathRulesModal";
import { BorderPathPackModal } from "../BorderPathPackModal";
import { BorderPathSettingsModal } from "../BorderPathSettingsModal";
import { RestartConfirmModal } from "../../RestartConfirmModal";
import {
  Train,
  Target,
  Compass,
  RotateCcw,
  Navigation,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import metroTopologyData from "@/../public/data/geo/metro_paris_topology.json";

interface BorderPathMetroActiveGameProps {
  pack: BorderPathPack;
  mode: BorderPathMode;
  seed: string;
  theme: BorderPathMapTheme;
  setTheme: React.Dispatch<React.SetStateAction<BorderPathMapTheme>>;
  hideBorders: boolean;
  setHideBorders: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BorderPathMetroActiveGame: React.FC<BorderPathMetroActiveGameProps> = ({
  pack,
  mode,
  seed,
  theme,
  setTheme,
  hideBorders,
  setHideBorders,
}) => {
  const router = useRouter();

  // Modals state
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Challenge Session
  const [challenge] = useState(() => generateMetroChallenge(seed));
  const { startStation, targetStation, optimal } = challenge;

  // Game state
  const [currentStationId, setCurrentStationId] = useState<string>(startStation.id);
  const [hops, setHops] = useState<MetroHop[]>([]);
  const [visitedStationIds, setVisitedStationIds] = useState<string[]>([startStation.id]);
  const [visitedSegments, setVisitedSegments] = useState<
    { lineId: string; u: string; v: string }[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDrawerLineId, setSelectedDrawerLineId] = useState<string>(() => {
    return startStation.lines[0] || "1";
  });

  // Current Station Object
  const currentStation = METRO_STATIONS_MAP[currentStationId] || startStation;

  // MapLibre refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isMapLoadedRef = useRef(false);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Distinct lines used
  const distinctLinesCount = useMemo(() => {
    const lines = new Set(hops.map((h) => h.lineId));
    return lines.size;
  }, [hops]);

  // Total stations traversed count
  const totalStationsTraversed = useMemo(() => {
    return hops.reduce((acc, h) => acc + h.stationsCount, 0);
  }, [hops]);

  // Orthodromic distance to target in km
  const distanceToTargetKm = useMemo(() => {
    const R = 6371;
    const lat1 = (currentStation.latitude * Math.PI) / 180;
    const lat2 = (targetStation.latitude * Math.PI) / 180;
    const dLat = ((targetStation.latitude - currentStation.latitude) * Math.PI) / 180;
    const dLng = ((targetStation.longitude - currentStation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }, [currentStation, targetStation]);

  // Build GeoJSON features for the entire phantom network
  const phantomNetworkGeoJSON = useMemo(() => {
    const stMap = new Map<string, [number, number]>();
    (
      metroTopologyData.stations as unknown as { id: string; coords: [number, number] }[]
    ).forEach((s) => {
      stMap.set(s.id, s.coords);
    });

    const features: GeoJSON.Feature[] = [];

    (
      metroTopologyData.lines as unknown as { id: string; edges?: [string, string][] }[]
    ).forEach((line) => {
      (line.edges || []).forEach(([u, v]) => {
        const coordU = stMap.get(u);
        const coordV = stMap.get(v);
        if (coordU && coordV) {
          features.push({
            type: "Feature",
            properties: { lineId: line.id },
            geometry: {
              type: "LineString",
              coordinates: [coordU, coordV],
            },
          });
        }
      });
    });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, []);

  // Build GeoJSON for all phantom station dots
  const phantomStationsGeoJSON = useMemo(() => {
    const features: GeoJSON.Feature[] = (
      metroTopologyData.stations as unknown as {
        id: string;
        coords: [number, number];
        name: string;
      }[]
    ).map((s) => ({
      type: "Feature",
      properties: { id: s.id, name: s.name },
      geometry: {
        type: "Point",
        coordinates: s.coords,
      },
    }));

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const styleUrl = BASEMAP_STYLES[theme] || BASEMAP_STYLES.dark;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [2.3488, 48.8534], // Paris Notre-Dame
      zoom: 12.2,
      minZoom: 10.5,
      maxZoom: 17,
      attributionControl: false,
    });

    mapRef.current = map;
    isMapLoadedRef.current = false;

    map.on("load", () => {
      isMapLoadedRef.current = true;
      map.resize();

      // 1. Add Phantom Network Track Source & Layer
      if (!map.getSource("metro-phantom-network")) {
        map.addSource("metro-phantom-network", {
          type: "geojson",
          data: phantomNetworkGeoJSON,
        });

        map.addLayer({
          id: "metro-phantom-lines",
          type: "line",
          source: "metro-phantom-network",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": theme === "voyager" ? "#94a3b8" : "#334155",
            "line-width": 2,
            "line-opacity": 0.45,
          },
        });
      }

      // 2. Add Phantom Station Dots Source & Layer
      if (!map.getSource("metro-phantom-stations")) {
        map.addSource("metro-phantom-stations", {
          type: "geojson",
          data: phantomStationsGeoJSON,
        });

        map.addLayer({
          id: "metro-phantom-dots",
          type: "circle",
          source: "metro-phantom-stations",
          paint: {
            "circle-radius": 2.5,
            "circle-color": theme === "voyager" ? "#64748b" : "#475569",
            "circle-opacity": 0.6,
          },
        });
      }

      // 3. Add Active Traversed Tracks Source & Layers (Glow + Sharp Core)
      if (!map.getSource("metro-traversed-tracks")) {
        map.addSource("metro-traversed-tracks", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "metro-tracks-glow",
          type: "line",
          source: "metro-traversed-tracks",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 9,
            "line-opacity": 0.45,
            "line-blur": 3.5,
          },
        });

        map.addLayer({
          id: "metro-tracks-main",
          type: "line",
          source: "metro-traversed-tracks",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 4.5,
            "line-opacity": 1.0,
          },
        });
      }

      // Fit map to show both start and target
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(startStation.coords);
      bounds.extend(targetStation.coords);
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 130, left: 90, right: 90 },
        maxZoom: 13.5,
      });
    });

    // Resize observer to prevent zero-dimension canvas
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, [startStation, targetStation, phantomNetworkGeoJSON, phantomStationsGeoJSON]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Theme Switching
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;
    const styleUrl = BASEMAP_STYLES[theme] || BASEMAP_STYLES.dark;
    map.setStyle(styleUrl);

    map.once("styledata", () => {
      // Re-add sources and layers on style reload
      if (!map.getSource("metro-phantom-network")) {
        map.addSource("metro-phantom-network", {
          type: "geojson",
          data: phantomNetworkGeoJSON,
        });
        map.addLayer({
          id: "metro-phantom-lines",
          type: "line",
          source: "metro-phantom-network",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": theme === "voyager" ? "#94a3b8" : "#334155",
            "line-width": 2,
            "line-opacity": 0.45,
          },
        });
      }

      if (!map.getSource("metro-phantom-stations")) {
        map.addSource("metro-phantom-stations", {
          type: "geojson",
          data: phantomStationsGeoJSON,
        });
        map.addLayer({
          id: "metro-phantom-dots",
          type: "circle",
          source: "metro-phantom-stations",
          paint: {
            "circle-radius": 2.5,
            "circle-color": theme === "voyager" ? "#64748b" : "#475569",
            "circle-opacity": 0.6,
          },
        });
      }

      if (!map.getSource("metro-traversed-tracks")) {
        map.addSource("metro-traversed-tracks", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "metro-tracks-glow",
          type: "line",
          source: "metro-traversed-tracks",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 9,
            "line-opacity": 0.45,
            "line-blur": 3.5,
          },
        });
        map.addLayer({
          id: "metro-tracks-main",
          type: "line",
          source: "metro-traversed-tracks",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 4.5,
            "line-opacity": 1.0,
          },
        });
      }
    });
  }, [theme, phantomNetworkGeoJSON, phantomStationsGeoJSON]);

  // Update track polylines whenever visitedSegments change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("metro-traversed-tracks") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: GeoJSON.Feature[] = visitedSegments.map((seg) => {
      const stU = METRO_STATIONS_MAP[seg.u];
      const stV = METRO_STATIONS_MAP[seg.v];
      const line = METRO_LINES_MAP[seg.lineId];
      return {
        type: "Feature",
        properties: {
          lineId: seg.lineId,
          color: line ? line.bg : "#3b82f6",
        },
        geometry: {
          type: "LineString",
          coordinates: [stU.coords, stV.coords],
        },
      };
    });

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [visitedSegments]);

  // Update Map Markers (Start/Current, Target, and Intermediate stations)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    // 1. Target Station Marker (AMBER TARGET PIN, NO line pills)
    const targetEl = document.createElement("div");
    targetEl.className = "flex flex-col items-center cursor-pointer select-none group";
    targetEl.innerHTML = `
      <div class="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xl flex items-center gap-1.5 border-2 border-white animate-bounce">
        <span>🎯</span>
        <span>${targetStation.name}</span>
      </div>
      <div class="w-2.5 h-2.5 bg-amber-400 rotate-45 -mt-1 shadow-md"></div>
    `;
    const targetMarker = new maplibregl.Marker({ element: targetEl, anchor: "bottom" })
      .setLngLat(targetStation.coords)
      .addTo(map);
    markersRef.current.set(targetStation.id, targetMarker);

    // 2. Visited Intermediate Stations (small clean dots)
    visitedStationIds.forEach((id) => {
      if (id === currentStationId || id === targetStation.id) return;
      const st = METRO_STATIONS_MAP[id];
      if (!st) return;

      const interEl = document.createElement("div");
      interEl.className =
        "group relative cursor-pointer select-none flex items-center justify-center";
      interEl.innerHTML = `
        <div class="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-white/90 shadow-md transition-transform group-hover:scale-150"></div>
        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-0.5 rounded-md bg-slate-900/95 border border-slate-700 text-white text-[10px] font-bold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ${st.name}
        </div>
      `;
      const interMarker = new maplibregl.Marker({ element: interEl, anchor: "center" })
        .setLngLat(st.coords)
        .addTo(map);
      markersRef.current.set(id, interMarker);
    });

    // 3. Current / Active Station Marker (With CLICKABLE LINE PASTILLES)
    const currentEl = document.createElement("div");
    currentEl.className = "flex flex-col items-center cursor-pointer select-none group z-40";

    const pillsHtml = currentStation.lines
      .map((lineId) => {
        const line = METRO_LINES_MAP[lineId];
        return `
          <button data-line-id="${lineId}" class="line-badge-btn w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shadow-md transition-transform hover:scale-125 cursor-pointer" style="background-color: ${line?.bg || "#fff"}; color: ${line?.text || "#000"};">
            ${line?.num || lineId}
          </button>
        `;
      })
      .join("");

    currentEl.innerHTML = `
      <div class="px-2.5 py-1 rounded-xl bg-slate-900/95 text-white font-black text-xs shadow-2xl flex items-center gap-2 border-2 border-cyan-400">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>${currentStation.name}</span>
        <div class="flex items-center gap-1 pl-1 border-l border-slate-700">
          ${pillsHtml}
        </div>
      </div>
      <div class="w-2.5 h-2.5 bg-cyan-400 rotate-45 -mt-1 shadow-md"></div>
    `;

    // Add click listeners to line badge buttons
    currentEl.querySelectorAll(".line-badge-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const lineId = btn.getAttribute("data-line-id");
        if (lineId) {
          setSelectedDrawerLineId(lineId);
          setIsDrawerOpen(true);
        }
      });
    });

    // Clicking anywhere on the bubble opens drawer
    currentEl.addEventListener("click", () => {
      if (!isDrawerOpen) {
        setIsDrawerOpen(true);
      }
    });

    const currentMarker = new maplibregl.Marker({ element: currentEl, anchor: "bottom" })
      .setLngLat(currentStation.coords)
      .addTo(map);
    markersRef.current.set(currentStation.id, currentMarker);
  }, [currentStation, targetStation, visitedStationIds, currentStationId, isDrawerOpen]);

  // Execute station hop
  const handleSelectDestination = useCallback(
    (lineId: string, destId: string) => {
      const validation = validateMetroHop(
        currentStationId,
        lineId,
        destId,
        targetStation.id
      );

      if (!validation.valid || !validation.intermediateStations) {
        return;
      }

      // Compute edges for this hop
      const fullPath = [currentStationId, ...validation.intermediateStations];
      const newSegments: { lineId: string; u: string; v: string }[] = [];
      for (let i = 0; i < fullPath.length - 1; i++) {
        newSegments.push({
          lineId,
          u: fullPath[i],
          v: fullPath[i + 1],
        });
      }

      const newHop: MetroHop = {
        lineId,
        fromId: currentStationId,
        toId: destId,
        intermediateStations: validation.intermediateStations,
        stationsCount: validation.stationsCount || 1,
        timestamp: Date.now(),
      };

      setHops((prev) => [...prev, newHop]);
      setVisitedSegments((prev) => [...prev, ...newSegments]);
      setVisitedStationIds((prev) => {
        const set = new Set([...prev, ...validation.intermediateStations!]);
        return Array.from(set);
      });

      // Update current station
      setCurrentStationId(destId);

      // Pan map smoothly to the new station
      const nextSt = METRO_STATIONS_MAP[destId];
      if (nextSt && mapRef.current) {
        mapRef.current.easeTo({
          center: nextSt.coords,
          zoom: Math.max(mapRef.current.getZoom(), 12.5),
          duration: 1200,
        });
      }

      // Check for victory
      if (validation.isTargetReached) {
        setIsComplete(true);
        setIsDrawerOpen(false);
        setTimeout(() => {
          setShowVictoryModal(true);
        }, 800);
      } else {
        // Automatically default next drawer line to lines passing through destId
        if (nextSt && nextSt.lines.length > 0) {
          if (!nextSt.lines.includes(selectedDrawerLineId)) {
            setSelectedDrawerLineId(nextSt.lines[0]);
          }
        }
      }
    },
    [currentStationId, targetStation.id, selectedDrawerLineId]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top HUD with Navigation & Mission Info (Zero Predictive Objective Badges) */}
      <BorderPathHUD
        pack={pack}
        mode={mode}
        startEntity={startStation as unknown as any}
        targetEntity={targetStation as unknown as any}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenPackModal={() => setShowPackModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onChangeMode={(newMode) => {
          router.push(`/play/borderpath?pack=metro_paris&mode=${newMode}&play=1`);
        }}
        onGiveUp={() => {}}
        onRestart={() => setShowRestartModal(true)}
      />

      {/* MapLibre Canvas Container */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Bottom-Left: Encadré de Jeu / Score Card (Ne déborde JAMAIS sur le bandeau supérieur) */}
      <div className="absolute bottom-8 left-4 sm:left-6 z-20 pointer-events-auto">
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 w-76 sm:w-84 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Train className="w-4 h-4 shrink-0" />
              <span>Parcours Métro</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">16 lignes</span>
          </div>

          {/* Dual Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Lignes prises */}
            <div className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Lignes prises
              </span>
              <span className="text-2xl font-black font-mono text-cyan-400 my-0.5 leading-none">
                {distinctLinesCount}
              </span>
              <span className="text-[10px] font-medium text-cyan-300/80 mt-0.5">
                {distinctLinesCount > 1 ? "lignes utilisées" : "ligne utilisée"}
              </span>
            </div>

            {/* Stations franchies */}
            <div className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Stations
              </span>
              <span className="text-2xl font-black font-mono text-white my-0.5 leading-none">
                {totalStationsTraversed}
              </span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                stations franchies
              </span>
            </div>
          </div>

          {/* Current Station Info */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Position actuelle :</span>
              <span className="font-bold text-white text-xs truncate max-w-[160px]">
                {currentStation.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Lignes disponibles :</span>
              <div className="flex items-center gap-1">
                {currentStation.lines.map((lId) => {
                  const line = METRO_LINES_MAP[lId];
                  return (
                    <span
                      key={lId}
                      className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]"
                      style={{ backgroundColor: line?.bg || "#fff", color: line?.text || "#000" }}
                    >
                      {line?.num || lId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer: Distance à vol d'oiseau */}
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Distance restante :</span>
            </div>
            <span className="font-mono font-bold text-amber-400 text-xs">
              ~{distanceToTargetKm} km
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Center Floating Action Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {!isComplete && (
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-5 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white border-2 border-cyan-500/70 hover:border-cyan-400 shadow-2xl backdrop-blur-md font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Train className="w-3.5 h-3.5" />
            </div>
            <span>Prendre le métro à {currentStation.name}</span>
            <div className="flex items-center gap-1 ml-1">
              {currentStation.lines.map((lId) => {
                const line = METRO_LINES_MAP[lId];
                return (
                  <span
                    key={lId}
                    className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]"
                    style={{ backgroundColor: line?.bg || "#fff", color: line?.text || "#000" }}
                  >
                    {line?.num || lId}
                  </span>
                );
              })}
            </div>
          </button>
        )}
      </div>

      {/* Vertical Station Selection Drawer */}
      <MetroLineDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentStation={currentStation}
        selectedLineId={selectedDrawerLineId}
        onSelectLine={(lId) => setSelectedDrawerLineId(lId)}
        onSelectDestination={handleSelectDestination}
      />

      {/* Victory Summary Modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 text-white">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/10 animate-bounce">
              🚇
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Terminus, tout le monde descend !
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Liaison Métropolitaine Réussie
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Vous avez relié <strong className="text-white">{startStation.name}</strong> à{" "}
                <strong className="text-white">{targetStation.name}</strong>.
              </p>
            </div>

            {/* Score Comparison Grid */}
            <div className="w-full grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lignes empruntées
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-cyan-400">{distinctLinesCount}</span>
                  <span className="text-xs text-slate-500">/ {optimal.minLines} optimal</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Stations traversées
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-indigo-400">{totalStationsTraversed}</span>
                  <span className="text-xs text-slate-500">/ {optimal.minPhysicalStations} min</span>
                </div>
              </div>
            </div>

            {/* Line Hops recap */}
            <div className="w-full text-left space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Votre itinéraire :
              </span>
              {hops.map((h, i) => {
                const line = METRO_LINES_MAP[h.lineId];
                const fromSt = METRO_STATIONS_MAP[h.fromId];
                const toSt = METRO_STATIONS_MAP[h.toId];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0"
                        style={{ backgroundColor: line?.bg || "#fff", color: line?.text || "#000" }}
                      >
                        {line?.num || h.lineId}
                      </span>
                      <span className="truncate text-slate-200">
                        {fromSt?.name} → {toSt?.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      +{h.stationsCount} st.
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="w-full flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const newSeed = Math.random().toString(36).substring(2, 8);
                  router.push(`/play/borderpath?pack=metro_paris&mode=free&seed=${newSeed}&play=1`);
                  setShowVictoryModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs sm:text-sm text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nouvelle partie</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVictoryModal(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Voir la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <BorderPathRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Pack Modal */}
      <BorderPathPackModal
        isOpen={showPackModal}
        onClose={() => setShowPackModal(false)}
        currentPack={pack}
        currentMode={mode}
        onSelect={(newPack, newMode) => {
          setShowPackModal(false);
          router.push(`/play/borderpath?pack=${newPack}&mode=${newMode}&play=1`);
        }}
      />

      {/* Settings Modal */}
      <BorderPathSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        onChangeTheme={setTheme}
        hideBorders={hideBorders}
        onToggleHideBorders={() => setHideBorders((prev) => !prev)}
      />

      {/* Restart Modal */}
      <RestartConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={() => {
          setShowRestartModal(false);
          const newSeed = Math.random().toString(36).substring(2, 8);
          router.push(`/play/borderpath?pack=metro_paris&mode=${mode}&seed=${newSeed}&play=1`);
        }}
        title="Recommencer la partie Métro ?"
        message="Votre trajet actuel sera réinitialisé avec deux nouvelles stations."
      />
    </div>
  );
};
