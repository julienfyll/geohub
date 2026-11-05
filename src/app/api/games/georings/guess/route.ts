import { NextRequest, NextResponse } from "next/server";
import { getCityById, getMostPopulatedCityInRing } from "@/lib/db/sqlite";
import { getDistanceKm } from "@/lib/geo/haversine";
import { CityGuessResult, GameScale } from "@/lib/games/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scale,
      centerLat,
      centerLon,
      innerRadiusKm,
      outerRadiusKm,
      cityId,
      currentTriesLeft,
    } = body as {
      scale: GameScale;
      centerLat: number;
      centerLon: number;
      innerRadiusKm: number;
      outerRadiusKm: number;
      cityId: string;
      currentTriesLeft: number;
    };

    if (!cityId || centerLat === undefined || centerLon === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const city = getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const distance = getDistanceKm(centerLat, centerLon, city.latitude, city.longitude);
    const isInRing = distance > innerRadiusKm && distance <= outerRadiusKm;

    const targetCity = getMostPopulatedCityInRing(
      centerLat,
      centerLon,
      innerRadiusKm,
      outerRadiusKm,
      scale
    );

    if (!targetCity) {
      return NextResponse.json(
        { error: "No target city found in this ring" },
        { status: 500 }
      );
    }

    const isTarget = city.id === targetCity.id;

    if (isTarget) {
      const response: CityGuessResult = {
        city: {
          id: city.id,
          name: city.name,
          countryCode: city.countryCode,
          population: city.population,
          latitude: city.latitude,
          longitude: city.longitude,
        },
        isInRing: true,
        distanceFromCenterKm: Math.round(distance),
        isTarget: true,
        triesLeft: currentTriesLeft,
        ringCompleted: true,
        ringFailed: false,
        message: `Félicitations ! ${city.name} est bien la ville la plus peuplée (${city.population.toLocaleString("fr-FR")} hab.) !`,
      };
      return NextResponse.json(response);
    }

    // Not the target city
    const newTriesLeft = Math.max(0, currentTriesLeft - 1);
    const ringFailed = newTriesLeft === 0;

    let message = "";
    if (!isInRing) {
      message = `${city.name} est hors de l'anneau (${Math.round(distance)} km du centre, attendu entre ${innerRadiusKm} et ${outerRadiusKm} km).`;
    } else {
      message = `${city.name} (${city.population.toLocaleString("fr-FR")} hab.) n'est pas la plus peuplée de cet anneau.`;
    }

    if (ringFailed) {
      message += ` 3 essais épuisés ! La bonne réponse était ${targetCity.name} (${targetCity.population.toLocaleString("fr-FR")} hab.).`;
    }

    const response: CityGuessResult = {
      city: {
        id: city.id,
        name: city.name,
        countryCode: city.countryCode,
        population: city.population,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      isInRing,
      distanceFromCenterKm: Math.round(distance),
      isTarget: false,
      targetCityIfRevealed: ringFailed
        ? {
            id: targetCity.id,
            name: targetCity.name,
            countryCode: targetCity.countryCode,
            population: targetCity.population,
            latitude: targetCity.latitude,
            longitude: targetCity.longitude,
          }
        : undefined,
      triesLeft: newTriesLeft,
      ringCompleted: false,
      ringFailed,
      message,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Guess validation error:", error);
    return NextResponse.json({ error: "Failed to validate guess" }, { status: 500 });
  }
}
