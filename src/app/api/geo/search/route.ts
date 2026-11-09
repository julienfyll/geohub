import { NextRequest, NextResponse } from "next/server";
import { searchCities, searchAirports } from "@/lib/db/sqlite";
import { GameScale, GameMetric } from "@/lib/games/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const scale = (searchParams.get("scale") || "fr") as GameScale;
  const metric = (searchParams.get("metric") || "population") as GameMetric;
  const preferFrench = searchParams.get("preferFrench") !== "false";

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    if (metric === "airports") {
      const rawAirports = searchAirports(q, scale, 8);
      const sanitizedAirports = rawAirports.map((ap) => {
        let displayCountryCode = ap.countryCode;
        if (ap.countryCode === "RU") {
          displayCountryCode = ap.longitude > 60.0 ? "RU (Asie)" : "RU (Europe)";
        }

        // Clean display label: e.g. "Paris — Charles De Gaulle (CDG)"
        const displayName = `${ap.cityName} — ${ap.name} (${ap.iata})`;

        return {
          id: ap.id,
          name: displayName,
          countryCode: displayCountryCode,
          scale: ap.scale,
          iata: ap.iata,
          cityName: ap.cityName,
        };
      });

      return NextResponse.json({ results: sanitizedAirports });
    }

    const rawResults = searchCities(q, scale, 8);
    // Anti-cheat: strip population and coordinates so they can NEVER be inspected before guessing
    const sanitizedResults = rawResults.map((city) => {
      // If matched via French alias or exonym (e.g. "Londres"), display "Londres (London)"
      let displayName = city.name;
      if (preferFrench && city.matchedAlias && city.matchedAlias.toLowerCase() !== city.name.toLowerCase()) {
        displayName = `${city.matchedAlias} (${city.name})`;
      }

      let displayCountryCode = city.countryCode;
      if (city.countryCode === "RU") {
        displayCountryCode = city.longitude > 60.0 ? "RU (Asie)" : "RU (Europe)";
      }

      return {
        id: city.id,
        name: displayName,
        countryCode: displayCountryCode,
        scale: city.scale,
      };
    });

    return NextResponse.json({ results: sanitizedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search locations" }, { status: 500 });
  }
}
