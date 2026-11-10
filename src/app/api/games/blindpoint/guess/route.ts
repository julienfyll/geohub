import { NextRequest, NextResponse } from "next/server";
import {
  BlindPointPack,
  BlindPointMode,
  BlindPointGuessRequest,
  BlindPointGuessResponse,
} from "@/lib/games/blindpoint/types";
import {
  getSessionTargets,
  toClientTarget,
  getProxyImageUrl,
  getTargetsByPack,
} from "@/lib/games/blindpoint/targets";
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

    const requestedRounds = typeof rawTotalRounds === "number" && rawTotalRounds >= 3 ? Math.min(50, rawTotalRounds) : 5;

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

    const packsToUse = packs && packs.length > 0 ? packs : pack;
    const { targets } = getSessionTargets(packsToUse, mode, difficulty, seed, requestedRounds, continent);
    const totalRounds = targets ? Math.min(requestedRounds, targets.length) : 0;
    if (!targets || totalRounds < 3) {
      return NextResponse.json({ error: "Failed to load targets for session" }, { status: 500 });
    }

    if (typeof roundIndex !== "number" || roundIndex < 0 || roundIndex >= totalRounds) {
      return NextResponse.json({ error: "Invalid round index" }, { status: 400 });
    }

    // 1. Resolve the target: prioritizes targetId if provided by the client,
    // ensuring the server evaluates the EXACT city the player was asked to find.
    let target = null;
    let targetIdxInSession = -1;

    if (targetId) {
      targetIdxInSession = targets.findIndex((t) => t.id === targetId);
      if (targetIdxInSession !== -1) {
        target = targets[targetIdxInSession];
      } else {
        // Fallback: look into the pack pool directly if session parameters drifted
        const packList: BlindPointPack[] = Array.isArray(packsToUse) ? packsToUse : [packsToUse];
        for (const p of packList) {
          const pool = getTargetsByPack(p);
          const found = pool.find((t) => t.id === targetId);
          if (found) {
            target = found;
            break;
          }
        }
      }
    }

    // Default fallback to roundIndex in session targets
    if (!target) {
      target = targets[roundIndex];
    }

    if (!target) {
      return NextResponse.json({ error: "Target not found for current round" }, { status: 404 });
    }

    // Haversine exact distance
    const distanceKm = getDistanceKm(guessLat, guessLon, target.latitude, target.longitude);

    // Exponential scoring
    const score = calculateBlindPointScore(distanceKm, target.scale);
    const rating = getScoreRating(distanceKm, score, target.scale);

    const effectiveIndex = targetIdxInSession !== -1 ? targetIdxInSession : roundIndex;
    const isGameOver = effectiveIndex >= totalRounds - 1;
    const nextTarget = isGameOver
      ? null
      : toClientTarget(targets[effectiveIndex + 1], effectiveIndex + 1, totalRounds);

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
