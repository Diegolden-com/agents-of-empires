// Interface for AI agents to interact with the game

import { GameState, Player, ResourceType } from './types';
import {
  buildRoad,
  buildSettlement,
  buildCity,
  tradeWithBank,
  rollDice,
  distributeResources,
  endTurn,
  getCurrentPlayer,
} from './game-engine';
import { getVertexIdFromOption, getEdgeIdFromOption } from './option-mapper';

export interface AgentAction {
  type: 'roll' | 'build_road' | 'build_settlement' | 'build_city' | 'trade_bank' | 'end_turn';
  data?: any;
}

export interface AgentDecision {
  action: AgentAction;
  reasoning?: string;
}

// This is the main interface that external LLM agents will use
export function getGameStateForAgent(state: GameState, playerId: string): any {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  return {
    gameInfo: {
      turn: state.turn,
      phase: state.phase,
      currentPlayer: state.players[state.currentPlayerIndex].name,
      isYourTurn: state.players[state.currentPlayerIndex].id === playerId,
      diceRoll: state.diceRoll,
    },
    yourInfo: {
      name: player.name,
      color: player.color,
      victoryPoints: player.victoryPoints,
      resources: player.resources,
      remainingPieces: {
        roads: player.roads,
        settlements: player.settlements,
        cities: player.cities,
      },
    },
    opponents: state.players
      .filter(p => p.id !== playerId)
      .map(p => ({
        name: p.name,
        color: p.color,
        victoryPoints: p.victoryPoints,
        resourceCount: Object.values(p.resources).reduce((sum, val) => sum + val, 0),
        visibleBuildings: {
          roads: 15 - p.roads,
          settlements: 5 - p.settlements,
          cities: 4 - p.cities,
        },
      })),
    boardState: {
      hexes: state.board.hexes.map(h => ({
        id: h.id,
        terrain: h.terrain,
        number: h.number,
        position: h.position,
      })),
      yourBuildings: {
        settlements: state.board.vertices
          .filter(v => v.building?.playerId === playerId && v.building.type === 'settlement')
          .map(v => ({ vertexId: v.id, hexes: v.hexIds })),
        cities: state.board.vertices
          .filter(v => v.building?.playerId === playerId && v.building.type === 'city')
          .map(v => ({ vertexId: v.id, hexes: v.hexIds })),
        roads: state.board.edges
          .filter(e => e.road?.playerId === playerId)
          .map(e => ({ edgeId: e.id, vertices: e.vertexIds })),
      },
      opponentBuildings: state.players
        .filter(p => p.id !== playerId)
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          settlements: state.board.vertices
            .filter(v => v.building?.playerId === p.id && v.building.type === 'settlement')
            .map(v => v.id),
          cities: state.board.vertices
            .filter(v => v.building?.playerId === p.id && v.building.type === 'city')
            .map(v => v.id),
          roads: state.board.edges
            .filter(e => e.road?.playerId === p.id)
            .map(e => e.id),
        })),
      availableVertices: (() => {
        const allVertices = state.board.vertices;
        const totalBuildings = allVertices.filter(v => v.building).length;
        console.log(`\n🏠 Filtering available vertices. Current buildings on board: ${totalBuildings}`);
        
        const filtered = allVertices.filter(v => {
          // Cannot build on occupied vertex
          if (v.building) return false;
          
          // CRITICAL: Check distance rule - no settlements within 1 edge distance
          const adjacentVertexIds = state.board.edges
            .filter(e => e.vertexIds.includes(v.id))
            .flatMap(e => e.vertexIds)
            .filter(id => id !== v.id);
          
          // Verify no adjacent vertex has a building
          const hasAdjacentBuilding = adjacentVertexIds.some(id => {
            const adjacentVertex = state.board.vertices.find(vertex => vertex.id === id);
            return adjacentVertex?.building !== undefined;
          });
          
          return !hasAdjacentBuilding;
        });
        
        console.log(`   Total vertices: ${allVertices.length}`);
        console.log(`   Occupied: ${totalBuildings}`);
        console.log(`   Available (after distance check): ${filtered.length}`);
        
        return filtered.map(v => ({ id: v.id, hexes: v.hexIds }));
      })(),
      availableEdges: (() => {
        // Filter edges that don't have roads
        let edges = state.board.edges.filter(e => !e.road);
        
        // In setup road phases, only show edges connected to player's LAST settlement
        if (state.phase === 'setup_road_1' || state.phase === 'setup_road_2') {
          const playerSettlements = state.board.vertices.filter(v => 
            v.building && v.building.playerId === playerId && v.building.type === 'settlement'
          );
          
          if (playerSettlements.length > 0) {
            const lastSettlement = playerSettlements[playerSettlements.length - 1];
            // CRITICAL: In setup, only edges connected to LAST settlement are valid
            edges = edges.filter(e => e.vertexIds.includes(lastSettlement.id));
          }
        } else if (!state.phase.startsWith('setup') && state.phase !== 'dice_roll') {
          // In main game, show edges connected to player's network
          edges = edges.filter(e => {
            const [v1Id, v2Id] = e.vertexIds;
            const v1 = state.board.vertices.find(v => v.id === v1Id);
            const v2 = state.board.vertices.find(v => v.id === v2Id);
            
            // Connected to player's building?
            if (v1?.building?.playerId === playerId || v2?.building?.playerId === playerId) {
              return true;
            }
            
            // Connected to player's road?
            const adjacentEdges = state.board.edges.filter(adj => 
              adj.id !== e.id && 
              (adj.vertexIds.includes(v1Id) || adj.vertexIds.includes(v2Id))
            );
            return adjacentEdges.some(adj => adj.road?.playerId === playerId);
          });
        }
        
        // CRITICAL: Final validation - only return edges with adjacent vertices
        const validEdges = edges.filter(e => {
          const [v1Id, v2Id] = e.vertexIds;
          const v1Parts = v1Id.split('_');
          const v2Parts = v2Id.split('_');
          const v1Coords = { q: parseInt(v1Parts[1]), r: parseInt(v1Parts[2]), s: parseInt(v1Parts[3]) };
          const v2Coords = { q: parseInt(v2Parts[1]), r: parseInt(v2Parts[2]), s: parseInt(v2Parts[3]) };
          
          const chebyshevDist = Math.max(
            Math.abs(v1Coords.q - v2Coords.q),
            Math.abs(v1Coords.r - v2Coords.r),
            Math.abs(v1Coords.s - v2Coords.s)
          );
          
          if (chebyshevDist !== 1) {
            console.error(`⚠️ Agent Interface: Filtering invalid edge ${e.id} (Chebyshev dist=${chebyshevDist})`);
            return false;
          }
          return true;
        });
        
        if (validEdges.length < edges.length) {
          console.error(`⚠️ Agent Interface filtered out ${edges.length - validEdges.length} invalid edges`);
        }
        
        return validEdges.map(e => ({ id: e.id, vertices: e.vertexIds }));
      })(),
    },
    possibleActions: getPossibleActions(state, playerId),
  };
}

