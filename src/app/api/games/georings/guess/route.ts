import { NextRequest, NextResponse } from "next/server";
import { getCityById, getCitiesInRing } from "@/lib/db/sqlite";
import { getDistanceKm, getBearingDegrees, getCompassDirection } from "@/lib/geo/haversine";
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
      // Graceful fallback for custom rings that might not enclose any city
      return NextResponse.json({
        city: {
          id: city.id,
          name: city.name,
          countryCode: city.countryCode,
          population: city.population,
          latitude: city.latitude,
          longitude: city.longitude,
        },
        isInRing: false,
        distanceFromCenterKm: Math.round(distance),
        isTarget: false,
        triesLeft: currentTriesLeft,
        ringCompleted: true,
        ringFailed: false,
        message: "Cet anneau ne contient aucune ville répertoriée. Anneau validé automatiquement !",
      });
    }

    const targetCity = inRingCities[0];
    const isTarget = city.id === targetCity.id;

    const topCities = inRingCities.slice(0, 3).map((c, idx) => ({
      rank: idx + 1,
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      population: c.population,
      latitude: c.latitude,
      longitude: c.longitude,
    }));

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
        guessRank: 1,
        topCities,
        triesLeft: currentTriesLeft,
        ringCompleted: true,
        ringFailed: false,
        message: `Félicitations ! ${city.name} est bien la 1ʳᵉ ville la plus peuplée (${city.population.toLocaleString("fr-FR")} hab.) !`,
      };
      return NextResponse.json(response);
    }

    // Not the target city
    const isInfiniteLives = currentTriesLeft === -1;
    const newTriesLeft = isInfiniteLives ? -1 : Math.max(0, currentTriesLeft - 1);
    const ringFailed = !isInfiniteLives && newTriesLeft === 0;

    let message = "";
    let directionHint: { code: string; label: string; arrow: string } | undefined = undefined;
    const popFormatted = city.population.toLocaleString("fr-FR");

    if (!isInRing) {
      // Outside the ring: DO NOT display population to avoid spoiling future rings
      message = `${city.name} est hors de l'anneau (${Math.round(distance)} km du centre, attendu entre ${innerRadiusKm} et ${outerRadiusKm} km).`;
    } else {
      // Inside the ring: calculate vector direction relative to the guessed city towards target!
      const bearing = getBearingDegrees(city.latitude, city.longitude, targetCity.latitude, targetCity.longitude);
      directionHint = getCompassDirection(bearing);

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
      // Note: directionHint is NOT added to message string directly so that disabling
      // compass hints in user settings completely suppresses any directional clues.
    }

    if (ringFailed) {
      message += ` Essais épuisés ! La bonne réponse était ${targetCity.name} (${targetCity.population.toLocaleString("fr-FR")} hab.).`;
    } else if (!isInfiniteLives) {
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
      guessRank: isInRing ? inRingCities.findIndex((c) => c.id === city.id) + 1 : undefined,
      directionHint,
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
      topCities: ringFailed ? topCities : undefined,
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
