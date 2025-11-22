// Core game engine for Catan

import { 
  GameState, 
  Player, 
  Resources, 
  GameAction,
  BuildRoadAction,
  BuildSettlementAction,
  BuildCityAction,
  TradeWithBankAction,
  ResourceType
} from './types';
import { generateBoard } from './board-generator';

const COLORS = ['red', 'blue', 'white', 'orange'];

export function createGame(playerNames: string[]): GameState {
  if (playerNames.length < 2 || playerNames.length > 4) {
    throw new Error('Catan requires 2-4 players');
  }

  const players: Player[] = playerNames.map((name, index) => ({
    id: `player_${index}`,
    name,
    color: COLORS[index],
    resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    developmentCards: [],
    roads: 15,
    settlements: 5,
    cities: 4,
    victoryPoints: 0,
    longestRoad: false,
    largestArmy: false,
    knightsPlayed: 0,
  }));

  return {
    board: generateBoard(),
    players,
    currentPlayerIndex: 0,
    phase: 'setup_settlement_1',
    diceRoll: null,
    turn: 1,
    longestRoadPlayerId: null,
    largestArmyPlayerId: null,
  };
}

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function distributeResources(state: GameState, diceTotal: number): void {
  if (diceTotal === 7) {
    // Robber logic - players with >7 cards must discard half
    // TODO: Implement robber
    return;
  }

  // Find all hexes with the rolled number
  const matchingHexes = state.board.hexes.filter(hex => hex.number === diceTotal);

  matchingHexes.forEach(hex => {
    // Find all vertices on this hex with buildings
    const hexVertices = state.board.vertices.filter(v => 
      v.hexIds.includes(hex.id) && v.building
    );

    hexVertices.forEach(vertex => {
      const building = vertex.building!;
      const player = state.players.find(p => p.id === building.playerId);
      if (!player) return;

      // Skip desert hexes (they don't produce resources)
      if (hex.terrain === 'desert') return;

      const resourceType = hex.terrain as ResourceType;
      
      // Settlement = 1 resource, City = 2 resources
      const amount = building.type === 'settlement' ? 1 : 2;
      player.resources[resourceType] += amount;
    });
  });
}

export function canBuildRoad(player: Player): boolean {
  return player.resources.wood >= 1 && player.resources.brick >= 1 && player.roads > 0;
}

export function canBuildSettlement(player: Player): boolean {
  return (
    player.resources.wood >= 1 &&
    player.resources.brick >= 1 &&
    player.resources.sheep >= 1 &&
    player.resources.wheat >= 1 &&
    player.settlements > 0
  );
}

export function canBuildCity(player: Player): boolean {
  return (
    player.resources.wheat >= 2 &&
    player.resources.ore >= 3 &&
    player.cities > 0
  );
}

export function buildRoad(state: GameState, playerId: string, action: BuildRoadAction): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    console.error('❌ Road build failed: Player not found');
    return false;
  }

  const edge = state.board.edges.find(e => e.id === action.edgeId);
  if (!edge) {
    console.error('❌ Road build failed: Edge not found');
    return false;
  }

  // CRITICAL: Cannot build on edge that already has a road
  if (edge.road) {
    console.error(`❌ Road build failed: Edge ${edge.id} already has a road owned by ${edge.road.playerId}`);
    return false;
  }

  // CRITICAL: Validate that the two vertices are actually adjacent
  const [v1Id, v2Id] = edge.vertexIds;
  const v1 = state.board.vertices.find(v => v.id === v1Id);
  const v2 = state.board.vertices.find(v => v.id === v2Id);
  
  if (!v1 || !v2) {
    console.error(`❌ Road build failed: One or both vertices not found (${v1Id}, ${v2Id})`);
    return false;
  }

  // Parse cubic coordinates from vertex IDs
  const v1Parts = v1Id.split('_');
  const v2Parts = v2Id.split('_');
  const v1Coords = { q: parseInt(v1Parts[1]), r: parseInt(v1Parts[2]), s: parseInt(v1Parts[3]) };
  const v2Coords = { q: parseInt(v2Parts[1]), r: parseInt(v2Parts[2]), s: parseInt(v2Parts[3]) };

  // Calculate cubic distance - adjacent vertices should have Manhattan distance <= 2
  const dq = Math.abs(v1Coords.q - v2Coords.q);
  const dr = Math.abs(v1Coords.r - v2Coords.r);
  const ds = Math.abs(v1Coords.s - v2Coords.s);
  const manhattanDistance = (dq + dr + ds) / 2;

  if (manhattanDistance > 2) {
    console.error(`❌ Road build failed: Vertices are not adjacent! Manhattan distance=${manhattanDistance} (max allowed=2)`);
    console.error(`   ${v1Id} coords: (${v1Coords.q}, ${v1Coords.r}, ${v1Coords.s})`);
    console.error(`   ${v2Id} coords: (${v2Coords.q}, ${v2Coords.r}, ${v2Coords.s})`);
    console.error(`   Delta: (${dq}, ${dr}, ${ds})`);
    return false;
  }

  // In setup phases, road MUST connect to player's LAST settlement
  if (state.phase === 'setup_road_1' || state.phase === 'setup_road_2') {
    const playerSettlements = state.board.vertices.filter(v => 
      v.building && v.building.playerId === playerId
    );
    
    if (playerSettlements.length === 0) {
      console.error('❌ Road build failed: No settlements to connect to in setup');
      return false;
    }
    
    // Get the last settlement built (most recent)
    const lastSettlement = playerSettlements[playerSettlements.length - 1];
    
    // Check if this edge connects to the last settlement
    const connectsToLastSettlement = edge.vertexIds.includes(lastSettlement.id);
    
    if (!connectsToLastSettlement) {
      console.error(`❌ Road build failed: In setup, road must connect to your last settlement (${lastSettlement.id})`);
      return false;
    }
  } else if (!state.phase.startsWith('setup')) {
    // In main game, road must connect to player's existing roads or settlements
    const isConnected = isEdgeConnectedToPlayer(state, edge.id, playerId);
    if (!isConnected) {
      console.error('❌ Road build failed: Road must connect to your existing roads or settlements');
      return false;
    }
    
    // Check resources
    if (!canBuildRoad(player)) {
      console.error('❌ Road build failed: Not enough resources (need 1 wood + 1 brick)');
      return false;
    }
    player.resources.wood -= 1;
    player.resources.brick -= 1;
  }

  edge.road = { playerId };
  player.roads -= 1;
  
  console.log(`✅ Road built by ${player.name} on edge ${edge.id}`);
  return true;
}

