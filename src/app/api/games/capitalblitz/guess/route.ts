import { NextRequest, NextResponse } from "next/server";
import { ALL_CAPITALS, checkCapital, getComboMultiplier } from "@/lib/games/capitalblitz/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { countryId, guess, streak = 0 } = body;

    if (!countryId || !guess) {
      return NextResponse.json(
        { success: false, error: "Missing countryId or guess" },
        { status: 400 }
      );
    }

    const country = ALL_CAPITALS.find((c) => c.id === countryId);
    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 404 }
      );
    }

    const isCorrect = checkCapital(guess, country);
    const multiplier = getComboMultiplier(streak);
    const pointsEarned = isCorrect ? Math.round(100 * multiplier) : 0;

    return NextResponse.json({
      success: true,
      isCorrect,
      correctCapital: country.capital,
      pointsEarned,
      multiplier,
    });
  } catch (error) {
    console.error("Capital Blitz guess validation error:", error);
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
