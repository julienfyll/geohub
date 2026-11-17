import { NextRequest, NextResponse } from "next/server";
import { ALL_CAPITALS } from "@/lib/games/capitalblitz/engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "sprint60";
    const continent = searchParams.get("continent") || "all";
    const durationSeconds = parseInt(searchParams.get("duration") || "60", 10);

    const today = new Date().toISOString().split("T")[0];
    const seed =
      mode === "daily"
        ? `daily-blitz-${today}`
        : searchParams.get("seed") || `blitz-${Date.now().toString(36)}`;

    return NextResponse.json({
      success: true,
      mode,
      continent,
      durationSeconds,
      seed,
      totalAvailableCountries: ALL_CAPITALS.length,
    });
  } catch (error) {
    console.error("Capital Blitz session error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize session" },
      { status: 500 }
    );
  }
}
