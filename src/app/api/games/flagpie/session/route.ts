import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/games/flagpie/engine";
import { FlagPiePack, FlagPieMode } from "@/lib/games/flagpie/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pack = (body.pack || "monde") as FlagPiePack;
    const mode = (body.mode || "free") as FlagPieMode;
    const seed = body.seed as string | undefined;

    const challenge = generateChallenge({ pack, mode, seed });

    // Client-safe payload: strips the solution (name & ID) so it cannot be inspected in the DOM
    const safeRounds = challenge.countries.map((country, idx) => ({
      roundNumber: idx + 1,
      slices: country.slices,
    }));

    return NextResponse.json({
      success: true,
      sessionId: challenge.sessionId,
      pack: challenge.pack,
      mode: challenge.mode,
      dateStr: challenge.dateStr,
      totalRounds: safeRounds.length,
      rounds: safeRounds,
    });
  } catch (error) {
    console.error("[FlagPie] Session initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer la session de jeu" },
      { status: 500 }
    );
  }
}