export function buildSettlement(state: GameState, playerId: string, action: BuildSettlementAction): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    console.error('❌ Settlement build failed: Player not found');
    return false;
  }

  console.log(`\n🏗️  Attempting to build settlement for ${player.name} at vertex ${action.vertexId}`);
  console.log(`   Phase: ${state.phase}, Buildings on board: ${state.board.vertices.filter(v => v.building).length}`);

  const vertex = state.board.vertices.find(v => v.id === action.vertexId);
  if (!vertex) {
    console.error('❌ Settlement build failed: Vertex not found');
    return false;
  }

  // Cannot build on vertex that already has a building
  if (vertex.building) {
    console.error(`❌ Settlement build failed: Vertex ${vertex.id} already has a ${vertex.building.type} owned by ${vertex.building.playerId}`);
    return false;
  }

  // CRITICAL: Check distance rule - no settlements within 1 edge distance
  if (!isVertexDistanceValid(state, vertex.id)) {
    console.error('❌ Settlement build failed: TOO CLOSE to another settlement (distance rule violated)');
    console.error(`   Attempted vertex: ${vertex.id}`);
    
    // Show which settlements are too close
    const adjacentVertexIds = state.board.edges
      .filter(e => e.vertexIds.includes(vertex.id))
      .flatMap(e => e.vertexIds)
      .filter(id => id !== vertex.id);
    
    const tooCloseBuildings = adjacentVertexIds
      .map(id => state.board.vertices.find(v => v.id === id))
      .filter(v => v?.building);
    
    tooCloseBuildings.forEach(v => {
      console.error(`   ⚠️ Adjacent building found at ${v!.id} owned by ${v!.building!.playerId}`);
    });
    
    return false;
  }

  // During normal gameplay (not setup), check resources and connection
  if (!state.phase.startsWith('setup')) {
    if (!canBuildSettlement(player)) {
      console.error('❌ Settlement build failed: Not enough resources');
      return false;
    }
    
    // Must be connected to a road
    if (!isVertexConnectedToPlayerRoad(state, vertex.id, playerId)) {
      console.error('❌ Settlement build failed: Must be connected to your road');
      return false;
    }

    player.resources.wood -= 1;
    player.resources.brick -= 1;
    player.resources.sheep -= 1;
    player.resources.wheat -= 1;
  }

  vertex.building = { playerId, type: 'settlement' };
  player.settlements -= 1;
  player.victoryPoints += 1;
  
  console.log(`✅ Settlement built by ${player.name} on vertex ${vertex.id}`);
  return true;
}

export function buildCity(state: GameState, playerId: string, action: BuildCityAction): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  const vertex = state.board.vertices.find(v => v.id === action.vertexId);
  if (!vertex || !vertex.building) return false;
  if (vertex.building.type !== 'settlement' || vertex.building.playerId !== playerId) {
    return false;
  }

  if (!canBuildCity(player)) return false;

  player.resources.wheat -= 2;
  player.resources.ore -= 3;

  vertex.building.type = 'city';
  player.settlements += 1; // Get settlement back
  player.cities -= 1;
  player.victoryPoints += 1; // Cities give 2 VP total (already had 1 from settlement)

  return true;
}

