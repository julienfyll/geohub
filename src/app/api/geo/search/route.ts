import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/db/sqlite";
import { GameScale } from "@/lib/games/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const scale = (searchParams.get("scale") || "fr") as GameScale;
  const preferFrench = searchParams.get("preferFrench") !== "false";

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const rawResults = searchCities(q, scale, 8);
    // Anti-cheat: strip population and coordinates so they can NEVER be inspected before guessing
    const sanitizedResults = rawResults.map((city) => {
      // If matched via French alias or exonym (e.g. "Londres"), display "Londres (London)"
      let displayName = city.name;
      if (preferFrench && city.matchedAlias && city.matchedAlias.toLowerCase() !== city.name.toLowerCase()) {
        displayName = `${city.matchedAlias} (${city.name})`;
      }

      return {
        id: city.id,
        name: displayName,
        countryCode: city.countryCode,
        scale: city.scale,
      };
    });

    return NextResponse.json({ results: sanitizedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search cities" }, { status: 500 });
  }
}
