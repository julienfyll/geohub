import { NextRequest, NextResponse } from "next/server";
import {
  BlindPointPack,
  BlindPointMode,
  BlindPointGuessRequest,
  BlindPointGuessResponse,
} from "@/lib/games/blindpoint/types";
import { getSessionTargets, toClientTarget, getProxyImageUrl } from "@/lib/games/blindpoint/targets";
import { getDistanceKm } from "@/lib/geo/haversine";
import { calculateBlindPointScore, getScoreRating } from "@/lib/games/blindpoint/scoring";

export async function POST(request: NextRequest) {
  try {
    const body: BlindPointGuessRequest = await request.json();
    const {
      pack,
      packs,
      mode,
      difficulty,
      seed,
      roundIndex,
      totalRounds: rawTotalRounds,
      continent,
      targetId,
      guessLat,
      guessLon,
    } = body;

    const totalRounds = typeof rawTotalRounds === "number" && rawTotalRounds >= 3 ? rawTotalRounds : 5;

    if (
      typeof guessLat !== "number" ||
      typeof guessLon !== "number" ||
      isNaN(guessLat) ||
      isNaN(guessLon)
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    if (guessLat < -90 || guessLat > 90 || guessLon < -180 || guessLon > 180) {
      return NextResponse.json({ error: "Coordinates out of bounds" }, { status: 400 });
    }

    if (typeof roundIndex !== "number" || roundIndex < 0 || roundIndex >= totalRounds) {
      return NextResponse.json({ error: "Invalid round index" }, { status: 400 });
    }

    const packsToUse = packs && packs.length > 0 ? packs : pack;
    const { targets } = getSessionTargets(packsToUse, mode, difficulty, seed, totalRounds, continent);
    if (!targets || targets.length < totalRounds) {
      return NextResponse.json({ error: "Failed to load targets for session" }, { status: 500 });
    }

    const target = targets[roundIndex];
    if (!target) {
      return NextResponse.json({ error: "Target not found for current round" }, { status: 404 });
    }

    // Haversine exact distance
    const distanceKm = getDistanceKm(guessLat, guessLon, target.latitude, target.longitude);

    // Exponential scoring
    const score = calculateBlindPointScore(distanceKm, target.scale);
    const rating = getScoreRating(distanceKm, score, target.scale);

    const isGameOver = roundIndex >= totalRounds - 1;
    const nextTarget = isGameOver
      ? null
      : toClientTarget(targets[roundIndex + 1], roundIndex + 1, totalRounds);

    const response: BlindPointGuessResponse = {
      roundIndex,
      target: {
        ...target,
        imageUrl: getProxyImageUrl(target.imageUrl),
      },
      guess: {
        lat: guessLat,
        lon: guessLon,
      },
      distanceKm,
      score,
      ratingEmoji: rating.emoji,
      ratingLabel: rating.label,
      nextTarget,
      isGameOver,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("BlindPoint guess error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
