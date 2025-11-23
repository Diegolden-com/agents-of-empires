import { NextRequest, NextResponse } from "next/server";
import { getGameActionIntegrator } from "@/services/gameActionIntegrator.service";

const integrator = getGameActionIntegrator();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, winnerAgentId, winnerIndex, totalTurns } = body || {};

    const parsedGameId = typeof gameId === "string" ? parseInt(gameId, 10) : gameId;

    if (!parsedGameId || Number.isNaN(parsedGameId)) {
      return NextResponse.json({ error: "gameId (number) is required" }, { status: 400 });
    }
    if (!winnerAgentId || typeof winnerAgentId !== "string") {
      return NextResponse.json({ error: "winnerAgentId (string) is required" }, { status: 400 });
    }
    if (winnerIndex === undefined || winnerIndex === null || Number.isNaN(Number(winnerIndex))) {
      return NextResponse.json({ error: "winnerIndex (number) is required" }, { status: 400 });
    }

    const turns = Number.isNaN(Number(totalTurns)) ? 0 : Number(totalTurns);

    await integrator.finishGame(parsedGameId, winnerAgentId, Number(winnerIndex), turns);

    return NextResponse.json({
      success: true,
      message: `Game ${parsedGameId} finished manually`,
      data: {
        gameId: parsedGameId,
        winnerAgentId,
        winnerIndex: Number(winnerIndex),
        totalTurns: turns,
      },
    });
  } catch (error) {
    console.error("Error finishing game manually:", error);
    return NextResponse.json(
      { error: `Failed to finish game manually: ${error}` },
      { status: 500 }
    );
  }
}
