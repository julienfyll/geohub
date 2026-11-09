"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { createGeodesicCircle, getBoundingBox } from "@/lib/geo/haversine";

const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  population?: number;
  type: "seed" | "correct" | "wrong" | "revealed" | "top";
}

export interface GeoMapProps {
  center: [number, number]; // [lon, lat]
  seedCity?: { name: string; lat: number; lon: number; population?: number };
  activeRadiusKm?: number;
  completedRadiiKm?: number[];
  markers?: MapMarker[];
  showBorders?: boolean;
  className?: string;
}

export const GeoMap: React.FC<GeoMapProps> = ({
  center,
  seedCity,
  activeRadiusKm,
  completedRadiiKm = [],
  markers = [],
  showBorders = true,
  className = "w-full h-full",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  // Keep latest props in refs to avoid stale closures in event listeners
  const latestPropsRef = useRef({ center, activeRadiusKm, completedRadiiKm, seedCity, markers });
  latestPropsRef.current = { center, activeRadiusKm, completedRadiiKm, seedCity, markers };

  const updateRingsAndCamera = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    let source = map.getSource("rings-source") as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      map.addSource("rings-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "rings-fill",
        type: "fill",
        source: "rings-source",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "type"], "active"],
            "#3b82f6",
            ["==", ["get", "type"], "completed"],
            "#10b981",
            "#64748b",
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "type"], "active"],
            0.12,
            0.05,
          ],
        },
      });

      map.addLayer({
        id: "rings-outline",
        type: "line",
        source: "rings-source",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "type"], "active"],
            "#60a5fa",
            ["==", ["get", "type"], "completed"],
            "#34d399",
            "#64748b",
          ],
          "line-width": [
            "case",
            ["==", ["get", "type"], "active"],
            3,
            2,
          ],
          "line-dasharray": [
            "case",
            ["==", ["get", "type"], "completed"],
            ["literal", [2, 2]],
            ["literal", [1, 0]],
          ],
        },
      });

      source = map.getSource("rings-source") as maplibregl.GeoJSONSource;
    }

    const { center: curCenter, activeRadiusKm: curActiveR, completedRadiiKm: curCompletedR } = latestPropsRef.current;
    const [lon, lat] = curCenter;
    const features: GeoJSON.Feature[] = [];

    // Completed rings (rendered with subtle green dashed border)
    curCompletedR.forEach((radius) => {
      const feat = createGeodesicCircle(lat, lon, radius, 72);
      feat.properties = { type: "completed", radiusKm: radius };
      features.push(feat);
    });

    // Active ring (rendered with glowing blue border)
    if (curActiveR && curActiveR > 0) {
      const activeFeat = createGeodesicCircle(lat, lon, curActiveR, 72);
      activeFeat.properties = { type: "active", radiusKm: curActiveR };
      features.push(activeFeat);

      // Safe camera fit with Mercator protection & fallback
      try {
        const bbox = getBoundingBox(lat, lon, curActiveR);
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          {
            padding: { top: 180, bottom: 80, left: 60, right: 60 },
            duration: 1000,
            maxZoom: 13,
            bearing: 0,
            pitch: 0,
          }
        );
      } catch (err) {
        console.warn("fitBounds fallback to flyTo:", err);
        map.flyTo({
          center: [lon, Math.max(-60, Math.min(60, lat))],
          zoom: Math.max(1, 4),
          duration: 1000,
          bearing: 0,
          pitch: 0,
        });
      }
    }

    if (source) {
      source.setData({
        type: "FeatureCollection",
        features,
      });
    }
  };

  /**
   * Native MapLibre WebGL Layer Markers
   * Fixes DOM drift on zoom: dots are hardware-rendered and 100% geographically pinned to coordinates.
   */
  const updateMarkers = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    let source = map.getSource("markers-source") as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      map.addSource("markers-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Subtle glow circle under the seed city
      map.addLayer({
        id: "markers-seed-glow",
        type: "circle",
        source: "markers-source",
        filter: ["==", ["get", "type"], "seed"],
        paint: {
          "circle-radius": 16,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.3,
        },
      });

      // Outer contrasting white border for all city dots
      map.addLayer({
        id: "markers-dot-outer",
        type: "circle",
        source: "markers-source",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "type"], "seed"],
            8,
            6,
          ],
          "circle-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      // Inner colored dot (hardware-accelerated WebGL)
      map.addLayer({
        id: "markers-dot-inner",
        type: "circle",
        source: "markers-source",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "type"], "seed"],
            6,
            4.5,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "type"], "seed"],
            "#2563eb",
            ["==", ["get", "type"], "correct"],
            "#10b981",
            ["==", ["get", "type"], "revealed"],
            "#f59e0b",
            ["==", ["get", "type"], "top"],
            "#38bdf8",
            "#ef4444",
          ],
        },
      });

      // Native typography labels below each dot
      // Collision engine handles density so names never overlap into unreadable clusters
      map.addLayer({
        id: "markers-labels",
        type: "symbol",
        source: "markers-source",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Bold", "Open Sans Regular"],
          "text-size": [
            "case",
            ["==", ["get", "type"], "seed"],
            12,
            11,
          ],
          "text-offset": [0, 1.0],
          "text-anchor": "top",
          "symbol-sort-key": ["get", "sortKey"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "icon-allow-overlap": true,
        },
        paint: {
          "text-color": [
            "case",
            ["==", ["get", "type"], "seed"],
            "#93c5fd",
            ["==", ["get", "type"], "correct"],
            "#6ee7b7",
            ["==", ["get", "type"], "revealed"],
            "#fcd34d",
            ["==", ["get", "type"], "top"],
            "#7dd3fc",
            "#fca5a5",
          ],
          "text-halo-color": "#020617",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.5,
        },
      });

      // Interactive hover tooltip for cities where label may be hidden at low zoom
      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
      });
      hoverPopupRef.current = hoverPopup;

      map.on("mouseenter", "markers-dot-outer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const geom = feat.geometry as GeoJSON.Point;
        const coords = geom.coordinates.slice() as [number, number];
        const label = feat.properties?.label || "";
        const type = feat.properties?.type || "";
        const rawPop = feat.properties?.population;
        const popFormatted = rawPop ? `${Number(rawPop).toLocaleString("fr-FR")} hab.` : null;

        let badgeColor = "border-rose-500/80 text-rose-200";
        if (type === "seed") badgeColor = "border-blue-500/80 text-blue-200";
        else if (type === "correct") badgeColor = "border-emerald-500/80 text-emerald-200";
        else if (type === "revealed") badgeColor = "border-amber-500/80 text-amber-200";
        else if (type === "top") badgeColor = "border-sky-500/80 text-sky-200";

        hoverPopup
          .setLngLat(coords)
          .setHTML(
            `<div class="px-2.5 py-1.5 rounded-lg bg-slate-950/95 border ${badgeColor} text-xs font-semibold shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
              <span>${label}</span>
              ${popFormatted ? `<span class="text-slate-400 font-normal">(${popFormatted})</span>` : ""}
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "markers-dot-outer", () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });

      source = map.getSource("markers-source") as maplibregl.GeoJSONSource;
    }

    const { seedCity: curSeed, markers: curMarkers } = latestPropsRef.current;
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    // Seed City Feature (highest placement priority: sortKey = 1)
    if (curSeed) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [curSeed.lon, curSeed.lat],
        },
        properties: {
          id: "seed",
          type: "seed",
          label: `${curSeed.name} (Centre)`,
          population: curSeed.population,
          sortKey: 1,
        },
      });
    }

    // Guessed & Revealed Markers
    curMarkers.forEach((m) => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [m.lon, m.lat],
        },
        properties: {
          id: m.id,
          type: m.type,
          label: m.type === "revealed" ? `★ ${m.label}` : m.label,
          population: m.population,
          sortKey: m.type === "correct" ? 2 : m.type === "revealed" ? 3 : m.type === "top" ? 5 : 4,
        },
      });
    });

    if (source) {
      source.setData({
        type: "FeatureCollection",
        features,
      });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Strict orientation lock: North is strictly up, 0 deg bearing, 0 deg pitch
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLE,
      center: center,
      zoom: 6,
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      minPitch: 0,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      attributionControl: false,
    });

    // Disable all rotation interactions
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    if (map.keyboard && "disableRotation" in map.keyboard) {
      map.keyboard.disableRotation();
    }

    // Disable MapLibre default scrollZoom so trackpad swipe acts as PAN instead of zoom
    map.scrollZoom.disable();

    // Enforce North Up safeguards
    map.on("rotate", () => {
      if (map.getBearing() !== 0) map.setBearing(0);
    });
    map.on("pitch", () => {
      if (map.getPitch() !== 0) map.setPitch(0);
    });

    map.on("load", () => {
      isLoadedRef.current = true;
      updateBasemapLayers();
      updateRingsAndCamera();
      updateMarkers();
    });

    mapRef.current = map;

    // Trackpad gestures: Two-finger pan (lateral/vertical) + Pinch-to-zoom
    const container = mapContainerRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // Pinch-to-zoom gesture on Mac trackpad (or Ctrl + scroll on mouse)
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
        // Two-finger pan: natural reversed scrolling direction
        map.panBy([e.deltaX, e.deltaY], { duration: 0 });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

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
  }, []);

  // Update Basemap Layers: permanently hide roads, toggle political borders
  const updateBasemapLayers = () => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    const style = map.getStyle();
    if (!style || !style.layers) return;

    style.layers.forEach((layer) => {
      // 1. Hide roads permanently to avoid revealing urban corridors
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

      // 2. Control borders visibility (Normal vs Hardcore)
      if (layer.id.startsWith("boundary_")) {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, "visibility", showBorders ? "visible" : "none");
        }
      }
    });
  };

  // Update Rings Source & Camera view whenever props change
  useEffect(() => {
    if (isLoadedRef.current) {
      updateRingsAndCamera();
    }
  }, [center[0], center[1], activeRadiusKm, completedRadiiKm.length]);

  // Update Borders visibility whenever showBorders changes
  useEffect(() => {
    if (isLoadedRef.current) {
      updateBasemapLayers();
    }
  }, [showBorders]);

  // Update Native Markers whenever markers or seedCity change
  useEffect(() => {
    if (isLoadedRef.current) {
      updateMarkers();
    }
  }, [markers, seedCity]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
