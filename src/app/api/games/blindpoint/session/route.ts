import { NextRequest, NextResponse } from "next/server";
import {
  BlindPointPack,
  BlindPointMode,
  BlindPointDifficulty,
  BlindPointSessionInitResponse,
} from "@/lib/games/blindpoint/types";
import { getSessionTargets, toClientTarget, hashString } from "@/lib/games/blindpoint/targets";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPack = searchParams.get("pack") || "villes_france";
  const rawPacks = searchParams.get("packs");
  const rawMode = searchParams.get("mode") || "daily";
  const rawDiff = searchParams.get("difficulty") || searchParams.get("diff") || "moyen";
  const rawRounds = searchParams.get("rounds");
  const rawTimer = searchParams.get("timer");
  const continent = searchParams.get("continent") || undefined;
  const userSeed = searchParams.get("seed") || undefined;

  const validPacks: BlindPointPack[] = [
    "villes_france",
    "villes_monde",
    "villes_europe",
    "lieux_france",
    "lieux_monde",
    "lieux_paris",
    "monuments_monde",
    "chateaux_france",
  ];

  // Resolve pack or list of packs
  let packsToUse: BlindPointPack[] = [];
  if (rawPacks) {
    const split = rawPacks.split(",").map((s) => s.trim()) as BlindPointPack[];
    packsToUse = split.filter((p) => validPacks.includes(p));
  }
  if (packsToUse.length === 0) {
    const singlePack: BlindPointPack = validPacks.includes(rawPack as BlindPointPack)
      ? (rawPack as BlindPointPack)
      : "villes_france";
    packsToUse = [singlePack];
  }

  const primaryPack = packsToUse[0];
  const mode: BlindPointMode = rawMode === "custom" ? "custom" : rawMode === "free" ? "free" : "daily";

  const difficulty: BlindPointDifficulty | "all" =
    rawDiff === "all" ? "all" : ["facile", "moyen", "difficile"].includes(rawDiff)
      ? (rawDiff as BlindPointDifficulty)
      : "moyen";

  // Total rounds: 3 to 50 (default 5)
  const parsedRounds = rawRounds ? parseInt(rawRounds, 10) : 5;
  const totalRounds = isNaN(parsedRounds) ? 5 : Math.max(3, Math.min(50, parsedRounds));

  // Timer duration (0 = infinite / off)
  const timerSeconds = rawTimer ? parseInt(rawTimer, 10) : undefined;

  const { seed, targets, scale } = getSessionTargets(
    packsToUse.length === 1 ? packsToUse[0] : packsToUse,
    mode,
    difficulty,
    userSeed,
    totalRounds,
    continent
  );

  const actualTotalRounds = targets ? Math.min(totalRounds, targets.length) : 0;
  if (!targets || actualTotalRounds < 3) {
    return NextResponse.json({ error: "Failed to initialize game targets" }, { status: 500 });
  }

  const currentTarget = toClientTarget(targets[0], 0, actualTotalRounds);

  const response: BlindPointSessionInitResponse = {
    sessionId: `bp_${mode}_${packsToUse.join("_")}_${mode === "daily" ? "standard" : difficulty}_${hashString(seed)}`,
    pack: primaryPack,
    packs: packsToUse,
    mode,
    difficulty,
    scale,
    seed,
    totalRounds: actualTotalRounds,
    timerSeconds: timerSeconds !== undefined && !isNaN(timerSeconds) ? timerSeconds : undefined,
    currentTarget,
  };

  return NextResponse.json(response);
}
