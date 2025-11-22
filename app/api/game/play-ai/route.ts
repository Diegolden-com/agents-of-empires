import { NextRequest } from 'next/server';
import { createGame, getCurrentPlayer } from '@/lib/game-engine';
import { createGameSession, updateGame } from '@/lib/game-store';
import { getAgentById } from '@/lib/agent-configs';
import { getAgentDecision, AgentDecision } from '@/lib/agent-decision';
import { getGameStateForAgent, executeAgentAction } from '@/lib/agent-interface';
import { GameState } from '@/lib/types';

export const maxDuration = 300; // 5 minutes for long games

// Serialize game state to plain object for JSON transmission
function serializeGameState(state: GameState) {
  return {
    board: {
      hexes: state.board.hexes.map(h => ({
        id: h.id,
        position: h.position,
        terrain: h.terrain,
        number: h.number,
      })),
      vertices: state.board.vertices.map(v => ({
        id: v.id,
        hexIds: v.hexIds,
        building: v.building,
      })),
      edges: state.board.edges.map(e => ({
        id: e.id,
        vertexIds: e.vertexIds,
        road: e.road,
      })),
    },
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      resources: { ...p.resources },
      developmentCards: [...p.developmentCards],
      roads: p.roads,
      settlements: p.settlements,
      cities: p.cities,
      victoryPoints: p.victoryPoints,
      longestRoad: p.longestRoad,
      largestArmy: p.largestArmy,
      knightsPlayed: p.knightsPlayed,
    })),
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    diceRoll: state.diceRoll,
    turn: state.turn,
    longestRoadPlayerId: state.longestRoadPlayerId,
    largestArmyPlayerId: state.largestArmyPlayerId,
  };
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Read agent selections from request body
        const body = await req.json();
        const { agentIds } = body as { agentIds: string[] };

        if (!agentIds || agentIds.length < 2 || agentIds.length > 4) {
          send({ type: 'error', message: 'Need 2-4 agent IDs' });
          controller.close();
          return;
        }

        // Get agent configurations
        const agentConfigs = agentIds.map(id => getAgentById(id)).filter(Boolean);
        
        if (agentConfigs.length !== agentIds.length) {
          send({ type: 'error', message: 'Invalid agent IDs' });
          controller.close();
          return;
        }

        console.log('🎲 Catan AI Game starting:', agentConfigs.map(a => a!.name).join(' vs '));

        // Create game
        const playerNames = agentConfigs.map(a => a!.name);
        const gameState = createGame(playerNames);
        const gameId = createGameSession(gameState);
        
        console.log(`🎮 Game created with ID: ${gameId}`);

        send({ 
          type: 'game_start', 
          gameId,
          players: gameState.players.map((p, i) => ({
            ...p,
            agentConfig: agentConfigs[i],
          })),
          gameState: serializeGameState(gameState),
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Send initial greetings
        gameState.players.forEach((player, i) => {
          const agent = agentConfigs[i]!;
          const greeting = getGreeting(agent);
          send({ 
            type: 'greeting', 
            playerId: player.id, 
            playerName: player.name,
            message: greeting,
          });
        });

        await new Promise(resolve => setTimeout(resolve, 800));

        const conversationHistory: Array<{ from: string; text: string }> = [];
        const maxTurns = 100;
        let turnCount = 0;
        let consecutiveFailures = 0;
        const MAX_CONSECUTIVE_FAILURES = 3;

        // Game loop
        while (turnCount < maxTurns) {
          // Check if someone won
          const hasWinner = gameState.players.some(p => p.victoryPoints >= 10);
          if (hasWinner) break;
          turnCount++;
          const currentPlayer = getCurrentPlayer(gameState);
          const currentAgentConfig = agentConfigs[gameState.currentPlayerIndex];

          if (!currentAgentConfig) break;

          console.log(`\n🎯 Turn ${gameState.turn} | Phase: ${gameState.phase} | Player: ${currentPlayer.name}`);
          
          send({ 
            type: 'turn_start', 
            turn: gameState.turn,
            phase: gameState.phase,
            currentPlayer: {
              id: currentPlayer.id,
              name: currentPlayer.name,
              victoryPoints: currentPlayer.victoryPoints,
            },
            gameState: serializeGameState(gameState),
          });

          // Send thinking indicator
          send({ type: 'thinking', playerId: currentPlayer.id, playerName: currentPlayer.name });

          await new Promise(resolve => setTimeout(resolve, 300));

          // Get AI decision
          let decision: AgentDecision;
          try {
            decision = await getAgentDecision(
              currentAgentConfig,
              gameState,
              currentPlayer.id,
              conversationHistory
            );
          } catch (error) {
            console.error(`❌ Decision error for ${currentPlayer.name}:`, error);
            consecutiveFailures++;
            send({ 
              type: 'error', 
              message: `Error getting decision from ${currentPlayer.name}: ${error}`,
              playerId: currentPlayer.id,
            });
            
            // If too many decision errors, skip to next player instead of breaking
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              console.error(`❌ Too many decision errors, skipping player ${currentPlayer.name}`);
              consecutiveFailures = 0;
              gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
              if (gameState.phase === 'main') {
                gameState.phase = 'dice_roll';
              }
            }
            continue; // Continue instead of break
          }

          send({
            type: 'decision',
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            action: decision.action,
            message: decision.message,
            reasoning: decision.reasoning,
            data: decision.data,
          });

          conversationHistory.push({ 
            from: currentPlayer.name, 
            text: decision.message,
          });

          await new Promise(resolve => setTimeout(resolve, 400));

          // Execute action
          const result = executeAgentAction(gameState, currentPlayer.id, {
            type: decision.action,
            data: decision.data,
          });

          // Track consecutive failures
          if (!result.success) {
            consecutiveFailures++;
            console.warn(`⚠️ Action failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${result.message}`);
            
            // After max failures, force end turn or skip to next phase
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              console.error(`❌ Max failures reached, forcing phase progression`);
              
              // Force phase progression or end turn
              if (gameState.phase === 'setup_settlement_1') {
                gameState.phase = 'setup_road_1';
              } else if (gameState.phase === 'setup_road_1') {
                gameState.phase = 'setup_settlement_2';
                gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
              } else if (gameState.phase === 'setup_settlement_2') {
                gameState.phase = 'setup_road_2';
              } else if (gameState.phase === 'setup_road_2') {
                gameState.phase = 'dice_roll';
                gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
              } else {
                // Main phase - end turn
                gameState.phase = 'dice_roll';
                gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
                gameState.turn++;
              }
              
              consecutiveFailures = 0;
              
              send({
                type: 'action_result',
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                success: false,
                message: '⏭️ Too many failures, skipping to next phase/player',
                gameState: serializeGameState(gameState),
              });
              
              continue; // Skip to next iteration
            }
          } else {
            consecutiveFailures = 0; // Reset on success
          }

          // Update game store after action
          updateGame(gameId, gameState);

          send({
            type: 'action_result',
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            success: result.success,
            message: result.message,
            gameState: serializeGameState(gameState),
          });

          // Check for victory
          const winner = gameState.players.find(p => p.victoryPoints >= 10);
          if (winner) {
            const winnerAgent = agentConfigs[gameState.players.indexOf(winner)];
            send({ 
              type: 'victory', 
              winner: {
                id: winner.id,
                name: winner.name,
                victoryPoints: winner.victoryPoints,
                agentName: winnerAgent?.name,
              },
              message: getVictoryMessage(winnerAgent!),
              gameState: serializeGameState(gameState),
            });
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Game ended without a winner reaching 10 VP
        const realWinner = gameState.players.find(p => p.victoryPoints >= 10);
        
        if (realWinner) {
          // Someone actually won with 10 VP
          const winnerAgent = agentConfigs[gameState.players.indexOf(realWinner)];
          send({ 
            type: 'victory', 
            winner: {
              id: realWinner.id,
              name: realWinner.name,
              victoryPoints: realWinner.victoryPoints,
              agentName: winnerAgent?.name,
            },
            message: getVictoryMessage(winnerAgent!),
            gameState: serializeGameState(gameState),
          });
        } else if (turnCount >= maxTurns) {
          // Max turns reached without winner - declare winner by VP only if they have reasonable points
          const leader = gameState.players.reduce((prev, current) => 
            current.victoryPoints > prev.victoryPoints ? current : prev
          );
          
          if (leader.victoryPoints >= 5) {
            // Only declare winner if they have at least 5 VP (reasonable progress)
            const winnerAgent = agentConfigs[gameState.players.indexOf(leader)];
            send({ 
              type: 'victory', 
              winner: {
                id: leader.id,
                name: leader.name,
                victoryPoints: leader.victoryPoints,
                agentName: winnerAgent?.name,
              },
              message: `Game ended after ${maxTurns} turns. ${leader.name} wins with ${leader.victoryPoints} VP!`,
              gameState: serializeGameState(gameState),
            });
          } else {
            // Game ended prematurely with no real progress
            send({
              type: 'error',
              message: `Game ended after ${turnCount} turns with insufficient progress. Leader has only ${leader.victoryPoints} VP. The game may have encountered errors during setup.`,
            });
          }
        } else {
          // Game ended due to errors before maxTurns
          send({
            type: 'error',
            message: `Game ended prematurely after ${turnCount} turns due to errors. No winner declared.`,
          });
        }

        controller.close();
      } catch (error) {
        console.error('Game error:', error);
        send({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function getGreeting(agent: any): string {
  const greetings: Record<string, string> = {
    conquistador: '¡Conquistaré esta isla! Ningún territorio estará fuera de mi alcance.',
    merchant: 'Que los mejores tratos nos traigan la victoria. Prosperidad para todos.',
    architect: 'Construiré un imperio que perdurará. La paciencia es clave.',
    gambler: '¡Que rueden los dados! La fortuna favorece a los audaces.',
  };
  
  return greetings[agent.id] || '¡Que comience el juego!';
}

function getVictoryMessage(agent: any): string {
  const victories: Record<string, string> = {
    conquistador: '¡VICTORIA! Mi imperio se extiende por toda la isla. ¡Nadie pudo detener mi expansión!',
    merchant: 'La estrategia y el comercio inteligente prevalecen. Una victoria bien merecida.',
    architect: 'Mi imperio construido con paciencia y visión ha triunfado. La planificación siempre gana.',
    gambler: '¡JA! ¿Vieron eso? ¡Los riesgos calculados dan sus frutos! ¡Victoria épica!',
  };
  
  return victories[agent.id] || '¡Victoria!';
}

