import { NextRequest, NextResponse } from "next/server";
import { getSeedCities, getDefaultRadii, getCityById } from "@/lib/db/sqlite";
import { GameScale, GeoRingsInitResponse } from "@/lib/games/types";

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scale = (searchParams.get("scale") || "fr") as GameScale;
  const mode = (searchParams.get("mode") || "daily") as "daily" | "free" | "custom";
  const userSeed = searchParams.get("seed");
  const continent = searchParams.get("continent") || undefined;
  const radiiParam = searchParams.get("radii");
  const livesParam = searchParams.get("lives");
  const cityIdParam = searchParams.get("cityId");

  try {
    let seedCity: ReturnType<typeof getCityById> = null;

    if (cityIdParam) {
      seedCity = getCityById(cityIdParam);
    } else if (userSeed && mode !== "daily") {
      // Direct city ID lookup: if userSeed matches a city ID in SQLite, use it directly!
      const directCity = getCityById(userSeed);
      if (directCity) {
        seedCity = directCity;
      }
    }

    if (!seedCity) {
      const seedCities = getSeedCities(scale, continent);
      if (!seedCities || seedCities.length === 0) {
        return NextResponse.json({ error: "No cities found for scale and region" }, { status: 404 });
      }

      let seedIndex = 0;
      let seedValue = userSeed || "";

      if (mode === "daily") {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        seedValue = `${today}-${scale}`;
        seedIndex = simpleHash(seedValue) % seedCities.length;
      } else {
        if (userSeed) {
          seedIndex = simpleHash(userSeed) % seedCities.length;
        } else {
          const randSeed = Math.floor(Math.random() * 1000000).toString();
          seedValue = randSeed;
          seedIndex = simpleHash(randSeed) % seedCities.length;
        }
      }

      seedCity = seedCities[seedIndex];
    }

    // Determine radii (custom vs default)
    let radii: number[] = [];
    if (radiiParam) {
      const parsedRadii = radiiParam
        .split(",")
        .map((r) => parseInt(r.trim(), 10))
        .filter((r) => !isNaN(r) && r > 0)
        .sort((a, b) => a - b);
      if (parsedRadii.length >= 2) {
        radii = parsedRadii;
      }
    }

    if (radii.length === 0) {
      radii = getDefaultRadii(scale);
    }

    // Determine max tries per ring (1, 3, or -1 for infinite)
    let maxTriesPerRing = 3;
    if (livesParam) {
      const parsedLives = parseInt(livesParam, 10);
      if (parsedLives === 1 || parsedLives === 3 || parsedLives === -1) {
        maxTriesPerRing = parsedLives;
      }
    }

    const rings = radii.map((outerR, idx) => ({
      index: idx,
      innerRadiusKm: idx === 0 ? 0 : radii[idx - 1],
      outerRadiusKm: outerR,
    }));

    const response: GeoRingsInitResponse & { seed: string } = {
      sessionId: `georings_${mode}_${scale}_${seedCity.id}`,
      scale,
      mode,
      continent,
      maxTriesPerRing,
      seed: mode === "daily" ? (userSeed || `${new Date().toISOString().split("T")[0]}-${scale}`) : seedCity.id,
      seedCity: {
        id: seedCity.id,
        name: seedCity.name,
        countryCode: seedCity.countryCode,
        latitude: seedCity.latitude,
        longitude: seedCity.longitude,
      },
      radii,
      rings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Session init error:", error);
    return NextResponse.json({ error: "Failed to initialize game session" }, { status: 500 });
  }
}