export function getPossibleActions(state: GameState, playerId: string): string[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const actions: string[] = [];

  if (state.players[state.currentPlayerIndex].id !== playerId) {
    return ['wait']; // Not your turn
  }

  if (state.phase === 'dice_roll') {
    actions.push('roll');
  } else if (state.phase === 'setup_settlement_1' || state.phase === 'setup_settlement_2') {
    actions.push('build_settlement');
  } else if (state.phase === 'setup_road_1' || state.phase === 'setup_road_2') {
    actions.push('build_road');
  } else if (state.phase === 'main') {
    if (player.resources.wood >= 1 && player.resources.brick >= 1 && player.roads > 0) {
      actions.push('build_road');
    }
    if (
      player.resources.wood >= 1 &&
      player.resources.brick >= 1 &&
      player.resources.sheep >= 1 &&
      player.resources.wheat >= 1 &&
      player.settlements > 0
    ) {
      actions.push('build_settlement');
    }
    if (player.resources.wheat >= 2 && player.resources.ore >= 3 && player.cities > 0) {
      actions.push('build_city');
    }
    const totalResources = Object.values(player.resources).reduce((sum, val) => sum + val, 0);
    if (totalResources >= 4) {
      actions.push('trade_bank');
    }
    actions.push('end_turn');
  }

  return actions;
}

