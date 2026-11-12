"use client";

import React, { useEffect, useRef, useCallback } from "react";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import { BorderPathEntity, BorderPathPack } from "@/lib/games/borderpath/types";

export type BorderPathMapTheme = "dark" | "voyager" | "satellite";

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.basemaps.cartocdn.com/v/20261026-01/fonts/{fontstack}/{range}.pbf",
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "satellite-tiles",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const BASEMAP_STYLES: Record<BorderPathMapTheme, string | StyleSpecification> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
  voyager: "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json",
  satellite: SATELLITE_STYLE,
};

interface BorderPathMapProps {
  pack: BorderPathPack;
  theme: BorderPathMapTheme;
  hideBorders?: boolean;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  visitedEntities: BorderPathEntity[];
  invalidFlashId?: string | null;
  onMapClick?: (id: string) => void;
}

export const BorderPathMap: React.FC<BorderPathMapProps> = ({
  pack,
  theme,
  hideBorders = false,
  startEntity,
  targetEntity,
  visitedEntities,
  invalidFlashId,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const isLoadedRef = useRef(false);

  const isFrance = pack === "france_departements";
  const geojsonUrl = isFrance
    ? "/data/geo/france_departements.geojson"
    : "/data/geo/world_countries.geojson";

  // Compute bounds for the corridor (start, target, visited)
  const fitToCorridor = useCallback(() => {
    const map = mapRef.current;
    if (!map || !startEntity || !targetEntity) return;

    const coords: [number, number][] = [
      [startEntity.longitude, startEntity.latitude],
      [targetEntity.longitude, targetEntity.latitude],
      ...visitedEntities.map((e) => [e.longitude, e.latitude] as [number, number]),
    ];

    const bounds = coords.reduce(
      (b, coord) => b.extend(coord),
      new maplibregl.LngLatBounds(coords[0], coords[0])
    );

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 120, left: 60, right: 60 },
      maxZoom: isFrance ? 8.5 : 5.5,
      duration: 1200,
    });
  }, [startEntity, targetEntity, visitedEntities, isFrance]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] = isFrance
      ? [2.2137, 46.2276]
      : [startEntity ? (startEntity.longitude + targetEntity.longitude) / 2 : 20, 30];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[theme],
      center: initialCenter,
      zoom: isFrance ? 5.5 : 2.5,
      attributionControl: false,
    });

    mapRef.current = map;
    isLoadedRef.current = false;

    map.on("load", () => {
      isLoadedRef.current = true;
      setupLayers(map);
      fitToCorridor();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, [theme, isFrance]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup polygon & corridor layers
  const setupLayers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      // 1. Add GeoJSON source for country/dept polygons
      if (!map.getSource("entities-geojson")) {
        map.addSource("entities-geojson", {
          type: "geojson",
          data: geojsonUrl,
          generateId: false,
          promoteId: "id",
        });

        // Layer: Polygon Fill
        map.addLayer({
          id: "entity-fill",
          type: "fill",
          source: "entities-geojson",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "isInvalid"], false],
              "#ef4444", // Red flash
              ["boolean", ["feature-state", "isTarget"], false],
              "#f59e0b", // Amber/Gold
              ["boolean", ["feature-state", "isStart"], false],
              "#06b6d4", // Cyan
              ["boolean", ["feature-state", "isCurrent"], false],
              "#3b82f6", // Blue pulse
              ["boolean", ["feature-state", "isVisited"], false],
              "#10b981", // Emerald
              "#0f172a", // Default
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "isInvalid"], false],
              0.65,
              ["boolean", ["feature-state", "isTarget"], false],
              0.45,
              ["boolean", ["feature-state", "isStart"], false],
              0.45,
              ["boolean", ["feature-state", "isCurrent"], false],
              0.55,
              ["boolean", ["feature-state", "isVisited"], false],
              0.4,
              theme === "satellite" ? 0 : 0.08,
            ],
          },
        });

        // Layer: Polygon Outlines
        map.addLayer({
          id: "entity-outline",
          type: "line",
          source: "entities-geojson",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "isInvalid"], false],
              "#ef4444",
              ["boolean", ["feature-state", "isTarget"], false],
              "#fbbf24",
              ["boolean", ["feature-state", "isStart"], false],
              "#22d3ee",
              ["boolean", ["feature-state", "isCurrent"], false],
              "#60a5fa",
              ["boolean", ["feature-state", "isVisited"], false],
              "#34d399",
              hideBorders ? "transparent" : theme === "voyager" ? "#cbd5e1" : "#334155",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "isCurrent"], false],
              2.5,
              ["boolean", ["feature-state", "isVisited"], false],
              2.0,
              ["boolean", ["feature-state", "isStart"], false],
              2.0,
              ["boolean", ["feature-state", "isTarget"], false],
              2.0,
              hideBorders ? 0 : 0.8,
            ],
            "line-opacity": hideBorders ? 0.3 : 0.8,
          },
        });

        // Click handler on polygons
        if (onMapClick) {
          map.on("click", "entity-fill", (e) => {
            if (e.features && e.features.length > 0) {
              const id = e.features[0].id || e.features[0].properties?.id;
              if (id) onMapClick(String(id));
            }
          });
        }
      }

      // 2. Add corridor polyline source
      if (!map.getSource("corridor-source")) {
        map.addSource("corridor-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        // Corridor glowing line
        map.addLayer({
          id: "corridor-line",
          type: "line",
          source: "corridor-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 4,
            "line-dasharray": [1.5, 1],
            "line-opacity": 0.85,
          },
        });
      }
    },
    [geojsonUrl, theme, hideBorders, onMapClick]
  );

  // Update feature states whenever visitedEntities, start, target, or flash changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current || !map.getSource("entities-geojson")) return;

    const visitedSet = new Set(visitedEntities.map((e) => e.id));
    const currentEntity = visitedEntities[visitedEntities.length - 1] || startEntity;

    // Reset known active entities
    const allRelevantIds = [
      startEntity.id,
      targetEntity.id,
      ...visitedEntities.map((e) => e.id),
      invalidFlashId,
    ].filter(Boolean) as string[];

    // Set feature states
    for (const id of allRelevantIds) {
      const isStart = id === startEntity.id;
      const isTarget = id === targetEntity.id;
      const isVisited = visitedSet.has(id);
      const isCurrent = currentEntity ? id === currentEntity.id : false;
      const isInvalid = id === invalidFlashId;

      try {
        map.setFeatureState(
          { source: "entities-geojson", id },
          { isStart, isTarget, isVisited, isCurrent, isInvalid }
        );
      } catch (err) {
        // Ignore microstate missing in low-res geojson
      }
    }

    // Update Corridor Polyline coordinates
    const corridorCoords: [number, number][] = [
      [startEntity.longitude, startEntity.latitude],
      ...visitedEntities.map((e) => [e.longitude, e.latitude] as [number, number]),
    ];

    const corridorSource = map.getSource("corridor-source") as maplibregl.GeoJSONSource | undefined;
    if (corridorSource) {
      corridorSource.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: corridorCoords,
        },
      });
    }

    // Update HTML Markers
    updateMarkers(map);

    // Auto-fit camera when steps change
    fitToCorridor();
  }, [startEntity, targetEntity, visitedEntities, invalidFlashId, fitToCorridor]);

  // Update HTML overlay markers
  const updateMarkers = (map: maplibregl.Map) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Helper to create marker
    const addMarker = (
      entity: BorderPathEntity,
      type: "start" | "target" | "step" | "current",
      stepNum?: number
    ) => {
      const el = document.createElement("div");
      el.className = "borderpath-marker transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110";

      if (type === "start") {
        el.innerHTML = `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 font-extrabold text-xs shadow-lg shadow-cyan-500/30 backdrop-blur-md">
            <span>${entity.flagEmoji || "🏁"}</span>
            <span class="tracking-wide">${entity.name}</span>
          </div>
        `;
      } else if (type === "target") {
        el.innerHTML = `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 border-2 border-amber-400 text-amber-300 font-extrabold text-xs shadow-lg shadow-amber-500/30 backdrop-blur-md animate-pulse">
            <span>${entity.flagEmoji || "🎯"}</span>
            <span class="tracking-wide">${entity.name}</span>
          </div>
        `;
      } else if (type === "current") {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center font-bold text-xs shadow-xl">
              ${stepNum || "★"}
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-emerald-700/90 border border-emerald-300 text-emerald-100 flex items-center justify-center font-bold text-[10px] shadow-md backdrop-blur-sm">
            ${stepNum}
          </div>
        `;
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([entity.longitude, entity.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    };

    // Add Start Marker
    if (startEntity) {
      addMarker(startEntity, "start");
    }

    // Add Visited Markers
    visitedEntities.forEach((entity, idx) => {
      const isCurrent = idx === visitedEntities.length - 1;
      if (isCurrent && entity.id !== targetEntity.id) {
        addMarker(entity, "current", idx + 1);
      } else {
        addMarker(entity, "step", idx + 1);
      }
    });

    // Add Target Marker
    if (targetEntity) {
      addMarker(targetEntity, "target");
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
