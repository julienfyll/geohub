import { NextRequest, NextResponse } from "next/server";
import {
  generateChallenge,
  validateGuess,
  calculateRoundScore,
} from "@/lib/games/flagpie/engine";
import { FlagPiePack, FlagPieMode } from "@/lib/games/flagpie/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      roundIndex = 0,
      guess = "",
      attemptNumber = 1,
      pack = "monde",
      mode = "free",
      isSkip = false,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId manquant" },
        { status: 400 }
      );
    }

    // Reconstruct the challenge deterministically via sessionId
    const challenge = generateChallenge({
      pack: pack as FlagPiePack,
      mode: mode as FlagPieMode,
      seed: sessionId,
    });

    const targetCountry = challenge.countries[roundIndex];
    if (!targetCountry) {
      return NextResponse.json(
        { success: false, error: "Manche invalide" },
        { status: 400 }
      );
    }

    // Handle Skip
    if (isSkip) {
      return NextResponse.json({
        success: true,
        isCorrect: false,
        roundComplete: true,
        gameOver: roundIndex >= challenge.countries.length - 1,
        attemptNumber,
        scoreEarned: 0,
        revealedCountry: {
          id: targetCountry.id,
          name: targetCountry.name,
          flag: targetCountry.flag,
          capital: targetCountry.capital,
          continent: targetCountry.continent,
          trivia: targetCountry.trivia,
        },
        message: `Manche passée : c'était ${targetCountry.name} ${targetCountry.flag}`,
      });
    }

    // Check if player's guess matches target country
    const isCorrect = validateGuess(targetCountry, guess);

    if (isCorrect) {
      const scoreEarned = calculateRoundScore(attemptNumber, true);
      const isGameOver = roundIndex >= challenge.countries.length - 1;

      return NextResponse.json({
        success: true,
        isCorrect: true,
        roundComplete: true,
        gameOver: isGameOver,
        attemptNumber,
        scoreEarned,
        revealedCountry: {
          id: targetCountry.id,
          name: targetCountry.name,
          flag: targetCountry.flag,
          capital: targetCountry.capital,
          continent: targetCountry.continent,
          trivia: targetCountry.trivia,
        },
        message: `Bravo ! C'est bien ${targetCountry.name} ${targetCountry.flag} (+${scoreEarned} pts)`,
      });
    }

    // Guess is incorrect
    const nextAttempt = attemptNumber + 1;
    const isRoundOver = attemptNumber >= 3;
    const isGameOver = isRoundOver && roundIndex >= challenge.countries.length - 1;

    // Hints per user rule:
    // - After 1st failed attempt (entering attempt 2): reveal ONLY Continent (NO letter count)
    // - After 2nd failed attempt (entering attempt 3): reveal ONLY First letter (NO capital)
    const revealedContinent =
      attemptNumber >= 1 ? targetCountry.continent : undefined;
    const revealedFirstLetter =
      attemptNumber >= 2 ? targetCountry.name.charAt(0).toUpperCase() : undefined;

    return NextResponse.json({
      success: true,
      isCorrect: false,
      roundComplete: isRoundOver,
      gameOver: isGameOver,
      attemptNumber: nextAttempt,
      scoreEarned: 0,
      revealedContinent,
      revealedFirstLetter,
      revealedCountry: isRoundOver
        ? {
            id: targetCountry.id,
            name: targetCountry.name,
            flag: targetCountry.flag,
            capital: targetCountry.capital,
            continent: targetCountry.continent,
            trivia: targetCountry.trivia,
          }
        : undefined,
      message: isRoundOver
        ? `Échec : c'était ${targetCountry.name} ${targetCountry.flag}`
        : attemptNumber === 1
        ? `Raté ! Indice débloqué : Continent.`
        : `Raté ! Dernier essai : Première lettre débloquée.`,
    });
  } catch (error) {
    console.error("[FlagPie] Guess validation error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur de validation de la réponse" },
      { status: 500 }
    );
  }
}
