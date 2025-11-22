import { NextRequest, NextResponse } from 'next/server';
import { getGame, updateGame } from '@/lib/game-store';
import { getGameStateForAgent, executeAgentAction } from '@/lib/agent-interface';

// This endpoint is designed to be called by external LLM agents
// The LLM should analyze the game state and return an action

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, playerId, action, reasoning } = body;

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

    // Check if it's this player's turn
    const currentPlayer = game.state.players[game.state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return NextResponse.json(
        { 
          error: 'Not your turn', 
          currentPlayer: currentPlayer.name,
          isYourTurn: false 
        },
        { status: 400 }
      );
    }

    // Execute the action provided by the LLM
    const result = executeAgentAction(game.state, playerId, action);

    if (result.success && result.newState) {
      updateGame(gameId, result.newState);
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      reasoning: reasoning || 'No reasoning provided',
      gamePhase: game.state.phase,
      gameOver: game.state.phase === 'game_over',
      currentPlayer: game.state.players[game.state.currentPlayerIndex].name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error}` },
      { status: 500 }
    );
  }
}

// GET endpoint to get game state formatted for LLM prompt
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

    // Format for LLM consumption
    const llmPrompt = {
      systemPrompt: `You are an expert Settlers of Catan player. Analyze the game state and decide your next move.

🎯 OBJECTIVE: Be the FIRST to reach 10 VICTORY POINTS

📊 VICTORY POINTS:
- Settlement: 1 VP
- City: 2 VP
- Longest Road (5+ roads): 2 VP
- First to 10 VP wins!

💰 BUILDING COSTS:
- Road: 1 Wood + 1 Brick
- Settlement: 1 Wood + 1 Brick + 1 Sheep + 1 Wheat
- City: 2 Wheat + 3 Ore
- In SETUP phases: Building is FREE

🚨 CRITICAL RULES (VIOLATIONS WILL FAIL):

1. DISTANCE RULE for Settlements:
   - Settlements MUST be at least 2 edges apart from ANY other settlement
   - NO settlements on adjacent vertices
   - Check the available vertices list - these already respect this rule

2. ROAD CONNECTION RULE:
   - Roads MUST connect to YOUR roads or settlements
   - In SETUP phases: Road MUST connect to your LAST settlement built
   - Check the available edges list - these already respect this rule

3. VALID ACTIONS by Phase:
   - setup_settlement_1/2: ONLY "build_settlement" (mandatory, free)
   - setup_road_1/2: ONLY "build_road" (mandatory, free, must connect to last settlement)
   - dice_roll: ONLY "roll"
   - main: "build_road", "build_settlement", "build_city", "trade_bank", or "end_turn"

4. CANNOT:
   - Build on occupied vertices/edges
   - Use "end_turn" in setup phases
   - Build without resources (except in setup)
   - Upgrade opponent's settlements

⚠️ IMPORTANT: Only use vertex/edge IDs from the "Available Positions" list provided in the game state.

Respond with JSON in this format:
{
  "type": "roll" | "build_road" | "build_settlement" | "build_city" | "trade_bank" | "end_turn",
  "data": { "vertexId": "..." } or { "edgeId": "..." } or { "give": {...}, "receive": "..." } or null,
  "reasoning": "your strategic reasoning"
}`,
      gameState: agentState,
      instructions: `Current Phase: ${agentState.gameInfo.phase}
Your Turn: ${agentState.gameInfo.isYourTurn}
Possible Actions: ${agentState.possibleActions.join(', ')}

Analyze the situation and decide your best move.`,
    };

    return NextResponse.json(llmPrompt);
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error}` },
      { status: 500 }
    );
  }
}

