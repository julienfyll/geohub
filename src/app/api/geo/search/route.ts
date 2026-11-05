import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/db/sqlite";
import { GameScale } from "@/lib/games/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const scale = (searchParams.get("scale") || "fr") as GameScale;

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = searchCities(q, scale, 8);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search cities" }, { status: 500 });
  }
}
