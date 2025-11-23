import { NextRequest, NextResponse } from "next/server";
import { GamesService } from "@/services/games.service";

export async function GET(request: NextRequest) {
  const gamesService = new GamesService();
  const gameIdParam = request.nextUrl.searchParams.get("gameId");

  if (!gameIdParam) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const gameId = parseInt(gameIdParam, 10);
  if (Number.isNaN(gameId)) {
    return NextResponse.json(
      { error: "gameId must be a number" },
      { status: 400 }
    );
  }

  try {
    const game = await gamesService.getGameByGameId(gameId);

    if (!game) {
      return NextResponse.json(
        { error: `Game ${gameId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: game,
    });
  } catch (error) {
    console.error("Error fetching game status:", error);
    return NextResponse.json(
      { error: `Failed to fetch game: ${error}` },
      { status: 500 }
    );
  }
}
