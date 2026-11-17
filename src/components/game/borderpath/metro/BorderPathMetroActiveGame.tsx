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
  getLineSegment,
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
  Compass,
  RotateCcw,
  Sparkles,
  ChevronDown,
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

  // Solution Reveal State
  const [showOptimalSolution, setShowOptimalSolution] = useState(false);
  const [optimalTab, setOptimalTab] = useState<"lines" | "stations">("lines");

  // Helper to compute optimal hops (min lines)
  const optimalHops = useMemo(() => {
    if (!optimal || !optimal.linesUsed || !optimal.stationHops) return [];
    const res: { lineId: string; fromId: string; toId: string; stationsCount: number }[] = [];
    for (let i = 0; i < optimal.linesUsed.length; i++) {
      const lineId = optimal.linesUsed[i];
      const fromId = optimal.stationHops[i];
      const toId = optimal.stationHops[i + 1];
      if (!lineId || !fromId || !toId) continue;
      const seg = getLineSegment(lineId, fromId, toId);
      res.push({
        lineId,
        fromId,
        toId,
        stationsCount: seg ? Math.max(1, seg.length - 1) : 1,
      });
    }
    return res;
  }, [optimal]);

  // Helper to compute shortest physical stations hops
  const shortestStationsHops = useMemo(() => {
    if (!optimal || !optimal.physicalStationPath || optimal.physicalStationPath.length < 2) return [];
    const path = optimal.physicalStationPath;
    const res: { lineId: string; fromId: string; toId: string; stationsCount: number }[] = [];
    let currLine: string | null = null;
    let segStart = path[0];
    let segCount = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const stU = METRO_STATIONS_MAP[u];
      const stV = METRO_STATIONS_MAP[v];
      if (!stU || !stV) continue;
      const common = stU.lines.filter((l) => stV.lines.includes(l));
      let nextLine = common[0];
      if (currLine && common.includes(currLine)) {
        nextLine = currLine;
      }
      if (!currLine) {
        currLine = nextLine;
        segStart = u;
        segCount = 1;
      } else if (currLine === nextLine) {
        segCount++;
      } else {
        res.push({ lineId: currLine, fromId: segStart, toId: u, stationsCount: segCount });
        currLine = nextLine;
        segStart = u;
        segCount = 1;
      }
    }
    if (currLine && segStart) {
      res.push({ lineId: currLine, fromId: segStart, toId: path[path.length - 1], stationsCount: segCount });
    }
    return res;
  }, [optimal]);

  const minLinesTotalStations = useMemo(() => {
    return optimalHops.reduce((sum, h) => sum + h.stationsCount, 0);
  }, [optimalHops]);

  const hasDifferentPhysicalShortest = useMemo(() => {
    return optimal.minPhysicalStations > 0 && optimal.minPhysicalStations < minLinesTotalStations;
  }, [optimal.minPhysicalStations, minLinesTotalStations]);

  const displayedOptimalHops =
    optimalTab === "stations" && hasDifferentPhysicalShortest
      ? shortestStationsHops
      : optimalHops;

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

  // Render current/departure station marker on map (With clickable line pastilles)
  // Intermediate visited stations are rendered natively on the WebGL canvas via MapLibre GeoJSON layer
  const renderMarkers = useCallback(
    (map: maplibregl.Map) => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      // Current / Departure Station Marker (With CLICKABLE LINE PASTILLES)
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
        setIsDrawerOpen(true);
      });

      const currentMarker = new maplibregl.Marker({ element: currentEl, anchor: "bottom" })
        .setLngLat(currentStation.coords)
        .addTo(map);
      markersRef.current.set(currentStation.id, currentMarker);
    },
    [currentStation]
  );

  const renderMarkersRef = useRef(renderMarkers);
  renderMarkersRef.current = renderMarkers;

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const styleUrl = BASEMAP_STYLES[theme] || BASEMAP_STYLES.dark;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: currentStation.coords, // Center directly on departure station
      zoom: 13.0,
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

      // 4. Add Visited Stations Layer (Outer Ring + Inner Core, 100% attached to traversed tracks in WebGL space)
      if (!map.getSource("metro-visited-stations")) {
        map.addSource("metro-visited-stations", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "metro-visited-dots-outer",
          type: "circle",
          source: "metro-visited-stations",
          paint: {
            "circle-radius": 6.5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#0f172a",
          },
        });

        map.addLayer({
          id: "metro-visited-dots-inner",
          type: "circle",
          source: "metro-visited-stations",
          paint: {
            "circle-radius": 3.5,
            "circle-color": "#0f172a",
          },
        });
      }

      // Station Hover Tooltip
      const stationHoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
      });

      map.on("mouseenter", "metro-visited-dots-outer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feat = e.features?.[0];
        if (!feat || !feat.geometry || feat.geometry.type !== "Point") return;
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const name = feat.properties?.name;
        if (name) {
          stationHoverPopup
            .setLngLat(coords)
            .setHTML(
              `<div class="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-white text-[10px] font-bold shadow-md">${name}</div>`
            )
            .addTo(map);
        }
      });

      map.on("mouseleave", "metro-visited-dots-outer", () => {
        map.getCanvas().style.cursor = "";
        stationHoverPopup.remove();
      });

      // Immediately render markers upon map ready
      renderMarkersRef.current(map);
    });

    // Resize observer to ensure full dimensions
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
  }, [phantomNetworkGeoJSON, phantomStationsGeoJSON]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render markers whenever current station or visited stations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;
    renderMarkers(map);
  }, [renderMarkers]);

  // Handle Theme Switching
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;
    const styleUrl = BASEMAP_STYLES[theme] || BASEMAP_STYLES.dark;
    map.setStyle(styleUrl);

    map.once("styledata", () => {
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

      if (!map.getSource("metro-visited-stations")) {
        map.addSource("metro-visited-stations", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "metro-visited-dots-outer",
          type: "circle",
          source: "metro-visited-stations",
          paint: {
            "circle-radius": 6.5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#0f172a",
          },
        });

        map.addLayer({
          id: "metro-visited-dots-inner",
          type: "circle",
          source: "metro-visited-stations",
          paint: {
            "circle-radius": 3.5,
            "circle-color": "#0f172a",
          },
        });
      }

      renderMarkersRef.current(map);
    });
  }, [theme, phantomNetworkGeoJSON, phantomStationsGeoJSON]);

  // Update track polylines and visited station dots whenever visitedSegments or visitedStationIds change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // 1. Update Traversed Tracks
    const trackSource = map.getSource("metro-traversed-tracks") as maplibregl.GeoJSONSource | undefined;
    if (trackSource) {
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

      trackSource.setData({
        type: "FeatureCollection",
        features,
      });
    }

    // 2. Update Visited Intermediate Stations (100% attached to traversed tracks)
    const stationsSource = map.getSource("metro-visited-stations") as maplibregl.GeoJSONSource | undefined;
    if (stationsSource) {
      const dotFeatures: GeoJSON.Feature[] = visitedStationIds
        .filter((id) => id !== currentStationId)
        .map((id) => {
          const st = METRO_STATIONS_MAP[id];
          return {
            type: "Feature",
            properties: { id, name: st?.name || "" },
            geometry: {
              type: "Point",
              coordinates: st ? st.coords : [0, 0],
            },
          };
        });

      stationsSource.setData({
        type: "FeatureCollection",
        features: dotFeatures,
      });
    }
  }, [visitedSegments, visitedStationIds, currentStationId]);

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
          zoom: Math.max(mapRef.current.getZoom(), 12.8),
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
        onGiveUp={() => {
          setIsComplete(true);
          setShowVictoryModal(true);
          setShowOptimalSolution(true);
        }}
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

      {/* Vertical Station Selection Drawer: Starts at top-14 under the top HUD */}
      <MetroLineDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentStation={currentStation}
        selectedLineId={selectedDrawerLineId}
        onSelectLine={(lId) => setSelectedDrawerLineId(lId)}
        onSelectDestination={handleSelectDestination}
      />

      {/* Victory / Summary Modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 text-white max-h-[92vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/10 animate-bounce">
              {currentStationId === targetStation.id ? "🚇" : "🏳️"}
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                {currentStationId === targetStation.id
                  ? "Terminus, tout le monde descend !"
                  : "Mission interrompue"}
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {currentStationId === targetStation.id
                  ? "Liaison Métropolitaine Réussie"
                  : "Abandon du Défi Métro"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {currentStationId === targetStation.id ? (
                  <>
                    Vous avez relié <strong className="text-white">{startStation.name}</strong> à{" "}
                    <strong className="text-white">{targetStation.name}</strong>.
                  </>
                ) : (
                  <>
                    Liaison inachevée entre <strong className="text-white">{startStation.name}</strong> et{" "}
                    <strong className="text-white">{targetStation.name}</strong>.
                  </>
                )}
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

            {/* Bouton Révéler la solution optimale (au-dessus de Votre itinéraire) */}
            <div className="w-full">
              <button
                type="button"
                onClick={() => setShowOptimalSolution((prev) => !prev)}
                className="w-full py-2.5 px-4 rounded-2xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer shadow-lg shadow-cyan-950/40 group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>
                    {showOptimalSolution
                      ? "Masquer la solution optimale"
                      : "Révéler la solution optimale"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${
                    showOptimalSolution ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Compartiment de la solution optimale révélée */}
            {showOptimalSolution && (
              <div className="w-full text-left space-y-2 p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-inner animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                      Solution optimale
                    </span>
                  </div>

                  {hasDifferentPhysicalShortest && (
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setOptimalTab("lines")}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          optimalTab === "lines"
                            ? "bg-cyan-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Chemin avec le minimum de correspondances"
                      >
                        {optimal.minLines} {optimal.minLines > 1 ? "lignes" : "ligne"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptimalTab("stations")}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          optimalTab === "stations"
                            ? "bg-cyan-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Chemin traversant le moins de stations physiques"
                      >
                        {optimal.minPhysicalStations} st.
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {displayedOptimalHops.map((h, i) => {
                    const line = METRO_LINES_MAP[h.lineId];
                    const fromSt = METRO_STATIONS_MAP[h.fromId];
                    const toSt = METRO_STATIONS_MAP[h.toId];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs hover:border-cyan-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 shadow-xs"
                            style={{
                              backgroundColor: line?.bg || "#fff",
                              color: line?.text || "#000",
                            }}
                          >
                            {line?.num || h.lineId}
                          </span>
                          <span className="truncate text-slate-200 font-medium">
                            {fromSt?.name} → {toSt?.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-400 shrink-0 font-mono font-bold">
                          +{h.stationsCount} st.
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
