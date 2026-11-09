import { NextRequest, NextResponse } from "next/server";
import { getCitiesInRing } from "@/lib/db/sqlite";
import { GameScale } from "@/lib/games/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scale,
      centerLat,
      centerLon,
      innerRadiusKm,
      outerRadiusKm,
    } = body as {
      scale: GameScale;
      centerLat: number;
      centerLon: number;
      innerRadiusKm: number;
      outerRadiusKm: number;
    };

    if (centerLat === undefined || centerLon === undefined || outerRadiusKm === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
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