export function tradeWithBank(player: Player, action: TradeWithBankAction): boolean {
  const giveResources = action.give;
  const receiveResource = action.receive;

  // Standard 4:1 trade (TODO: implement 3:1 ports and 2:1 specific ports)
  const totalGiven = Object.values(giveResources).reduce((sum, val) => sum + (val || 0), 0);
  
  if (totalGiven !== 4) return false;

  // Check if player has the resources
  for (const [resource, amount] of Object.entries(giveResources)) {
    if (player.resources[resource as ResourceType] < (amount || 0)) {
      return false;
    }
  }

  // Execute trade
  for (const [resource, amount] of Object.entries(giveResources)) {
    player.resources[resource as ResourceType] -= (amount || 0);
  }
  player.resources[receiveResource] += 1;

  return true;
}

export function endTurn(state: GameState): void {
  // Move to next player
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.diceRoll = null;

  // Handle setup phases
  if (state.phase === 'setup_settlement_1') {
    state.phase = 'setup_road_1';
  } else if (state.phase === 'setup_road_1') {
    // Check if all players have placed first settlement + road
    if (state.currentPlayerIndex === 0) {
      state.phase = 'setup_settlement_2';
    } else {
      state.phase = 'setup_settlement_1';
    }
  } else if (state.phase === 'setup_settlement_2') {
    state.phase = 'setup_road_2';
  } else if (state.phase === 'setup_road_2') {
    // In second round, go in reverse order
    if (state.currentPlayerIndex === state.players.length - 1) {
      // Last player finishes second round, start main game
      state.phase = 'dice_roll';
      state.currentPlayerIndex = 0;
    } else {
      state.phase = 'setup_settlement_2';
    }
  } else if (state.phase === 'main') {
    state.phase = 'dice_roll';
  }

  // Check for victory
  const winner = state.players.find(p => p.victoryPoints >= 10);
  if (winner) {
    state.phase = 'game_over';
  }
}

// Helper functions
function isEdgeConnectedToPlayer(state: GameState, edgeId: string, playerId: string): boolean {
  const edge = state.board.edges.find(e => e.id === edgeId);
  if (!edge) return false;

  // Check if either vertex has player's building
  const [v1Id, v2Id] = edge.vertexIds;
  const v1 = state.board.vertices.find(v => v.id === v1Id);
  const v2 = state.board.vertices.find(v => v.id === v2Id);

  if (v1?.building?.playerId === playerId || v2?.building?.playerId === playerId) {
    return true;
  }

  // Check if any adjacent edge has player's road
  const adjacentEdges = state.board.edges.filter(e => 
    e.id !== edgeId && 
    (e.vertexIds.includes(v1Id) || e.vertexIds.includes(v2Id))
  );

  return adjacentEdges.some(e => e.road?.playerId === playerId);
}

function isVertexConnectedToPlayerRoad(state: GameState, vertexId: string, playerId: string): boolean {
  // Find all edges connected to this vertex
  const connectedEdges = state.board.edges.filter(e => 
    e.vertexIds.includes(vertexId)
  );

  return connectedEdges.some(e => e.road?.playerId === playerId);
}

function isVertexDistanceValid(state: GameState, vertexId: string): boolean {
  const vertex = state.board.vertices.find(v => v.id === vertexId);
  if (!vertex) {
    console.log(`⚠️  Distance check: vertex ${vertexId} not found`);
    return false;
  }

  // Find all adjacent vertices (connected by an edge)
  const adjacentVertexIds = state.board.edges
    .filter(e => e.vertexIds.includes(vertexId))
    .flatMap(e => e.vertexIds)
    .filter(id => id !== vertexId);

  console.log(`🔍 Distance check for vertex ${vertexId}:`);
  console.log(`   Adjacent vertices (${adjacentVertexIds.length}):`, adjacentVertexIds.slice(0, 3));

  // Check if any adjacent vertex has a building
  const violatesRule = adjacentVertexIds.some(id => {
    const adjacentVertex = state.board.vertices.find(v => v.id === id);
    const hasBuilding = adjacentVertex?.building !== undefined;
    if (hasBuilding) {
      console.log(`   ❌ Adjacent vertex ${id} has ${adjacentVertex.building?.type} owned by ${adjacentVertex.building?.playerId}`);
    }
    return hasBuilding;
  });

  const result = !violatesRule;
  console.log(`   Result: ${result ? '✅ VALID' : '❌ VIOLATES DISTANCE RULE'}`);
  return result;
}

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

export function getTotalResources(resources: Resources): number {
  return Object.values(resources).reduce((sum, val) => sum + val, 0);
}

