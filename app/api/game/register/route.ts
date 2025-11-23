import { NextRequest, NextResponse } from "next/server";
import { GamesService } from "@/services/games.service";

const gamesService = new GamesService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, agentIds, bettorAddress, bettorChoice } = body;

    const parsedGameId = typeof gameId === "string" ? parseInt(gameId, 10) : gameId;

    if (!parsedGameId || Number.isNaN(parsedGameId)) {
      return NextResponse.json(
        { error: "gameId (number) is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(agentIds) || agentIds.length < 2 || agentIds.length > 4) {
      return NextResponse.json(
        { error: "agentIds must be an array with 2-4 elements" },
        { status: 400 }
      );
    }

    const game = await gamesService.registerGameRequest(
      parsedGameId,
      agentIds,
      bettorAddress,
      bettorChoice
    );

    return NextResponse.json({
      success: true,
      message: "Game registered and waiting for VRF",
      data: game,
    });
  } catch (error) {
    console.error("Error registering game:", error);
    return NextResponse.json(
      { error: `Failed to register game: ${error}` },
      { status: 500 }
    );
  }
}
