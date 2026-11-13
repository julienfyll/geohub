"use client";

import React, { useEffect, useRef, useCallback } from "react";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import { BorderPathEntity, BorderPathPack, BorderPathMapTheme } from "@/lib/games/borderpath/types";

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

// Global in-memory cache for parsed GeoJSON data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const geojsonCache = new Map<string, any>();

interface BorderPathMapProps {
  pack: BorderPathPack;
  theme: BorderPathMapTheme;
  hideBorders?: boolean;
  highlightStart?: boolean;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  branchAEntities: BorderPathEntity[];
  branchBEntities: BorderPathEntity[];
  fullConnectedPathEntities?: BorderPathEntity[];
  isComplete: boolean;
  invalidFlashId?: string | null;
}

export const BorderPathMap: React.FC<BorderPathMapProps> = ({
  pack,
  theme,
  hideBorders = false,
  highlightStart = true,
  startEntity,
  targetEntity,
  branchAEntities = [],
  branchBEntities = [],
  fullConnectedPathEntities = [],
  isComplete,
  invalidFlashId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const isLoadedRef = useRef(false);
  const prevInvalidIdRef = useRef<string | null>(null);

  const isFrance = pack === "france_departements";
  const geojsonUrl = isFrance
    ? "/data/geo/france_departements.geojson"
    : "/data/geo/world_countries.geojson";

  const headA =
    branchAEntities && branchAEntities.length > 0
      ? branchAEntities[branchAEntities.length - 1]
      : startEntity;
  const headB =
    branchBEntities && branchBEntities.length > 0
      ? branchBEntities[branchBEntities.length - 1]
      : targetEntity;

  // Apply feature states safely to the MapLibre source
  const applyFeatureStates = useCallback(
    (map: maplibregl.Map) => {
      if (!map || !map.getSource("entities-geojson")) return;

      const setA = new Set(branchAEntities.map((e) => e.id));
      const setB = new Set(branchBEntities.map((e) => e.id));
      const fullSet = new Set(fullConnectedPathEntities?.map((e) => e.id) || []);

      const lastInvalid = prevInvalidIdRef.current;
      prevInvalidIdRef.current = invalidFlashId || null;

      const allRelevantIds = Array.from(
        new Set([
          startEntity.id,
          targetEntity.id,
          ...branchAEntities.map((e) => e.id),
          ...branchBEntities.map((e) => e.id),
          ...(fullConnectedPathEntities?.map((e) => e.id) || []),
          invalidFlashId,
          lastInvalid,
        ].filter(Boolean) as string[])
      );

      for (const id of allRelevantIds) {
        const isConn = isComplete && fullSet.has(id);
        const inA = !isConn && setA.has(id);
        const inB = !isConn && setB.has(id);
        const isHeadA = !isComplete && id === headA.id;
        const isHeadB = !isComplete && id === headB.id;
        const isInvalid = id === invalidFlashId;

        try {
          map.setFeatureState(
            { source: "entities-geojson", id },
            {
              isComplete: isConn,
              inBranchA: inA,
              inBranchB: inB,
              isHeadA,
              isHeadB,
              isInvalid,
            }
          );
        } catch {
          // Ignore microstate missing in simplified geojson
        }
      }
    },
    [
      startEntity,
      targetEntity,
      branchAEntities,
      branchBEntities,
      fullConnectedPathEntities,
      headA.id,
      headB.id,
      isComplete,
      invalidFlashId,
    ]
  );

  // Compute bounds for both branches
  const fitToCorridor = useCallback(() => {
    const map = mapRef.current;
    if (!map || !startEntity || !targetEntity) return;

    const coords: [number, number][] = [
      ...branchAEntities.map((e) => [e.longitude, e.latitude] as [number, number]),
      ...branchBEntities.map((e) => [e.longitude, e.latitude] as [number, number]),
    ];

    if (coords.length < 2) {
      coords.push([targetEntity.longitude, targetEntity.latitude]);
    }

    const bounds = coords.reduce(
      (b, coord) => b.extend(coord),
      new maplibregl.LngLatBounds(coords[0], coords[0])
    );

    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 130, left: 70, right: 70 },
      maxZoom: isFrance ? 8.5 : 5.5,
      duration: 1000,
    });
  }, [startEntity, targetEntity, branchAEntities, branchBEntities, isFrance]);

  // Setup polygon & corridor layers
  const setupLayers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      const addPolygonLayers = () => {
        if (map.getLayer("entity-fill")) return;

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
              ["boolean", ["feature-state", "isComplete"], false],
              "#10b981", // Emerald when path is connected
              ["boolean", ["feature-state", "isHeadA"], false],
              "#06b6d4", // Cyan active head
              ["boolean", ["feature-state", "isHeadB"], false],
              "#f59e0b", // Amber active head
              ["boolean", ["feature-state", "inBranchA"], false],
              "#0284c7", // Sky blue for Branch A
              ["boolean", ["feature-state", "inBranchB"], false],
              "#d97706", // Amber 600 for Branch B
              "#0f172a", // Default dark tint
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "isInvalid"], false],
              0.65,
              ["boolean", ["feature-state", "isComplete"], false],
              0.55,
              ["boolean", ["feature-state", "isHeadA"], false],
              0.60,
              ["boolean", ["feature-state", "isHeadB"], false],
              0.60,
              ["boolean", ["feature-state", "inBranchA"], false],
              0.45,
              ["boolean", ["feature-state", "inBranchB"], false],
              0.45,
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
              ["boolean", ["feature-state", "isComplete"], false],
              "#34d399",
              ["boolean", ["feature-state", "isHeadA"], false],
              "#22d3ee",
              ["boolean", ["feature-state", "isHeadB"], false],
              "#fbbf24",
              ["boolean", ["feature-state", "inBranchA"], false],
              "#38bdf8",
              ["boolean", ["feature-state", "inBranchB"], false],
              "#fcd34d",
              hideBorders ? "rgba(0,0,0,0)" : theme === "voyager" ? "#cbd5e1" : "#334155",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "isComplete"], false],
              2.5,
              ["boolean", ["feature-state", "isHeadA"], false],
              2.5,
              ["boolean", ["feature-state", "isHeadB"], false],
              2.5,
              ["boolean", ["feature-state", "inBranchA"], false],
              1.8,
              ["boolean", ["feature-state", "inBranchB"], false],
              1.8,
              hideBorders ? 0 : 0.8,
            ],
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "isInvalid"], false],
              1,
              ["boolean", ["feature-state", "isComplete"], false],
              1,
              ["boolean", ["feature-state", "isHeadA"], false],
              1,
              ["boolean", ["feature-state", "isHeadB"], false],
              1,
              ["boolean", ["feature-state", "inBranchA"], false],
              1,
              ["boolean", ["feature-state", "inBranchB"], false],
              1,
              hideBorders ? 0 : 0.85,
            ],
          },
        });

        // Apply initial feature states immediately
        applyFeatureStates(map);
      };

      // 1. Add GeoJSON source
      if (!map.getSource("entities-geojson")) {
        const cachedData = geojsonCache.get(geojsonUrl);
        if (cachedData) {
          map.addSource("entities-geojson", {
            type: "geojson",
            data: cachedData,
            generateId: false,
            promoteId: "id",
          });
          addPolygonLayers();
        } else {
          fetch(geojsonUrl)
            .then((r) => r.json())
            .then((data) => {
              geojsonCache.set(geojsonUrl, data);
              if (mapRef.current && !mapRef.current.getSource("entities-geojson")) {
                mapRef.current.addSource("entities-geojson", {
                  type: "geojson",
                  data,
                  generateId: false,
                  promoteId: "id",
                });
                addPolygonLayers();
              }
            })
            .catch(() => {
              if (mapRef.current && !mapRef.current.getSource("entities-geojson")) {
                mapRef.current.addSource("entities-geojson", {
                  type: "geojson",
                  data: geojsonUrl,
                  generateId: false,
                  promoteId: "id",
                });
                addPolygonLayers();
              }
            });
        }
      } else {
        addPolygonLayers();
      }
    },
    [geojsonUrl, theme, hideBorders, applyFeatureStates]
  );

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

    const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === "entities-geojson" && e.isSourceLoaded) {
        applyFeatureStates(map);
      }
    };
    map.on("sourcedata", onSourceData);

    map.on("load", () => {
      isLoadedRef.current = true;
      setupLayers(map);
      fitToCorridor();
      applyFeatureStates(map);

      // Apply initial basemap boundary visibility
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          if (
            layer.id.includes("boundary") ||
            layer.id.includes("admin") ||
            layer.id.startsWith("boundary_")
          ) {
            if (map.getLayer(layer.id)) {
              map.setLayoutProperty(layer.id, "visibility", hideBorders ? "none" : "visible");
            }
          }
        });
      }
    });

    return () => {
      map.off("sourcedata", onSourceData);
      map.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, [theme, isFrance]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamically update entity borders and basemap boundaries when hideBorders or theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    // 1. Update entity-outline paint properties
    if (map.getLayer("entity-outline")) {
      map.setPaintProperty("entity-outline", "line-color", [
        "case",
        ["boolean", ["feature-state", "isInvalid"], false],
        "#ef4444",
        ["boolean", ["feature-state", "isComplete"], false],
        "#34d399",
        ["boolean", ["feature-state", "isHeadA"], false],
        "#22d3ee",
        ["boolean", ["feature-state", "isHeadB"], false],
        "#fbbf24",
        ["boolean", ["feature-state", "inBranchA"], false],
        "#38bdf8",
        ["boolean", ["feature-state", "inBranchB"], false],
        "#fcd34d",
        hideBorders ? "rgba(0,0,0,0)" : theme === "voyager" ? "#cbd5e1" : "#334155",
      ]);

      map.setPaintProperty("entity-outline", "line-width", [
        "case",
        ["boolean", ["feature-state", "isComplete"], false],
        2.5,
        ["boolean", ["feature-state", "isHeadA"], false],
        2.5,
        ["boolean", ["feature-state", "isHeadB"], false],
        2.5,
        ["boolean", ["feature-state", "inBranchA"], false],
        1.8,
        ["boolean", ["feature-state", "inBranchB"], false],
        1.8,
        hideBorders ? 0 : 0.8,
      ]);

      map.setPaintProperty("entity-outline", "line-opacity", [
        "case",
        ["boolean", ["feature-state", "isInvalid"], false],
        1,
        ["boolean", ["feature-state", "isComplete"], false],
        1,
        ["boolean", ["feature-state", "isHeadA"], false],
        1,
        ["boolean", ["feature-state", "isHeadB"], false],
        1,
        ["boolean", ["feature-state", "inBranchA"], false],
        1,
        ["boolean", ["feature-state", "inBranchB"], false],
        1,
        hideBorders ? 0 : 0.85,
      ]);
    }

    // 2. Hide or show basemap boundaries (Carto vector boundary lines)
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (
          layer.id.includes("boundary") ||
          layer.id.includes("admin") ||
          layer.id.startsWith("boundary_")
        ) {
          if (map.getLayer(layer.id)) {
            map.setLayoutProperty(layer.id, "visibility", hideBorders ? "none" : "visible");
          }
        }
      });
    }
  }, [hideBorders, theme]);

  // Update feature states and lines whenever state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current || !map.getSource("entities-geojson")) return;

    applyFeatureStates(map);

    // Update HTML Markers
    updateMarkers(map);

    // Auto-fit camera when steps change
    fitToCorridor();
  }, [
    startEntity,
    targetEntity,
    branchAEntities,
    branchBEntities,
    fullConnectedPathEntities,
    isComplete,
    invalidFlashId,
    fitToCorridor,
    applyFeatureStates,
  ]);

  // Update HTML overlay markers
  const updateMarkers = (map: maplibregl.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const addMarker = (
      entity: BorderPathEntity,
      type: "start" | "target" | "headA" | "headB" | "stepA" | "stepB" | "complete"
    ) => {
      const el = document.createElement("div");
      el.className =
        "borderpath-marker transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none";

      if (type === "complete") {
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-emerald-600 border border-emerald-300 text-white flex items-center justify-center font-bold text-[10px] shadow-lg">
            ✓
          </div>
        `;
      } else if (type === "start") {
        el.innerHTML = `
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 font-extrabold text-xs shadow-lg shadow-cyan-500/30 backdrop-blur-md">
            <span>${entity.flagEmoji || "🏁"}</span>
            <span>${entity.name}</span>
          </div>
        `;
      } else if (type === "target") {
        el.innerHTML = `
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/90 border-2 border-amber-400 text-amber-300 font-extrabold text-xs shadow-lg shadow-amber-500/30 backdrop-blur-md">
            <span>${entity.flagEmoji || "🎯"}</span>
            <span>${entity.name}</span>
          </div>
        `;
      } else if (type === "headA") {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-9 h-9 rounded-full bg-cyan-500/40 animate-ping"></div>
            <div class="px-2 py-0.5 rounded-full bg-cyan-600 border-2 border-white text-white font-bold text-xs shadow-xl flex items-center gap-1">
              <span>${entity.flagEmoji || "🏁"}</span>
              <span>${entity.name}</span>
            </div>
          </div>
        `;
      } else if (type === "headB") {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-9 h-9 rounded-full bg-amber-500/40 animate-ping"></div>
            <div class="px-2 py-0.5 rounded-full bg-amber-600 border-2 border-white text-white font-bold text-xs shadow-xl flex items-center gap-1">
              <span>${entity.flagEmoji || "🎯"}</span>
              <span>${entity.name}</span>
            </div>
          </div>
        `;
      } else if (type === "stepA") {
        el.innerHTML = `
          <div class="w-5 h-5 rounded-full bg-cyan-800 border border-cyan-300 text-cyan-100 flex items-center justify-center font-bold text-[9px] shadow-sm">
            ●
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="w-5 h-5 rounded-full bg-amber-800 border border-amber-300 text-amber-100 flex items-center justify-center font-bold text-[9px] shadow-sm">
            ●
          </div>
        `;
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([entity.longitude, entity.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    };

    // Branch A markers
    branchAEntities.forEach((entity, idx) => {
      const isHead = idx === branchAEntities.length - 1;
      if (idx === 0) {
        addMarker(entity, "start");
      } else if (isHead && !isComplete) {
        addMarker(entity, "headA");
      } else {
        addMarker(entity, "stepA");
      }
    });

    // Branch B markers
    branchBEntities.forEach((entity, idx) => {
      const isHead = idx === branchBEntities.length - 1;
      if (idx === 0) {
        addMarker(entity, "target");
      } else if (isHead && !isComplete) {
        addMarker(entity, "headB");
      } else {
        addMarker(entity, "stepB");
      }
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none cursor-default">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
