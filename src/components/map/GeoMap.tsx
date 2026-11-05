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
  type: "seed" | "correct" | "wrong" | "revealed";
}

export interface GeoMapProps {
  center: [number, number]; // [lon, lat]
  seedCity?: { name: string; lat: number; lon: number };
  activeRadiusKm?: number;
  completedRadiiKm?: number[];
  markers?: MapMarker[];
  className?: string;
}

export const GeoMap: React.FC<GeoMapProps> = ({
  center,
  seedCity,
  activeRadiusKm,
  completedRadiiKm = [],
  markers = [],
  className = "w-full h-full",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Keep latest props in refs to avoid closure stalls
  const latestPropsRef = useRef({ center, activeRadiusKm, completedRadiiKm });
  latestPropsRef.current = { center, activeRadiusKm, completedRadiiKm };

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
          }
        );
      } catch (err) {
        console.warn("fitBounds fallback to flyTo:", err);
        map.flyTo({
          center: [lon, Math.max(-60, Math.min(60, lat))],
          zoom: Math.max(1, 4),
          duration: 1000,
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLE,
      center: center,
      zoom: 6,
      attributionControl: false,
    });

    map.on("load", () => {
      isLoadedRef.current = true;
      updateRingsAndCamera();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, []);

  // Update Rings Source & Camera view whenever props change
  useEffect(() => {
    if (isLoadedRef.current) {
      updateRingsAndCamera();
    }
  }, [center[0], center[1], activeRadiusKm, completedRadiiKm.length]);

  // Update Markers (Minimalist dots with city name, NO population)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Seed City Marker
    if (seedCity) {
      const el = document.createElement("div");
      el.className = "flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none";
      el.innerHTML = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 border-2 border-white text-white shadow-xl text-xs font-bold ring-4 ring-blue-500/30">
          📍
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-blue-500/60 text-blue-300 font-bold text-[11px] shadow-lg whitespace-nowrap">
          ${seedCity.name} (Centre)
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([seedCity.lon, seedCity.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Guessed & Target Markers
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.className = "flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none";

      let dotBg = "bg-rose-500 ring-rose-500/30";
      let labelBorder = "border-rose-500/50 text-rose-200";

      if (m.type === "correct") {
        dotBg = "bg-emerald-500 ring-emerald-500/30";
        labelBorder = "border-emerald-500/50 text-emerald-200 font-bold";
      } else if (m.type === "revealed") {
        dotBg = "bg-amber-400 ring-amber-400/30";
        labelBorder = "border-amber-500/50 text-amber-200 font-bold";
      }

      el.innerHTML = `
        <div class="w-3.5 h-3.5 rounded-full ${dotBg} border-2 border-white shadow-lg ring-4 animate-scale-in"></div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border ${labelBorder} text-[11px] shadow-lg whitespace-nowrap">
          ${m.type === "revealed" ? "★ " : ""}${m.label}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lon, m.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [markers, seedCity]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
