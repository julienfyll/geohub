import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/games/borderpath/engine";
import { BorderPathPack, BorderPathMode } from "@/lib/games/borderpath/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pack = (searchParams.get("pack") as BorderPathPack) || "monde";
    const mode = (searchParams.get("mode") as BorderPathMode) || "daily";
    const seed = searchParams.get("seed") || undefined;
    const startId = searchParams.get("start") || undefined;
    const targetId = searchParams.get("target") || undefined;
    const minSteps = searchParams.get("minSteps") ? parseInt(searchParams.get("minSteps")!, 10) : undefined;
    const maxSteps = searchParams.get("maxSteps") ? parseInt(searchParams.get("maxSteps")!, 10) : undefined;

    const session = generateChallenge({
      pack,
      mode,
      seed,
      startId,
      targetId,
      minSteps,
      maxSteps,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("[BorderPath] Session generation error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'initialiser la session BorderPath" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pack = (body.pack as BorderPathPack) || "monde";
    const mode = (body.mode as BorderPathMode) || "daily";
    const seed = body.seed || undefined;
    const startId = body.startId || undefined;
    const targetId = body.targetId || undefined;
    const minSteps = typeof body.minSteps === "number" ? body.minSteps : undefined;
    const maxSteps = typeof body.maxSteps === "number" ? body.maxSteps : undefined;

    const session = generateChallenge({
      pack,
      mode,
      seed,
      startId,
      targetId,
      minSteps,
      maxSteps,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("[BorderPath] Session POST error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'initialiser la session BorderPath" },
      { status: 500 }
    );
  }
}
