"use client";

import React, { useEffect, useRef, useCallback } from "react";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { createGreatCircleArc, formatDistance } from "@/lib/games/blindpoint/scoring";
import { BlindPointRoundResult, BlindPointMapTheme } from "@/lib/games/blindpoint/types";

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
    protomaps: {
      type: "vector",
      tiles: [
        "https://tiles.basemaps.cartocdn.com/v/20261026-01/vectortiles/carto.streets/v2/{z}/{x}/{y}.mvt",
      ],
      minzoom: 0,
      maxzoom: 15,
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
    {
      id: "boundary_country_outline",
      type: "line",
      source: "protomaps",
      "source-layer": "boundaries",
      minzoom: 3,
      paint: {
        "line-color": "#000000",
        "line-width": 3,
        "line-opacity": 0.6,
      },
      filter: ["==", ["get", "kind_detail"], 2],
    },
    {
      id: "boundary_country_inner",
      type: "line",
      source: "protomaps",
      "source-layer": "boundaries",
      minzoom: 0,
      paint: {
        "line-color": "#ffffff",
        "line-width": 1.5,
        "line-opacity": 0.85,
        "line-dasharray": [2, 1],
      },
      filter: ["==", ["get", "kind_detail"], 2],
    },
  ],
};

export const BASEMAP_STYLES: Record<BlindPointMapTheme, string | StyleSpecification> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
  voyager: "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json",
  satellite: SATELLITE_STYLE,
};

export const THEME_NAMES: Record<BlindPointMapTheme, string> = {
  dark: "Sombre Voyageur (Nuit Naturelle)",
  voyager: "Clair Voyageur (Jour Naturel)",
  satellite: "Satellite HD (Imagerie Réelle)",
};

// Bounding box for Metropolitan France + Corsica [minLon, minLat, maxLon, maxLat]
const FRANCE_BOUNDS: [number, number, number, number] = [-5.2, 41.3, 9.6, 51.1];
// Bounding box for Paris Intra-muros + close ring
const PARIS_BOUNDS: [number, number, number, number] = [2.22, 48.815, 2.47, 48.905];

export interface BlindPointMapProps {
  scale: "fr" | "world" | "paris";
  roundIndex?: number;
  isRevealing: boolean;
  isGameOverReview: boolean;
  currentGuess: { lat: number; lon: number } | null;
  currentTargetCoords?: { lat: number; lon: number } | null;
  currentTargetName?: string;
  allRounds?: BlindPointRoundResult[];
  showBorders?: boolean;
  showRoads?: boolean;
  showNature?: boolean;
  mapTheme?: BlindPointMapTheme;
  onPlaceGuess: (coords: { lat: number; lon: number }) => void;
  className?: string;
}