export function executeAgentAction(state: GameState, playerId: string, action: AgentAction): {
  success: boolean;
  message: string;
  newState?: GameState;
} {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  if (state.players[state.currentPlayerIndex].id !== playerId) {
    return { success: false, message: 'Not your turn' };
  }

  // Get available positions for validation
  const gameStateForAgent = getGameStateForAgent(state, playerId);
  const availableVertexIds = gameStateForAgent.boardState.availableVertices.map((v: any) => v.id);
  const availableEdgeIds = gameStateForAgent.boardState.availableEdges.map((e: any) => e.id);

  try {
    switch (action.type) {
      case 'roll':
        if (state.phase !== 'dice_roll') {
          return { success: false, message: 'Cannot roll dice in this phase' };
        }
        const dice = rollDice();
        state.diceRoll = dice;
        const total = dice[0] + dice[1];
        distributeResources(state, total);
        state.phase = 'main';
        return { success: true, message: `Rolled ${dice[0]} + ${dice[1]} = ${total}`, newState: state };

      case 'build_road':
        // NEW: Support numeric option (1-5) or old edgeId format
        let edgeId: string | null = null;
        
        console.log(`\n🛣️  BUILD_ROAD requested by ${player.name}`);
        console.log(`   Action data:`, action.data);
        console.log(`   Phase: ${state.phase}`);
        console.log(`   Available edges count: ${availableEdgeIds.length}`);
        
        if (typeof action.data === 'number') {
          // New format: just a number
          edgeId = getEdgeIdFromOption(playerId, action.data);
          console.log(`   ✅ Option ${action.data} → edge ${edgeId}`);
        } else if (action.data?.option) {
          // New format: { option: number }
          edgeId = getEdgeIdFromOption(playerId, action.data.option);
          console.log(`   ✅ Option ${action.data.option} → edge ${edgeId}`);
        } else if (action.data?.edgeId) {
          // Old format: { edgeId: string } - validate it's in available list
          console.log(`   Validating direct edgeId: ${action.data.edgeId}`);
          
          if (!availableEdgeIds.includes(action.data.edgeId)) {
            console.error(`❌ INVALID EDGE: Agent tried to use edge "${action.data.edgeId}" which is NOT in available list`);
            console.error(`   Available edges:`, availableEdgeIds.slice(0, 10));
            
            // Check why it's not available
            const targetEdge = state.board.edges.find(e => e.id === action.data.edgeId);
            if (!targetEdge) {
              console.error(`   Edge doesn't exist on board!`);
            } else if (targetEdge.road) {
              console.error(`   Edge already has road owned by ${targetEdge.road.playerId}`);
            } else {
              console.error(`   Edge is not connected to player's network`);
            }
            
            return { 
              success: false, 
              message: `Invalid edge ID. The edge "${action.data.edgeId}" is either occupied or not connected to your network.` 
            };
          }
          edgeId = action.data.edgeId;
          console.log(`   ✅ Direct edgeId validated: ${edgeId}`);
        } else {
          console.error(`   ❌ No valid edge data provided`);
          return { success: false, message: 'Edge option or ID required' };
        }

        if (!edgeId) {
          console.error(`   ❌ edgeId is null after processing`);
          return { success: false, message: 'Invalid edge option' };
        }

        console.log(`   🎯 Attempting to build road at ${edgeId}`);
        const roadSuccess = buildRoad(state, playerId, { edgeId });
        if (!roadSuccess) {
          console.error(`   ❌ buildRoad() returned false`);
          return { success: false, message: 'Cannot build road at this location' };
        }
        console.log(`   ✅ Road built successfully`);
        // After road in setup, advance to next player/phase
        if (state.phase === 'setup_road_1') {
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
          // If back to first player, move to second setup round (starts with LAST player)
          if (state.currentPlayerIndex === 0) {
            state.phase = 'setup_settlement_2';
            state.currentPlayerIndex = state.players.length - 1; // Start with last player
          } else {
            state.phase = 'setup_settlement_1';
          }
        } else if (state.phase === 'setup_road_2') {
          // Second round goes in REVERSE order
          state.currentPlayerIndex = (state.currentPlayerIndex - 1 + state.players.length) % state.players.length;
          
          // If we looped back to last player, it means player 0 (first) just finished
          if (state.currentPlayerIndex === state.players.length - 1) {
            // Setup complete, start main game with first player
            state.phase = 'dice_roll';
            state.currentPlayerIndex = 0;
          } else {
            state.phase = 'setup_settlement_2';
          }
        }
        return { success: true, message: 'Road built successfully', newState: state };

      case 'build_settlement':
        // NEW: Support numeric option (1-5) or old vertexId format
        let vertexId: string | null = null;
        
        console.log(`\n🏗️  BUILD_SETTLEMENT requested by ${player.name}`);
        console.log(`   Action data:`, action.data);
        console.log(`   Phase: ${state.phase}`);
        console.log(`   Available vertices count: ${availableVertexIds.length}`);
        
        if (typeof action.data === 'number') {
          // New format: just a number
          vertexId = getVertexIdFromOption(playerId, action.data);
          console.log(`   ✅ Option ${action.data} → vertex ${vertexId}`);
        } else if (action.data?.option) {
          // New format: { option: number }
          vertexId = getVertexIdFromOption(playerId, action.data.option);
          console.log(`   ✅ Option ${action.data.option} → vertex ${vertexId}`);
        } else if (action.data?.vertexId) {
          // Old format: { vertexId: string } - validate it's in available list
          console.log(`   Validating direct vertexId: ${action.data.vertexId}`);
          console.log(`   Available vertex IDs:`, availableVertexIds.slice(0, 10));
          
          if (!availableVertexIds.includes(action.data.vertexId)) {
            console.error(`❌ INVALID VERTEX: Agent tried to use vertex "${action.data.vertexId}" which is NOT in available list`);
            console.error(`   Available vertices:`, availableVertexIds);
            
            // Check why it's not available
            const targetVertex = state.board.vertices.find(v => v.id === action.data.vertexId);
            if (!targetVertex) {
              console.error(`   Vertex doesn't exist on board!`);
            } else if (targetVertex.building) {
              console.error(`   Vertex is occupied by ${targetVertex.building.playerId}`);
            } else {
              console.error(`   Vertex violates distance rule (too close to another settlement)`);
            }
            
            return { 
              success: false, 
              message: `Invalid vertex ID. The vertex "${action.data.vertexId}" is either occupied or too close to another settlement (violates distance rule).` 
            };
          }
          vertexId = action.data.vertexId;
          console.log(`   ✅ Direct vertexId validated: ${vertexId}`);
        } else {
          console.error(`   ❌ No valid vertex data provided`);
          return { success: false, message: 'Vertex option or ID required' };
        }

        if (!vertexId) {
          console.error(`   ❌ vertexId is null after processing`);
          return { success: false, message: 'Invalid vertex option' };
        }

        console.log(`   🎯 Attempting to build settlement at ${vertexId}`);
        const settlementSuccess = buildSettlement(state, playerId, { vertexId });
        if (!settlementSuccess) {
          console.error(`   ❌ buildSettlement() returned false`);
          return { success: false, message: 'Cannot build settlement at this location' };
        }
        console.log(`   ✅ Settlement built successfully`);
        
        // Auto-advance phase (but keep same player for road)
        if (state.phase === 'setup_settlement_1') {
          state.phase = 'setup_road_1';
        } else if (state.phase === 'setup_settlement_2') {
          state.phase = 'setup_road_2';
        }
        return { success: true, message: 'Settlement built successfully', newState: state };

      case 'build_city':
        if (!action.data?.vertexId) {
          return { success: false, message: 'Vertex ID required' };
        }
        const citySuccess = buildCity(state, playerId, { vertexId: action.data.vertexId });
        if (!citySuccess) {
          return { success: false, message: 'Cannot build city at this location' };
        }
        return { success: true, message: 'City built successfully', newState: state };

      case 'trade_bank':
        if (!action.data?.give || !action.data?.receive) {
          return { success: false, message: 'Trade data required (give and receive)' };
        }
        const tradeSuccess = tradeWithBank(player, {
          give: action.data.give,
          receive: action.data.receive,
        });
        if (!tradeSuccess) {
          return { success: false, message: 'Cannot complete trade' };
        }
        return { success: true, message: 'Trade completed', newState: state };

      case 'end_turn':
        if (state.phase !== 'main') {
          return { success: false, message: 'Cannot end turn in this phase' };
        }
        endTurn(state);
        return { success: true, message: 'Turn ended', newState: state };

      default:
        return { success: false, message: 'Unknown action type' };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
}

// Helper to format game state as JSON for external agents
export function exportGameStateJSON(state: GameState, playerId: string): string {
  return JSON.stringify(getGameStateForAgent(state, playerId), null, 2);
}

