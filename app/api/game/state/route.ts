import { NextRequest, NextResponse } from 'next/server';
import { getGame } from '@/lib/game-store';
import { getGameStateForAgent } from '@/lib/agent-interface';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const playerId = searchParams.get('playerId');

    if (!gameId || !playerId) {
      return NextResponse.json(
        { error: 'gameId and playerId required' },
        { status: 400 }
      );
    }

    const game = getGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const agentState = getGameStateForAgent(game.state, playerId);

    return NextResponse.json(agentState);
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error}` },
      { status: 400 }
    );
  }
}

