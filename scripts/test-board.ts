#!/usr/bin/env tsx
// Test script to verify board generation

import { generateBoard } from '../lib/board-generator';

console.log('Testing board generation...\n');

const board = generateBoard();

console.log('✅ Board Statistics:');
console.log(`  - Hexes: ${board.hexes.length}`);
console.log(`  - Vertices: ${board.vertices.length}`);
console.log(`  - Edges: ${board.edges.length}`);

if (board.edges.length === 0) {
  console.error('\n❌ ERROR: No edges generated!');
  console.log('\nSample vertices:');
  board.vertices.slice(0, 5).forEach(v => {
    console.log(`  ${v.id}: hexes = [${v.hexIds.join(', ')}]`);
  });
} else {
  console.log('\n✅ Sample edges:');
  board.edges.slice(0, 10).forEach(e => {
    console.log(`  ${e.id}: connects ${e.vertexIds[0]} <-> ${e.vertexIds[1]}`);
  });
}

console.log('\n✅ Board generation test complete!');

