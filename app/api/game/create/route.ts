import { NextRequest, NextResponse } from 'next/server';
import { createGame } from '@/lib/game-engine';
import { createGameSession } from '@/lib/game-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { players } = body;

    if (!players || !Array.isArray(players)) {
      return NextResponse.json(
        { error: 'players array required' },
        { status: 400 }
      );
    }

    if (players.length < 2 || players.length > 4) {
      return NextResponse.json(
        { error: 'Catan requires 2-4 players' },
        { status: 400 }
      );
    }

    const gameState = createGame(players);
    const gameId = createGameSession(gameState);

    return NextResponse.json({
      gameId,
      message: 'Game created successfully',
      players: gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid request: ${error}` },
      { status: 400 }
    );
  }
}

