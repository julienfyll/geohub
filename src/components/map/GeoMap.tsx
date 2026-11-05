"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { createGeodesicCircle, getBoundingBox } from "@/lib/geo/haversine";

// Free, reliable vector basemap with zero labels (anti-cheat)
const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  sublabel?: string;
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
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLE,
      center: center,
      zoom: 5,
      attributionControl: false,
    });

    map.on("load", () => {
      // Add source for concentric rings
      map.addSource("rings-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Layer for ring fills
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

      // Layer for ring borders
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
            "#475569",
          ],
          "line-width": [
            "case",
            ["==", ["get", "type"], "active"],
            3,
            1.5,
          ],
          "line-dasharray": [
            "case",
            ["==", ["get", "type"], "active"],
            ["literal", [1, 0]],
            ["literal", [3, 2]],
          ],
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Rings Source & Camera view when activeRadiusKm or center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("rings-source") as maplibregl.GeoJSONSource;
    if (!source) return;

    const [lon, lat] = center;
    const features: GeoJSON.Feature[] = [];

    // Add completed rings
    completedRadiiKm.forEach((radius) => {
      const feat = createGeodesicCircle(lat, lon, radius, 72);
      feat.properties = { type: "completed", radiusKm: radius };
      features.push(feat);
    });

    // Add active ring
    if (activeRadiusKm) {
      const activeFeat = createGeodesicCircle(lat, lon, activeRadiusKm, 72);
      activeFeat.properties = { type: "active", radiusKm: activeRadiusKm };
      features.push(activeFeat);

      // Fit map bounds to encompass the active ring
      const bbox = getBoundingBox(lat, lon, activeRadiusKm);
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        {
          padding: 60,
          duration: 1200,
          maxZoom: 14,
        }
      );
    }

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [center, activeRadiusKm, completedRadiiKm]);

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing HTML markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add Seed City Marker
    if (seedCity) {
      const el = document.createElement("div");
      el.className =
        "flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white shadow-lg text-xs font-bold ring-4 ring-blue-500/30";
      el.innerHTML = "📍";
      el.title = `Départ : ${seedCity.name}`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([seedCity.lon, seedCity.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Add Guess & Target Markers
    markers.forEach((m) => {
      const el = document.createElement("div");
      let bg = "bg-rose-500 border-rose-200 text-white";
      let icon = "✕";

      if (m.type === "correct") {
        bg = "bg-emerald-500 border-emerald-200 text-white ring-4 ring-emerald-500/30";
        icon = "✓";
      } else if (m.type === "revealed") {
        bg = "bg-amber-500 border-amber-200 text-white ring-4 ring-amber-500/30";
        icon = "★";
      }

      el.className = `flex flex-col items-center justify-center px-2 py-1 rounded-md text-xs font-semibold shadow-md border ${bg}`;
      el.innerHTML = `
        <span class="leading-none text-[10px]">${icon} ${m.label}</span>
        ${m.sublabel ? `<span class="text-[9px] opacity-90">${m.sublabel}</span>` : ""}
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
