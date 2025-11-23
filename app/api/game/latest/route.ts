import { NextRequest, NextResponse } from "next/server";
import { GamesService } from "@/services/games.service";

const gamesService = new GamesService();

// GET /api/game/latest -> último juego finalizado (finished)
export async function GET(_req: NextRequest) {
  try {
    const game = await gamesService.getLastFinishedGame();

    if (!game) {
      return NextResponse.json(
        { error: "No finished games found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId: game.game_id,
        winner_agent: game.winner_agent,
        winner_index: game.winner_index,
        status: game.status,
      },
    });
  } catch (error) {
    console.error("Error fetching latest finished game:", error);
    return NextResponse.json(
      { error: `Failed to fetch latest finished game: ${error}` },
      { status: 500 }
    );
  }
}
