import { NextRequest, NextResponse } from "next/server";
import { GameMovesService } from "@/services/gameMoves.service";
import { GameMoveInsert } from "@/interface/GameMoves";

export async function GET(request: NextRequest) {
  const gameMovesService = new GameMovesService();
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    const gameIdNumber = parseInt(gameId);
    if (isNaN(gameIdNumber)) {
      return NextResponse.json(
        { error: "gameId must be a valid number" },
        { status: 400 }
      );
    }

    const moves = await gameMovesService.getGameMovesByGameId(gameIdNumber);

    return NextResponse.json({
      success: true,
      data: moves,
      count: moves.length,
    });
  } catch (error) {
    console.error("Error fetching game moves:", error);
    return NextResponse.json(
      { error: `Failed to fetch game moves: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const gameMovesService = new GameMovesService();
  try {
    const body = await request.json();

    const requiredFields = [
      "game_id",
      "agent",
      "move_type",
      "data",
      "nonce",
      "nonce_evvm",
      "priority_fee_evvm",
      "priority_flag_evvm",
      "signature",
      "signature_evvm",
    ];

    const missingFields = requiredFields.filter((field) => !(field in body));

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const moveData: GameMoveInsert = {
      game_id: body.game_id,
      agent: body.agent,
      move_type: body.move_type,
      data: body.data,
      nonce: body.nonce,
      nonce_evvm: body.nonce_evvm,
      priority_fee_evvm: body.priority_fee_evvm,
      priority_flag_evvm: body.priority_flag_evvm,
      signature: body.signature,
      signature_evvm: body.signature_evvm,
      status: body.status || "pending",
      tx_hash: body.tx_hash || null,
    };

    const newMove = await gameMovesService.insertGameMove(moveData);

    return NextResponse.json(
      {
        success: true,
        data: newMove,
        message: "Game move created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating game move:", error);
    return NextResponse.json(
      { error: `Failed to create game move: ${error}` },
      { status: 500 }
    );
  }
}
