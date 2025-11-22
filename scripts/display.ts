// Terminal display utilities for Catan

import { GameState, Player, Resources, HexTile } from '../lib/types';

export function displayGameState(state: GameState): void {
  console.log('\n' + '='.repeat(80));
  console.log(`TURN ${state.turn} - Phase: ${state.phase.toUpperCase()}`);
  console.log('='.repeat(80));

  const currentPlayer = state.players[state.currentPlayerIndex];
  console.log(`\nCurrent Player: ${currentPlayer.name} (${currentPlayer.color})`);
  
  if (state.diceRoll) {
    console.log(`Last Dice Roll: ${state.diceRoll[0]} + ${state.diceRoll[1]} = ${state.diceRoll[0] + state.diceRoll[1]}`);
  }

  console.log('\n--- PLAYERS ---');
  state.players.forEach((player, index) => {
    const isCurrent = index === state.currentPlayerIndex;
    const marker = isCurrent ? '▶' : ' ';
    console.log(`${marker} ${player.name} (${player.color})`);
    console.log(`  VP: ${player.victoryPoints} | Resources: ${getTotalResources(player.resources)}`);
    console.log(`  ${formatResources(player.resources)}`);
    console.log(`  Roads: ${15 - player.roads}/15 | Settlements: ${5 - player.settlements}/5 | Cities: ${4 - player.cities}/4`);
  });

  console.log('\n--- BOARD INFO ---');
  console.log(`Total Hexes: ${state.board.hexes.length}`);
  console.log(`Total Vertices: ${state.board.vertices.length}`);
  console.log(`Total Edges: ${state.board.edges.length}`);
  
  // Show buildings on board
  const settlements = state.board.vertices.filter(v => v.building?.type === 'settlement');
  const cities = state.board.vertices.filter(v => v.building?.type === 'city');
  const roads = state.board.edges.filter(e => e.road);
  
  console.log(`Buildings: ${settlements.length} settlements, ${cities.length} cities, ${roads.length} roads`);
}

export function displayBoard(state: GameState): void {
  console.log('\n--- BOARD LAYOUT ---');
  
  // Group hexes by rows for display
  const hexesByRow = new Map<number, HexTile[]>();
  state.board.hexes.forEach(hex => {
    const row = hex.position.r;
    if (!hexesByRow.has(row)) {
      hexesByRow.set(row, []);
    }
    hexesByRow.get(row)!.push(hex);
  });

  const rows = Array.from(hexesByRow.keys()).sort((a, b) => a - b);
  
  rows.forEach(row => {
    const hexes = hexesByRow.get(row)!.sort((a, b) => a.position.q - b.position.q);
    const indent = ' '.repeat(Math.abs(row) * 2);
    const hexStrings = hexes.map(hex => {
      const terrainChar = getTerrainChar(hex.terrain);
      const number = hex.number ? hex.number.toString().padStart(2, ' ') : '--';
      return `[${terrainChar}:${number}]`;
    });
    console.log(indent + hexStrings.join(' '));
  });
}

function getTerrainChar(terrain: string): string {
  const map: Record<string, string> = {
    wood: 'W',
    brick: 'B',
    sheep: 'S',
    wheat: 'H',
    ore: 'O',
    desert: 'D',
  };
  return map[terrain] || '?';
}

export function displayPlayerResources(player: Player): void {
  console.log(`\n${player.name}'s Resources:`);
  console.log(formatResources(player.resources));
  console.log(`Total: ${getTotalResources(player.resources)}`);
}

export function formatResources(resources: Resources): string {
  return `🌲 Wood: ${resources.wood} | 🧱 Brick: ${resources.brick} | 🐑 Sheep: ${resources.sheep} | 🌾 Wheat: ${resources.wheat} | ⛏️  Ore: ${resources.ore}`;
}

function getTotalResources(resources: Resources): number {
  return Object.values(resources).reduce((sum, val) => sum + val, 0);
}

export function displayAvailableActions(state: GameState, player: Player): void {
  console.log('\n--- AVAILABLE ACTIONS ---');
  
  const actions: string[] = [];

  if (state.phase === 'dice_roll') {
    actions.push('1. Roll Dice');
  } else if (state.phase === 'setup_settlement_1' || state.phase === 'setup_settlement_2') {
    actions.push('1. Build Settlement');
  } else if (state.phase === 'setup_road_1' || state.phase === 'setup_road_2') {
    actions.push('1. Build Road');
  } else if (state.phase === 'main') {
    if (canAffordRoad(player)) {
      actions.push(`2. Build Road (1 wood, 1 brick) - ${player.roads} left`);
    }
    if (canAffordSettlement(player)) {
      actions.push(`3. Build Settlement (1 wood, 1 brick, 1 sheep, 1 wheat) - ${player.settlements} left`);
    }
    if (canAffordCity(player)) {
      actions.push(`4. Build City (2 wheat, 3 ore) - ${player.cities} left`);
    }
    if (getTotalResources(player.resources) >= 4) {
      actions.push('5. Trade with Bank (4:1 ratio)');
    }
    actions.push('9. End Turn');
  }

  if (actions.length === 0) {
    console.log('No actions available. Please end turn.');
  } else {
    actions.forEach(action => console.log(action));
  }
}

function canAffordRoad(player: Player): boolean {
  return player.resources.wood >= 1 && player.resources.brick >= 1 && player.roads > 0;
}

function canAffordSettlement(player: Player): boolean {
  return (
    player.resources.wood >= 1 &&
    player.resources.brick >= 1 &&
    player.resources.sheep >= 1 &&
    player.resources.wheat >= 1 &&
    player.settlements > 0
  );
}

function canAffordCity(player: Player): boolean {
  return player.resources.wheat >= 2 && player.resources.ore >= 3 && player.cities > 0;
}

export function displayWinner(state: GameState): void {
  const winner = state.players.find(p => p.victoryPoints >= 10);
  if (winner) {
    console.log('\n' + '🎉'.repeat(40));
    console.log(`GAME OVER! ${winner.name} (${winner.color}) WINS with ${winner.victoryPoints} Victory Points!`);
    console.log('🎉'.repeat(40) + '\n');
  }
}

export function displayVertices(state: GameState, limit: number = 10): void {
  console.log('\n--- AVAILABLE VERTICES (sample) ---');
  const availableVertices = state.board.vertices
    .filter(v => !v.building)
    .slice(0, limit);
  
  availableVertices.forEach(v => {
    console.log(`${v.id} - Adjacent to ${v.hexIds.length} hexes`);
  });
  
  if (state.board.vertices.filter(v => !v.building).length > limit) {
    console.log(`... and ${state.board.vertices.filter(v => !v.building).length - limit} more`);
  }
}

export function displayEdges(state: GameState, playerId: string, limit: number = 10): void {
  console.log('\n--- AVAILABLE EDGES (sample) ---');
  
  // Filter edges that are:
  // 1. Not occupied
  // 2. Connected to player's existing structures
  const availableEdges = state.board.edges
    .filter(e => !e.road)
    .slice(0, limit);
  
  availableEdges.forEach(e => {
    console.log(`${e.id} - Connects ${e.vertexIds[0]} to ${e.vertexIds[1]}`);
  });
  
  if (state.board.edges.filter(e => !e.road).length > limit) {
    console.log(`... and ${state.board.edges.filter(e => !e.road).length - limit} more`);
  }
}

