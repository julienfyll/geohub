"use client";

import React, { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CapitalItem } from "@/lib/games/capitalblitz/types";

export interface CapitalBlitzMapProps {
  activeCountry: CapitalItem | null;
  successCountryIds: Set<string>;
  skippedCountryIds: Set<string>;
  className?: string;
}

export const CapitalBlitzMap: React.FC<CapitalBlitzMapProps> = ({
  activeCountry,
  successCountryIds,
  skippedCountryIds,
  className = "w-full h-full",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef(false);
  const prevActiveIdsRef = useRef<Set<string>>(new Set());

  // Update feature states on MapLibre source
  const updateFeatureStates = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current || !map.getSource("countries-source")) return;

    const currentIds = new Set<string>();
    if (activeCountry) currentIds.add(activeCountry.id);
    successCountryIds.forEach((id) => currentIds.add(id));
    skippedCountryIds.forEach((id) => currentIds.add(id));

    // Clear old feature states that are no longer styled
    for (const oldId of prevActiveIdsRef.current) {
      if (!currentIds.has(oldId)) {
        try {
          map.removeFeatureState({ source: "countries-source", id: oldId });
        } catch {
          // Ignore
        }
      }
    }
    prevActiveIdsRef.current = currentIds;

    // Apply updated states
    for (const id of currentIds) {
      let state = "none";
      if (activeCountry && id === activeCountry.id) {
        state = "active";
      } else if (successCountryIds.has(id)) {
        state = "success";
      } else if (skippedCountryIds.has(id)) {
        state = "skipped";
      }

      try {
        map.setFeatureState(
          { source: "countries-source", id },
          { status: state }
        );
      } catch {
        // Ignore
      }
    }
  }, [activeCountry, successCountryIds, skippedCountryIds]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
      center: [15.0, 25.0],
      zoom: 1.8,
      minZoom: 1.2,
      maxZoom: 6.5,
      pitch: 0,
      maxPitch: 0,
      minPitch: 0,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      isLoadedRef.current = true;
      map.resize();

      // Add countries GeoJSON source with promoteId: "id" for ISO-3 feature states
      if (!map.getSource("countries-source")) {
        map.addSource("countries-source", {
          type: "geojson",
          data: "/data/geo/world_countries.geojson",
          promoteId: "id",
        });

        // Countries fill layer (Interactive status coloring)
        map.addLayer({
          id: "countries-fill",
          type: "fill",
          source: "countries-source",
          paint: {
            "fill-color": [
              "case",
              ["==", ["feature-state", "status"], "active"],
              "#f59e0b", // Amber 500 for active target country
              ["==", ["feature-state", "status"], "success"],
              "#10b981", // Emerald 500 for successfully guessed capitals
              ["==", ["feature-state", "status"], "skipped"],
              "#ef4444", // Rose 500 for skipped/unfound capitals
              "rgba(15, 23, 42, 0.65)", // Default slate-900 background
            ],
            "fill-opacity": [
              "case",
              ["==", ["feature-state", "status"], "active"],
              0.85,
              ["==", ["feature-state", "status"], "success"],
              0.7,
              ["==", ["feature-state", "status"], "skipped"],
              0.55,
              0.4,
            ],
          },
        });

        // Glow outline for active country
        map.addLayer({
          id: "countries-active-glow",
          type: "line",
          source: "countries-source",
          paint: {
            "line-color": "#fbbf24",
            "line-width": [
              "case",
              ["==", ["feature-state", "status"], "active"],
              6,
              0,
            ],
            "line-opacity": 0.5,
            "line-blur": 3,
          },
        });

        // Sharp borders layer
        map.addLayer({
          id: "countries-borders",
          type: "line",
          source: "countries-source",
          paint: {
            "line-color": [
              "case",
              ["==", ["feature-state", "status"], "active"],
              "#fbbf24", // Bright Amber border
              ["==", ["feature-state", "status"], "success"],
              "#34d399", // Emerald border
              ["==", ["feature-state", "status"], "skipped"],
              "#f87171", // Rose border
              "rgba(71, 85, 105, 0.4)", // Subtle slate-600 border
            ],
            "line-width": [
              "case",
              ["==", ["feature-state", "status"], "active"],
              2.5,
              ["==", ["feature-state", "status"], "success"],
              2,
              ["==", ["feature-state", "status"], "skipped"],
              1.5,
              0.8,
            ],
          },
        });
      }

      updateFeatureStates();
    });

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

  // Sync feature states on props change
  useEffect(() => {
    updateFeatureStates();
  }, [updateFeatureStates]);

  // Camera animation towards the active country
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeCountry) return;

    // Smoothly fly towards active country
    map.flyTo({
      center: [activeCountry.longitude, activeCountry.latitude],
      zoom: 3.2,
      duration: 650,
      pitch: 0,
      bearing: 0,
    });
  }, [activeCountry]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
