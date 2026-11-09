"use client";

import React, { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { createGreatCircleArc, formatDistance } from "@/lib/games/blindpoint/scoring";
import { BlindPointRoundResult } from "@/lib/games/blindpoint/types";

const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

// Bounding box for Metropolitan France + Corsica [minLon, minLat, maxLon, maxLat]
const FRANCE_BOUNDS: [number, number, number, number] = [-5.2, 41.3, 9.6, 51.1];

export interface BlindPointMapProps {
  scale: "fr" | "world";
  roundIndex?: number;
  isRevealing: boolean;
  isGameOverReview: boolean;
  currentGuess: { lat: number; lon: number } | null;
  currentTargetCoords?: { lat: number; lon: number } | null;
  currentTargetName?: string;
  allRounds?: BlindPointRoundResult[];
  showBorders?: boolean;
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
  onPlaceGuess,
  className = "w-full h-full",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
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

    if (scale === "fr") {
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

  // Smoothly reset camera to original overview whenever a new round starts
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (prevRoundIndexRef.current !== roundIndex && !isRevealing && !isGameOverReview) {
      resetCamera();
    }
    prevRoundIndexRef.current = roundIndex;
  }, [roundIndex, isRevealing, isGameOverReview, resetCamera]);

  /**
   * Hardware-accelerated WebGL layers setup.
   * Completely eliminates DOM marker drift on zoom/pan.
   */
  const setupLayers = (map: maplibregl.Map) => {
    // 1. Geodesic Arcs Source & Layers
    if (!map.getSource("arc-source")) {
      map.addSource("arc-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Neon outer glow
      map.addLayer({
        id: "arc-glow",
        type: "line",
        source: "arc-source",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 6,
          "line-opacity": 0.4,
          "line-blur": 3,
        },
      });

      // Sharp central dashed geodesic line
      map.addLayer({
        id: "arc-line",
        type: "line",
        source: "arc-source",
        paint: {
          "line-color": "#67e8f9",
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

      // Outer glow circle
      map.addLayer({
        id: "points-glow",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 18,
          "circle-color": [
            "case",
            ["==", ["get", "type"], "target"],
            "#10b981",
            "#3b82f6",
          ],
          "circle-opacity": 0.35,
        },
      });

      // Contrasting white border ring
      map.addLayer({
        id: "points-outer",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 10,
          "circle-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      // Colored inner circle
      map.addLayer({
        id: "points-inner",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "case",
            ["==", ["get", "type"], "target"],
            "#10b981",
            "#2563eb",
          ],
        },
      });

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

      // Text labels (above / below point with dark halo)
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
          "text-color": [
            "case",
            ["==", ["get", "type"], "target"],
            "#6ee7b7",
            "#93c5fd",
          ],
          "text-halo-color": "#020617",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.5,
        },
      });

      // Interactive hover tooltip on point dots
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

    const initialCenter: [number, number] = scale === "fr" ? [2.2137, 46.2276] : [10, 20];
    const initialZoom = scale === "fr" ? 5.2 : 1.8;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLE,
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

      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;
      curPlace({ lat, lon });
    });

    map.on("load", () => {
      isLoadedRef.current = true;
      updateBasemapBorders();
      setupLayers(map);
      updateMapData();
      resetCamera();
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

  // Update borders visibility and hide road layers
  const updateBasemapBorders = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    const style = map.getStyle();
    if (!style || !style.layers) return;

    style.layers.forEach((layer) => {
      if (
        layer.id.startsWith("road_") ||
        layer.id.startsWith("tunnel_") ||
        layer.id.startsWith("bridge_") ||
        layer.id.startsWith("aeroway")
      ) {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }

      if (layer.id.startsWith("boundary_")) {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, "visibility", showBorders ? "visible" : "none");
        }
      }
    });
  };

  useEffect(() => {
    updateBasemapBorders();
  }, [showBorders]);

  /**
   * Synchronizes hardware WebGL points & arcs for all states:
   * 1. Active guess placing
   * 2. Single-round reveal (guess + target + arc)
   * 3. End of game review (all 5 rounds with numbered markers & arcs)
   */
  const updateMapData = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

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
              maxZoom: scale === "fr" ? 7 : 4,
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
            maxZoom: 10,
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
          !isRevealing && !isGameOverReview ? "cursor-crosshair" : "cursor-default"
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
