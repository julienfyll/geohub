import { NextRequest, NextResponse } from "next/server";
import {
  getPackGraph,
  validateStep,
  validateBidirectionalStep,
  findShortestPath,
} from "@/lib/games/borderpath/engine";
import { BorderPathPack } from "@/lib/games/borderpath/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      candidateId,
      branchAIds,
      branchBIds,
      currentId,
      targetId,
      visitedIds = [],
      pack = "monde",
    } = body;

    const graph = getPackGraph(pack as BorderPathPack);

    // Bidirectional mode validation
    if (branchAIds && branchBIds && candidateId) {
      const result = validateBidirectionalStep(
        candidateId,
        branchAIds,
        branchBIds,
        graph
      );

      let optimalSolutions: string[][] = [];
      if (result.isComplete) {
        const startId = branchAIds[0];
        const endId = branchBIds[0];
        const shortest = findShortestPath(startId, endId, graph);
        optimalSolutions = shortest.paths.slice(0, 3);
      }

      return NextResponse.json({
        success: true,
        result,
        optimalSolutions,
      });
    }

    // Classic single-directed fallback
    if (!currentId || !candidateId || !targetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres manquants : candidateId et soit (branchAIds, branchBIds), soit (currentId, targetId) sont requis.",
        },
        { status: 400 }
      );
    }

    const stepResult = validateStep(
      currentId,
      candidateId,
      targetId,
      visitedIds,
      graph
    );

    let optimalSolutions: string[][] = [];
    if (stepResult.isComplete) {
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
    console.error("[BorderPath] Step validation error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur de validation de l'étape" },
      { status: 500 }
    );
  }
}
