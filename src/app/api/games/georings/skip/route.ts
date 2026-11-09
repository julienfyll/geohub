import { NextRequest, NextResponse } from "next/server";
import { getCitiesInRing, getAirportsInRing } from "@/lib/db/sqlite";
import { GameScale, GameMetric } from "@/lib/games/types";

function formatPax(pax: number): string {
  if (pax >= 1_000_000) {
    return `${(pax / 1_000_000).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  return `${Math.round(pax / 1_000).toLocaleString("fr-FR")}k`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scale,
      metric = "population",
      centerLat,
      centerLon,
      innerRadiusKm,
      outerRadiusKm,
    } = body as {
      scale: GameScale;
      metric?: GameMetric;
      centerLat: number;
      centerLon: number;
      innerRadiusKm: number;
      outerRadiusKm: number;
    };

    if (centerLat === undefined || centerLon === undefined || outerRadiusKm === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (metric === "airports") {
      const inRingAirports = getAirportsInRing(
        centerLat,
        centerLon,
        innerRadiusKm,
        outerRadiusKm,
        scale
      );

      if (!inRingAirports || inRingAirports.length === 0) {
        return NextResponse.json({
          targetCity: null,
          topCities: [],
          message: "Cet anneau ne contient aucun aéroport répertorié.",
        });
      }

      const targetAirport = inRingAirports[0];
      const targetDisplayName = `${targetAirport.cityName} — ${targetAirport.name} (${targetAirport.iata})`;

      const topCities = inRingAirports.slice(0, 3).map((ap, idx) => ({
        rank: idx + 1,
        id: ap.id,
        name: `${ap.cityName} — ${ap.name} (${ap.iata})`,
        countryCode: ap.countryCode,
        population: ap.passengerCount,
        passengerCount: ap.passengerCount,
        iata: ap.iata,
        cityName: ap.cityName,
        latitude: ap.latitude,
        longitude: ap.longitude,
      }));

      return NextResponse.json({
        targetCity: {
          id: targetAirport.id,
          name: targetDisplayName,
          countryCode: targetAirport.countryCode,
          population: targetAirport.passengerCount,
          passengerCount: targetAirport.passengerCount,
          iata: targetAirport.iata,
          cityName: targetAirport.cityName,
          latitude: targetAirport.latitude,
          longitude: targetAirport.longitude,
        },
        topCities,
        message: `Anneau passé ! La bonne réponse était ${targetDisplayName} (${formatPax(targetAirport.passengerCount)} passagers / an).`,
      });
    }

    const inRingCities = getCitiesInRing(
      centerLat,
      centerLon,
      innerRadiusKm,
      outerRadiusKm,
      scale
    );

    if (!inRingCities || inRingCities.length === 0) {
      return NextResponse.json({
        targetCity: null,
        topCities: [],
        message: "Cet anneau ne contient aucune ville répertoriée.",
      });
    }

    const targetCity = inRingCities[0];
    const topCities = inRingCities.slice(0, 3).map((c, idx) => ({
      rank: idx + 1,
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      population: c.population,
      latitude: c.latitude,
      longitude: c.longitude,
    }));

    return NextResponse.json({
      targetCity: {
        id: targetCity.id,
        name: targetCity.name,
        countryCode: targetCity.countryCode,
        population: targetCity.population,
        latitude: targetCity.latitude,
        longitude: targetCity.longitude,
      },
      topCities,
      message: `Anneau passé ! La bonne réponse était ${targetCity.name} (${targetCity.population.toLocaleString("fr-FR")} hab.).`,
    });
  } catch (error) {
    console.error("Skip ring error:", error);
    return NextResponse.json({ error: "Failed to skip ring" }, { status: 500 });
  }
}