export const BlindPointMap: React.FC<BlindPointMapProps> = ({
  scale,
  roundIndex = 0,
  isRevealing,
  isGameOverReview,
  currentGuess,
  currentTargetCoords,
  currentTargetName = "Cible réelle",
  allRounds = [],
  showBorders = true,
  showRoads = true,
  showNature = true,
  mapTheme = "dark",
  onPlaceGuess,
  className = "w-full h-full",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const currentThemeRef = useRef<BlindPointMapTheme>(mapTheme);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const prevRoundIndexRef = useRef<number>(roundIndex);

  // Keep interaction state in refs to avoid stale closures in map click listener
  const interactionStateRef = useRef({ isRevealing, isGameOverReview, onPlaceGuess });
  interactionStateRef.current = { isRevealing, isGameOverReview, onPlaceGuess };

  /**
   * Resets map view to default whole territory view (France vs World)
   */
  const resetCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (scale === "paris") {
      map.flyTo({
        center: [2.3488, 48.8534],
        zoom: 12.8,
        duration: 900,
        bearing: 0,
        pitch: 0,
      });
    } else if (scale === "fr") {
      map.fitBounds(
        [
          [FRANCE_BOUNDS[0], FRANCE_BOUNDS[1]],
          [FRANCE_BOUNDS[2], FRANCE_BOUNDS[3]],
        ],
        {
          padding: { top: 120, bottom: 120, left: 60, right: 60 },
          duration: 900,
          maxZoom: 7,
          bearing: 0,
          pitch: 0,
        }
      );
    } else {
      map.flyTo({
        center: [10, 20],
        zoom: 1.8,
        duration: 900,
        bearing: 0,
        pitch: 0,
      });
    }
  }, [scale]);

  // Smoothly reset camera to original overview whenever a new round starts or game restarts
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (
      (prevRoundIndexRef.current !== roundIndex || roundIndex === 0) &&
      !isRevealing &&
      !isGameOverReview
    ) {
      resetCamera();
    }
    prevRoundIndexRef.current = roundIndex;
  }, [roundIndex, isRevealing, isGameOverReview, resetCamera]);

  // Whenever scale changes (e.g. switching between Paris, France, Monde), immediately reframe camera
  useEffect(() => {
    if (!isLoadedRef.current) return;
    resetCamera();
  }, [scale, resetCamera]);

  // Keep map canvas cursor in sync with game state (precision crosshair during guess, default otherwise)
  const updateCanvasCursor = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    const canvas = map.getCanvas();
    if (!canvas) return;
    canvas.style.cursor = !isRevealing && !isGameOverReview ? "crosshair" : "default";
  }, [isRevealing, isGameOverReview]);

  useEffect(() => {
    updateCanvasCursor();
  }, [updateCanvasCursor]);

  /**
   * Hardware-accelerated WebGL layers setup.
   * Completely eliminates DOM marker drift on zoom/pan.
   */
  const setupLayers = (map: maplibregl.Map, currentTheme: BlindPointMapTheme = mapTheme) => {
    const isDark = currentTheme === "dark" || currentTheme === "satellite";

    // 1. Geodesic Arcs Source & Layers
    if (!map.getSource("arc-source")) {
      map.addSource("arc-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer("arc-glow")) {
      // Neon outer glow
      map.addLayer({
        id: "arc-glow",
        type: "line",
        source: "arc-source",
        paint: {
          "line-color": isDark ? "#38bdf8" : "#0284c7",
          "line-width": 6,
          "line-opacity": isDark ? 0.4 : 0.35,
          "line-blur": 3,
        },
      });
    }

    if (!map.getLayer("arc-line")) {
      // Sharp central dashed geodesic line
      map.addLayer({
        id: "arc-line",
        type: "line",
        source: "arc-source",
        paint: {
          "line-color": isDark ? "#67e8f9" : "#0369a1",
          "line-width": 2.5,
          "line-dasharray": [2, 1],
        },
      });
    }

    // 2. Hardware Points Source & Layers
    if (!map.getSource("points-source")) {
      map.addSource("points-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer("points-shadow")) {
      // Outer drop-shadow ring for guaranteed contrast on any background (light, dark, satellite)
      map.addLayer({
        id: "points-shadow",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 13,
          "circle-color": "#020617",
          "circle-opacity": isDark ? 0.5 : 0.25,
        },
      });
    }

    if (!map.getLayer("points-outer")) {
      // Contrasting white border ring
      map.addLayer({
        id: "points-outer",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 10,
          "circle-color": "#ffffff",
          "circle-opacity": 0.98,
        },
      });
    }

    if (!map.getLayer("points-inner")) {
      // Colored inner circle
      map.addLayer({
        id: "points-inner",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 7.5,
          "circle-color": [
            "case",
            ["==", ["get", "type"], "target"],
            "#10b981",
            "#2563eb",
          ],
        },
      });
    }

    if (!map.getLayer("points-number")) {
      // Centered number inside point (for review mode 1 to 5)
      map.addLayer({
        id: "points-number",
        type: "symbol",
        source: "points-source",
        layout: {
          "text-field": ["get", "numberStr"],
          "text-font": ["Open Sans Bold", "Open Sans Regular"],
          "text-size": 10,
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });
    }

    if (!map.getLayer("points-labels")) {
      // Text labels (above / below point with adaptive halo)
      map.addLayer({
        id: "points-labels",
        type: "symbol",
        source: "points-source",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Bold", "Open Sans Regular"],
          "text-size": 11,
          "text-anchor": "top",
          "text-offset": [0, 1.2],
          "text-allow-overlap": true,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": isDark
            ? [
                "case",
                ["==", ["get", "type"], "target"],
                "#6ee7b7",
                "#93c5fd",
              ]
            : [
                "case",
                ["==", ["get", "type"], "target"],
                "#047857",
                "#1d4ed8",
              ],
          "text-halo-color": isDark ? "#020617" : "#ffffff",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.5,
        },
      });
    }

    // Interactive hover tooltip on point dots
    if (!hoverPopupRef.current) {
      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
      });
      hoverPopupRef.current = hoverPopup;

      map.on("mouseenter", "points-outer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const geom = feat.geometry as GeoJSON.Point;
        const coords = geom.coordinates.slice() as [number, number];
        const label = feat.properties?.label || "";
        const details = feat.properties?.details || "";

        hoverPopup
          .setLngLat(coords)
          .setHTML(
            `<div class="px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-slate-700 text-xs font-semibold shadow-2xl backdrop-blur-md whitespace-nowrap text-slate-200">
              <span class="text-white">${label}</span>
              ${details ? `<span class="block text-[11px] text-slate-400 font-mono mt-0.5">${details}</span>` : ""}
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "points-outer", () => {
        const { isRevealing: curRev, isGameOverReview: curRevAll } = interactionStateRef.current;
        map.getCanvas().style.cursor = !curRev && !curRevAll ? "crosshair" : "default";
        hoverPopup.remove();
      });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] =
      scale === "paris"
        ? [2.3488, 48.8534]
        : scale === "fr"
        ? [2.2137, 46.2276]
        : [10, 20];
    const initialZoom = scale === "paris" ? 12.8 : scale === "fr" ? 5.2 : 1.8;

    const rawStyle = BASEMAP_STYLES[mapTheme] || BASEMAP_STYLES.dark;
    const initialStyle =
      typeof rawStyle === "object" ? JSON.parse(JSON.stringify(rawStyle)) : rawStyle;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: initialCenter,
      zoom: initialZoom,
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      minPitch: 0,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      attributionControl: false,
    });

    // Enforce precision crosshair cursor immediately on canvas creation
    map.getCanvas().style.cursor = "crosshair";

    // Disable rotation
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    if (map.keyboard && "disableRotation" in map.keyboard) {
      map.keyboard.disableRotation();
    }

    // Two-finger pan and trackpad wheel handling
    map.scrollZoom.disable();
    const container = mapContainerRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const zoomDelta = -e.deltaY * 0.015;
        const currentZoom = map.getZoom();
        const minZ = map.getMinZoom() ?? 1;
        const maxZ = map.getMaxZoom() ?? 18;
        const targetZoom = Math.min(Math.max(currentZoom + zoomDelta, minZ), maxZ);

        const rect = container.getBoundingClientRect();
        const point = new maplibregl.Point(e.clientX - rect.left, e.clientY - rect.top);
        map.zoomTo(targetZoom, {
          around: map.unproject(point),
          duration: 0,
        });
      } else {
        map.panBy([e.deltaX, e.deltaY], { duration: 0 });
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });

    // Click handler to place guess
    map.on("click", (e) => {
      const { isRevealing: curRev, isGameOverReview: curRevAll, onPlaceGuess: curPlace } =
        interactionStateRef.current;
      if (curRev || curRevAll) return;

      const wrapped = e.lngLat.wrap();
      const lat = wrapped.lat;
      const lon = wrapped.lng;
      curPlace({ lat, lon });
    });

    map.on("load", () => {
      isLoadedRef.current = true;
      setupLayers(map, mapTheme);
      updateMapData();
      updateBasemapBorders();
      resetCamera();
      updateCanvasCursor();
    });

    map.on("dragend", () => {
      updateCanvasCursor();
    });

    mapRef.current = map;

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, [scale]);

  // Apply visual enhancements (roads on/off, green spaces & rivers on/off, and custom Dark Voyager palette)
  const applyBasemapTheme = (
    map: maplibregl.Map,
    theme: BlindPointMapTheme,
    roadsVisible: boolean,
    natureVisible: boolean
  ) => {
    // In Satellite mode, roads and nature are inherent to the photographic raster imagery
    if (theme === "satellite") return;

    const style = map.getStyle();
    if (!style || !style.layers) return;

    // 1. Manage Roads / Bridges / Tunnels / Aeroways visibility
    const roadVisibility = roadsVisible ? "visible" : "none";
    const roadPrefixes = ["road_", "bridge_", "tunnel_", "aeroway", "rail"];

    style.layers.forEach((layer) => {
      if (roadPrefixes.some((p) => layer.id.startsWith(p))) {
        if (map.getLayer(layer.id)) {
          try {
            map.setLayoutProperty(layer.id, "visibility", roadVisibility);
          } catch (e) {}
        }
      }
    });

    // 2. Manage Green Spaces (parks, forests, landcover, residential)
    const natureVisibility = natureVisible ? "visible" : "none";
    const greenLayerIds = [
      "park_national_park",
      "park_nature_reserve",
      "landuse",
      "landcover",
      "landuse_residential",
    ];

    greenLayerIds.forEach((id) => {
      if (map.getLayer(id)) {
        try {
          map.setLayoutProperty(id, "visibility", natureVisibility);
        } catch (e) {}
      }
    });

    // 3. Manage Waterways (linear rivers like the Seine, Loire, Rhône, canals)
    if (map.getLayer("waterway")) {
      try {
        map.setLayoutProperty("waterway", "visibility", natureVisible ? "visible" : "none");
      } catch (e) {}
    }

    // 4. Color Palette tuning for Dark theme (Sombre Voyageur)
    if (theme === "dark") {
      // Water fill color: sapphire blue if nature is on, else dark seamless background
      if (map.getLayer("water")) {
        try {
          map.setPaintProperty("water", "fill-color", natureVisible ? "#162a45" : "#0e0e0e");
        } catch (e) {}
      }
      if (map.getLayer("waterway")) {
        try {
          map.setPaintProperty("waterway", "line-color", "#2563eb");
        } catch (e) {}
      }

      // Parks & Green Spaces vibrant emerald styling
      if (natureVisible) {
        const greenColor = "rgba(34, 197, 94, 0.28)";
        const forestColor = "rgba(22, 101, 52, 0.22)";
        if (map.getLayer("park_national_park")) {
          try { map.setPaintProperty("park_national_park", "fill-color", greenColor); } catch (e) {}
        }
        if (map.getLayer("park_nature_reserve")) {
          try { map.setPaintProperty("park_nature_reserve", "fill-color", greenColor); } catch (e) {}
        }
        if (map.getLayer("landuse")) {
          try { map.setPaintProperty("landuse", "fill-color", greenColor); } catch (e) {}
        }
        if (map.getLayer("landcover")) {
          try { map.setPaintProperty("landcover", "fill-color", forestColor); } catch (e) {}
        }
      }

      // Roads & Bridges luminous slate silver styling
      if (roadsVisible) {
        if (map.getLayer("road_minor_fill")) {
          try { map.setPaintProperty("road_minor_fill", "line-color", "rgba(100, 116, 139, 0.25)"); } catch (e) {}
        }
        if (map.getLayer("road_sec_fill_noramp")) {
          try { map.setPaintProperty("road_sec_fill_noramp", "line-color", "rgba(148, 163, 184, 0.4)"); } catch (e) {}
        }
        if (map.getLayer("road_pri_fill_noramp")) {
          try { map.setPaintProperty("road_pri_fill_noramp", "line-color", "rgba(203, 213, 225, 0.55)"); } catch (e) {}
        }
        if (map.getLayer("road_trunk_fill_noramp")) {
          try { map.setPaintProperty("road_trunk_fill_noramp", "line-color", "rgba(56, 189, 248, 0.5)"); } catch (e) {}
        }
        if (map.getLayer("road_mot_fill_noramp")) {
          try { map.setPaintProperty("road_mot_fill_noramp", "line-color", "rgba(56, 189, 248, 0.6)"); } catch (e) {}
        }
        if (map.getLayer("bridge_minor_fill")) {
          try { map.setPaintProperty("bridge_minor_fill", "line-color", "rgba(148, 163, 184, 0.45)"); } catch (e) {}
        }
        if (map.getLayer("bridge_sec_fill")) {
          try { map.setPaintProperty("bridge_sec_fill", "line-color", "rgba(203, 213, 225, 0.65)"); } catch (e) {}
        }
        if (map.getLayer("bridge_pri_fill")) {
          try { map.setPaintProperty("bridge_pri_fill", "line-color", "rgba(241, 245, 249, 0.8)"); } catch (e) {}
        }
        if (map.getLayer("bridge_trunk_fill")) {
          try { map.setPaintProperty("bridge_trunk_fill", "line-color", "rgba(56, 189, 248, 0.7)"); } catch (e) {}
        }
        if (map.getLayer("building-top")) {
          try { map.setPaintProperty("building-top", "fill-color", "rgba(30, 41, 59, 0.35)"); } catch (e) {}
        }
      }
    } else {
      // In Clair Voyageur mode
      if (!natureVisible && map.getLayer("water")) {
        try { map.setPaintProperty("water", "fill-color", "#fbf8f3"); } catch (e) {}
      } else if (natureVisible && map.getLayer("water")) {
        try { map.setPaintProperty("water", "fill-color", "#b0d0d6"); } catch (e) {}
      }
    }
  };

  // Switch basemap style dynamically when mapTheme prop changes
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
      setupLayers(map, mapTheme);
      updateMapData();
      updateBasemapBorders();
      updateCanvasCursor();
    };

    map.on("styledata", restoreAllLayers);
    map.setStyle(nextStyle, { diff: false });
  }, [mapTheme]);

  // Update borders visibility and enhance contrast based on theme
  const updateBasemapBorders = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    const style = map.getStyle();
    if (!style || !style.layers) return;

    style.layers.forEach((layer) => {
      // Political boundaries visibility (Muet vs Frontières)
      if (layer.id.startsWith("boundary_")) {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, "visibility", showBorders ? "visible" : "none");
        }
      }
    });

    applyBasemapTheme(map, mapTheme, showRoads, showNature);
  };

  useEffect(() => {
    updateBasemapBorders();
  }, [showBorders, showRoads, showNature, mapTheme]);

  /**
   * Synchronizes hardware WebGL points & arcs for all states:
   * 1. Active guess placing
   * 2. Single-round reveal (guess + target + arc)
   * 3. End of game review (all 5 rounds with numbered markers & arcs)
   */
  const updateMapData = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    // Self-healing: if sources or layers were wiped (e.g. style change), re-create them!
    if (!map.getSource("points-source") || !map.getSource("arc-source")) {
      setupLayers(map, currentThemeRef.current);
    }

    const pointsSource = map.getSource("points-source") as maplibregl.GeoJSONSource | undefined;
    const arcSource = map.getSource("arc-source") as maplibregl.GeoJSONSource | undefined;
    if (!pointsSource || !arcSource) return;

    const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
    const arcFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];

    // Case A: End of Game Full Review (All 5 rounds)
    if (isGameOverReview && allRounds.length > 0) {
      let minLon = 180,
        maxLon = -180,
        minLat = 90,
        maxLat = -90;

      allRounds.forEach((round, idx) => {
        // 1. User Guess Point
        pointFeatures.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [round.guess.lon, round.guess.lat],
          },
          properties: {
            id: `guess_${idx}`,
            type: "guess",
            numberStr: `${idx + 1}`,
            label: `#${idx + 1} Mon tir`,
            details: `Écart : ${formatDistance(round.distanceKm)}`,
          },
        });

        // 2. Real Target Point
        pointFeatures.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [round.target.longitude, round.target.latitude],
          },
          properties: {
            id: `target_${idx}`,
            type: "target",
            numberStr: `${idx + 1}`,
            label: `★ #${idx + 1} ${round.target.name}`,
            details: `Score : +${round.score.toLocaleString("fr-FR")} pts`,
          },
        });

        // 3. Great circle arc connecting the exact two points
        const arc = createGreatCircleArc(
          round.guess.lat,
          round.guess.lon,
          round.target.latitude,
          round.target.longitude
        );
        arcFeatures.push(arc);

        // Bounding box
        [round.guess.lon, round.target.longitude].forEach((lon) => {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
        });
        [round.guess.lat, round.target.latitude].forEach((lat) => {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });

      pointsSource.setData({
        type: "FeatureCollection",
        features: pointFeatures,
      });

      arcSource.setData({
        type: "FeatureCollection",
        features: arcFeatures,
      });

      if (minLon <= maxLon && minLat <= maxLat) {
        try {
          map.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            {
              padding: { top: 120, bottom: 140, left: 80, right: 80 },
              duration: 1000,
              maxZoom: scale === "paris" ? 13.2 : scale === "fr" ? 7 : 4,
            }
          );
        } catch (e) {
          console.warn("Could not fitBounds on review:", e);
        }
      }
      return;
    }

    // Case B: Single Round Reveal Mode
    if (isRevealing && currentGuess && currentTargetCoords) {
      pointFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [currentGuess.lon, currentGuess.lat],
        },
        properties: {
          id: "current_guess",
          type: "guess",
          numberStr: "",
          label: "Mon tir",
        },
      });

      pointFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [currentTargetCoords.lon, currentTargetCoords.lat],
        },
        properties: {
          id: "current_target",
          type: "target",
          numberStr: "",
          label: `★ ${currentTargetName}`,
        },
      });

      const arcFeat = createGreatCircleArc(
        currentGuess.lat,
        currentGuess.lon,
        currentTargetCoords.lat,
        currentTargetCoords.lon
      );
      arcFeatures.push(arcFeat);

      pointsSource.setData({
        type: "FeatureCollection",
        features: pointFeatures,
      });

      arcSource.setData({
        type: "FeatureCollection",
        features: arcFeatures,
      });

      const minLon = Math.min(currentGuess.lon, currentTargetCoords.lon);
      const maxLon = Math.max(currentGuess.lon, currentTargetCoords.lon);
      const minLat = Math.min(currentGuess.lat, currentTargetCoords.lat);
      const maxLat = Math.max(currentGuess.lat, currentTargetCoords.lat);

      try {
        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          {
            padding: { top: 120, bottom: 200, left: 100, right: 100 },
            duration: 1200,
            maxZoom: scale === "paris" ? 15.5 : 10,
          }
        );
      } catch (e) {
        console.warn("Could not fitBounds on reveal:", e);
      }
      return;
    }

    // Case C: Active Player Guessing (Single Pin)
    if (currentGuess) {
      pointFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [currentGuess.lon, currentGuess.lat],
        },
        properties: {
          id: "current_guess",
          type: "guess",
          numberStr: "",
          label: "Mon tir",
        },
      });
    }

    pointsSource.setData({
      type: "FeatureCollection",
      features: pointFeatures,
    });

    arcSource.setData({
      type: "FeatureCollection",
      features: [],
    });
  };

  // Trigger data updates whenever props change
  useEffect(() => {
    updateMapData();
  }, [
    roundIndex,
    currentGuess,
    currentTargetCoords,
    currentTargetName,
    isRevealing,
    isGameOverReview,
    allRounds.length,
  ]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* MapLibre WebGL Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full ${
          !isRevealing && !isGameOverReview
            ? "cursor-crosshair [&_.maplibregl-canvas]:cursor-crosshair"
            : "cursor-default [&_.maplibregl-canvas]:cursor-default"
        }`}
      />

      {/* Floating Map Controls */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (map) map.zoomIn({ duration: 300 });
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
          title="Zoom avant"
          aria-label="Zoom avant"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (map) map.zoomOut({ duration: 300 });
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
          title="Zoom arrière"
          aria-label="Zoom arrière"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={resetCamera}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all active:scale-95"
          title="Recadrer la carte (Vue d'ensemble)"
          aria-label="Vue d'ensemble"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
