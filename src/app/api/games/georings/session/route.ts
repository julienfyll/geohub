import { NextRequest, NextResponse } from "next/server";
import { getSeedCities, getDefaultRadii } from "@/lib/db/sqlite";
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
  const mode = (searchParams.get("mode") || "daily") as "daily" | "free";
  const userSeed = searchParams.get("seed");

  try {
    const seedCities = getSeedCities(scale);
    if (!seedCities || seedCities.length === 0) {
      return NextResponse.json({ error: "No cities found for scale" }, { status: 404 });
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

    const seedCity = seedCities[seedIndex];
    const radii = getDefaultRadii(scale);

    const rings = radii.map((outerR, idx) => ({
      index: idx,
      innerRadiusKm: idx === 0 ? 0 : radii[idx - 1],
      outerRadiusKm: outerR,
    }));

    const response: GeoRingsInitResponse & { seed: string } = {
      sessionId: `georings_${mode}_${scale}_${seedValue}`,
      scale,
      mode,
      seed: seedValue,
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
