import { NextRequest, NextResponse } from "next/server";
import { getCityById, getCitiesInRing } from "@/lib/db/sqlite";
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

    const inRingCities = getCitiesInRing(
      centerLat,
      centerLon,
      innerRadiusKm,
      outerRadiusKm,
      scale
    );

    if (!inRingCities || inRingCities.length === 0) {
      return NextResponse.json(
        { error: "No target city found in this ring" },
        { status: 500 }
      );
    }

    const targetCity = inRingCities[0];
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
        message: `Félicitations ! ${city.name} est bien la 1ʳᵉ ville la plus peuplée (${city.population.toLocaleString("fr-FR")} hab.) !`,
      };
      return NextResponse.json(response);
    }

    // Not the target city
    const newTriesLeft = Math.max(0, currentTriesLeft - 1);
    const ringFailed = newTriesLeft === 0;

    let message = "";
    const popFormatted = city.population.toLocaleString("fr-FR");

    if (!isInRing) {
      // Outside the ring: DO NOT display population to avoid spoiling future rings
      message = `${city.name} est hors de l'anneau (${Math.round(distance)} km du centre, attendu entre ${innerRadiusKm} et ${outerRadiusKm} km).`;
    } else {
      // Inside the ring: provide exact rank in the annulus!
      const rank = inRingCities.findIndex((c) => c.id === city.id) + 1;
      if (rank === 2) {
        message = `${city.name} (${popFormatted} hab.) est 2ᵉ de cet anneau (si proche !).`;
      } else if (rank > 0 && rank <= 10) {
        message = `${city.name} (${popFormatted} hab.) est ${rank}ᵉ de cet anneau.`;
      } else if (rank > 10) {
        message = `${city.name} (${popFormatted} hab.) n'est que ${rank}ᵉ de cet anneau.`;
      } else {
        message = `${city.name} (${popFormatted} hab.) n'est pas la plus peuplée de cet anneau.`;
      }
    }

    if (ringFailed) {
      message += ` 3 essais épuisés ! La bonne réponse était ${targetCity.name} (${targetCity.population.toLocaleString("fr-FR")} hab.).`;
    } else {
      message += ` Il vous reste ${newTriesLeft} essai${newTriesLeft > 1 ? "s" : ""}.`;
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
