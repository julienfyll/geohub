import { NextRequest, NextResponse } from "next/server";
import { getPackGraph, validateStep, findShortestPath } from "@/lib/games/borderpass/engine";
import { BorderPassPack } from "@/lib/games/borderpass/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentId, candidateId, targetId, visitedIds = [], pack = "monde" } = body;

    if (!currentId || !candidateId || !targetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres manquants : currentId, candidateId et targetId sont requis.",
        },
        { status: 400 }
      );
    }

    const graph = getPackGraph(pack as BorderPassPack);
    const stepResult = validateStep(
      currentId,
      candidateId,
      targetId,
      visitedIds,
      graph
    );

    let optimalSolutions: string[][] = [];
    if (stepResult.isComplete) {
      // Return the optimal shortest paths from original start to target for post-game comparison
      const startId = visitedIds[0] || currentId;
      const shortest = findShortestPath(startId, targetId, graph);
      optimalSolutions = shortest.paths.slice(0, 3);
    }

    return NextResponse.json({
      success: true,
      result: stepResult,
      optimalSolutions,
    });
  } catch (error) {
    console.error("[BorderPass] Step validation error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur de validation de l'étape" },
      { status: 500 }
    );
  }
}
