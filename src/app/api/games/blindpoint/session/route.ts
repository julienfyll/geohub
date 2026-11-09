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
  const rawMode = searchParams.get("mode") || "daily";
  const rawDiff = searchParams.get("difficulty") || "moyen";
  const userSeed = searchParams.get("seed") || undefined;

  const validPacks: BlindPointPack[] = [
    "villes_france",
    "villes_monde",
    "lieux_france",
    "lieux_monde",
    "lieux_paris",
    "monuments_monde",
    "chateaux_france",
  ];
  const pack: BlindPointPack = validPacks.includes(rawPack as BlindPointPack)
    ? (rawPack as BlindPointPack)
    : "villes_france";

  const mode: BlindPointMode = rawMode === "free" ? "free" : "daily";

  const validDifficulties: BlindPointDifficulty[] = ["facile", "moyen", "difficile"];
  const difficulty: BlindPointDifficulty = validDifficulties.includes(rawDiff as BlindPointDifficulty)
    ? (rawDiff as BlindPointDifficulty)
    : "moyen";

  const { seed, targets } = getSessionTargets(pack, mode, difficulty, userSeed);
  if (!targets || targets.length < 5) {
    return NextResponse.json({ error: "Failed to initialize game targets" }, { status: 500 });
  }

  const scale =
    pack === "lieux_paris"
      ? "paris"
      : pack === "villes_monde" || pack === "lieux_monde" || pack === "monuments_monde"
      ? "world"
      : "fr";
  const currentTarget = toClientTarget(targets[0], 0, 5);

  const response: BlindPointSessionInitResponse = {
    sessionId: `bp_${mode}_${pack}_${difficulty}_${hashString(seed)}`,
    pack,
    mode,
    difficulty,
    scale,
    seed,
    totalRounds: 5,
    currentTarget,
  };

  return NextResponse.json(response);
}
