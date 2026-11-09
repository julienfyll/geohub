import { NextRequest, NextResponse } from "next/server";
import { BlindPointPack, BlindPointMode, BlindPointSessionInitResponse } from "@/lib/games/blindpoint/types";
import { getSessionTargets, toClientTarget, hashString } from "@/lib/games/blindpoint/targets";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawPack = searchParams.get("pack") || "villes_france";
  const rawMode = searchParams.get("mode") || "daily";
  const userSeed = searchParams.get("seed") || undefined;

  const validPacks: BlindPointPack[] = ["villes_france", "monuments_monde", "chateaux_france"];
  const pack: BlindPointPack = validPacks.includes(rawPack as BlindPointPack)
    ? (rawPack as BlindPointPack)
    : "villes_france";

  const mode: BlindPointMode = rawMode === "free" ? "free" : "daily";

  const { seed, targets } = getSessionTargets(pack, mode, userSeed);
  if (!targets || targets.length < 5) {
    return NextResponse.json({ error: "Failed to initialize game targets" }, { status: 500 });
  }

  const scale = pack === "monuments_monde" ? "world" : "fr";
  const currentTarget = toClientTarget(targets[0], 0, 5);

  const response: BlindPointSessionInitResponse = {
    sessionId: `bp_${mode}_${pack}_${hashString(seed)}`,
    pack,
    mode,
    scale,
    seed,
    totalRounds: 5,
    currentTarget,
  };

  return NextResponse.json(response);
}
