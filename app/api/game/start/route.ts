import { NextRequest, NextResponse } from "next/server";
import { GamesService } from "@/services/games.service";
import { ChainGamePayload } from "@/interface/Game";

export async function POST(request: NextRequest) {
  const gamesService = new GamesService();
  try {
    const payload = (await request.json()) as ChainGamePayload;

    if (!payload?.gameId) {
      return NextResponse.json(
        { error: "gameId is required in payload" },
        { status: 400 }
      );
    }

    const game = await gamesService.saveOnchainContext(payload);

    return NextResponse.json({
      success: true,
      message: "Game marked as ready with on-chain context",
      data: game,
    });
  } catch (error) {
    console.error("Error saving on-chain game context:", error);
    return NextResponse.json(
      { error: `Failed to save on-chain context: ${error}` },
      { status: 500 }
    );
  }
}
