import { NextRequest, NextResponse } from 'next/server';
import { getGame, updateGame } from '@/lib/game-store';
import { getGameStateForAgent, executeAgentAction } from '@/lib/agent-interface';

// Simple AI agent that makes basic decisions
function makeSimpleDecision(state: any): any {
  const { gameInfo, yourInfo, boardState, possibleActions } = state;

  // Roll dice if needed
  if (possibleActions.includes('roll')) {
    return { type: 'roll' };
  }

  // Setup phase - build settlement
  if (possibleActions.includes('build_settlement')) {
    const vertex = boardState.availableVertices[0];
    if (vertex) {
      return {
        type: 'build_settlement',
        data: { vertexId: vertex.id },
      };
    }
  }

  // Setup phase - build road
  if (possibleActions.includes('build_road')) {
    const edge = boardState.availableEdges[0];
    if (edge) {
      return {
        type: 'build_road',
        data: { edgeId: edge.id },
      };
    }
  }

  // Main game - try to build city
  if (possibleActions.includes('build_city')) {
    const settlement = boardState.yourBuildings.settlements[0];
    if (settlement) {
      return {
        type: 'build_city',
        data: { vertexId: settlement.vertexId },
      };
    }
  }

  // Main game - try to build settlement
  if (possibleActions.includes('build_settlement') && boardState.availableVertices.length > 0) {
    const vertex = boardState.availableVertices[0];
    return {
      type: 'build_settlement',
      data: { vertexId: vertex.id },
    };
  }

  // Main game - try to build road
  if (possibleActions.includes('build_road') && boardState.availableEdges.length > 0) {
    const edge = boardState.availableEdges[0];
    return {
      type: 'build_road',
      data: { edgeId: edge.id },
    };
  }

  // Trade if we have too many of one resource
  if (possibleActions.includes('trade_bank')) {
    const resources = yourInfo.resources;
    for (const [resource, amount] of Object.entries(resources)) {
      if ((amount as number) >= 4) {
        const needResource = ['wood', 'brick', 'sheep', 'wheat', 'ore'].find(
          (r) => (resources as any)[r] < 2
        ) || 'wood';

        return {
          type: 'trade_bank',
          data: {
            give: { [resource]: 4 },
            receive: needResource,
          },
        };
      }
    }
  }

  // End turn if nothing else to do
  if (possibleActions.includes('end_turn')) {
    return { type: 'end_turn' };
  }

  return { type: 'end_turn' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, playerId } = body;

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

    // Check if it's this player's turn
    const currentPlayer = game.state.players[game.state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return NextResponse.json(
        { error: 'Not your turn', currentPlayer: currentPlayer.name },
        { status: 400 }
      );
    }

    // Get game state for agent
    const agentState = getGameStateForAgent(game.state, playerId);

    // Make decision
    const action = makeSimpleDecision(agentState);

    // Execute action
    const result = executeAgentAction(game.state, playerId, action);

    if (result.success && result.newState) {
      updateGame(gameId, result.newState);
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      action,
      gamePhase: game.state.phase,
      gameOver: game.state.phase === 'game_over',
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error}` },
      { status: 500 }
    );
  }
}

