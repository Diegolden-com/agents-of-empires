#!/usr/bin/env node
// Example: Simple AI agent that plays Catan via API

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface GameState {
  gameInfo: any;
  yourInfo: any;
  opponents: any[];
  boardState: any;
  possibleActions: string[];
}

class SimpleAgent {
  private gameId: string;
  private playerId: string;
  private playerName: string;

  constructor(gameId: string, playerId: string, playerName: string) {
    this.gameId = gameId;
    this.playerId = playerId;
    this.playerName = playerName;
  }

  async getGameState(): Promise<GameState> {
    const response = await fetch(
      `${API_URL}/game/state?gameId=${this.gameId}&playerId=${this.playerId}`
    );
    return response.json();
  }

  async executeAction(action: any): Promise<any> {
    const response = await fetch(`${API_URL}/game/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: this.gameId,
        playerId: this.playerId,
        action,
      }),
    });
    return response.json();
  }

  async makeDecision(state: GameState): Promise<any> {
    console.log(`\n[${this.playerName}] Making decision...`);
    console.log(`Phase: ${state.gameInfo.phase}`);
    console.log(`Possible actions: ${state.possibleActions.join(', ')}`);

    // Simple decision logic
    if (state.possibleActions.includes('roll')) {
      return { type: 'roll' };
    }

    if (state.possibleActions.includes('build_settlement')) {
      // Pick first available vertex
      const vertex = state.boardState.availableVertices[0];
      if (vertex) {
        return {
          type: 'build_settlement',
          data: { vertexId: vertex.id },
        };
      }
    }

    if (state.possibleActions.includes('build_road')) {
      // Pick first available edge
      const edge = state.boardState.availableEdges[0];
      if (edge) {
        return {
          type: 'build_road',
          data: { edgeId: edge.id },
        };
      }
    }

    if (state.possibleActions.includes('build_city')) {
      // Upgrade first settlement
      const settlement = state.boardState.yourBuildings.settlements[0];
      if (settlement) {
        return {
          type: 'build_city',
          data: { vertexId: settlement.vertexId },
        };
      }
    }

    if (state.possibleActions.includes('trade_bank')) {
      // Trade if we have 4+ of any resource
      const resources = state.yourInfo.resources;
      for (const [resource, amount] of Object.entries(resources)) {
        if ((amount as number) >= 4) {
          // Trade 4:1 for a resource we need
          const needResource = ['wood', 'brick', 'sheep', 'wheat', 'ore'].find(
            r => (resources as any)[r] < 2
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

    if (state.possibleActions.includes('end_turn')) {
      return { type: 'end_turn' };
    }

    return { type: 'end_turn' };
  }

  async playTurn(): Promise<boolean> {
    try {
      const state = await this.getGameState();

      if (!state.gameInfo.isYourTurn) {
        return false; // Not our turn
      }

      if (state.gameInfo.phase === 'game_over') {
        console.log(`\n[${this.playerName}] Game is over!`);
        return true; // Game ended
      }

      const action = await this.makeDecision(state);
      console.log(`[${this.playerName}] Executing action:`, action.type);

      const result = await this.executeAction(action);
      console.log(`[${this.playerName}] Result:`, result.message);

      if (result.gameOver) {
        return true; // Game ended
      }

      return false;
    } catch (error) {
      console.error(`[${this.playerName}] Error:`, error);
      return false;
    }
  }
}

async function createGame(playerNames: string[]): Promise<{ gameId: string; players: any[] }> {
  const response = await fetch(`${API_URL}/game/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ players: playerNames }),
  });
  return response.json();
}

async function main() {
  console.log('🎲 Simple Catan Agent Example\n');

  // Create game
  const playerNames = ['SimpleAgent1', 'SimpleAgent2', 'SimpleAgent3'];
  console.log(`Creating game with players: ${playerNames.join(', ')}`);
  
  const gameInfo = await createGame(playerNames);
  console.log(`Game created with ID: ${gameInfo.gameId}\n`);

  // Create agent instances
  const agents = gameInfo.players.map(
    (player: any) => new SimpleAgent(gameInfo.gameId, player.id, player.name)
  );

  // Game loop
  let gameOver = false;
  let turnCount = 0;
  const maxTurns = 100; // Safety limit

  while (!gameOver && turnCount < maxTurns) {
    // Each agent tries to play
    for (const agent of agents) {
      const result = await agent.playTurn();
      if (result) {
        gameOver = true;
        break;
      }
      // Small delay between actions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    turnCount++;
    if (turnCount % 10 === 0) {
      console.log(`\n--- Completed ${turnCount} turns ---\n`);
    }
  }

  console.log('\n🎉 Game finished!');
}

main().catch(console.error);

