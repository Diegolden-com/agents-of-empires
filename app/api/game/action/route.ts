import { NextRequest, NextResponse } from 'next/server';
import { getGame, updateGame } from '@/lib/game-store';
import { executeAgentAction, AgentAction } from '@/lib/agent-interface';
import { getCurrentPlayer } from '@/lib/game-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, playerId, action } = body;

    if (!gameId || !playerId || !action) {
      return NextResponse.json(
        { error: 'gameId, playerId, and action required' },
        { status: 400 }
      );
    }

    const game = getGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const result = executeAgentAction(game.state, playerId, action as AgentAction);

    if (result.success && result.newState) {
      updateGame(gameId, result.newState);
    }

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        gamePhase: game.state.phase,
        currentPlayer: getCurrentPlayer(game.state).name,
        gameOver: game.state.phase === 'game_over',
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid request: ${error}` },
      { status: 400 }
    );
  }
}

