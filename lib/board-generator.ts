// Generates the classic Catan board layout

import { Board, HexTile, Vertex, Edge, TerrainType } from './types';

// Classic Catan board layout (19 hexes)
const CLASSIC_LAYOUT: Array<{ terrain: TerrainType; number: number | null }> = [
  // Center hex
  { terrain: 'desert', number: null },
  
  // Inner ring (6 hexes)
  { terrain: 'wheat', number: 2 },
  { terrain: 'wood', number: 3 },
  { terrain: 'brick', number: 3 },
  { terrain: 'sheep', number: 4 },
  { terrain: 'ore', number: 4 },
  { terrain: 'sheep', number: 5 },
  
  // Outer ring (12 hexes)
  { terrain: 'wood', number: 5 },
  { terrain: 'wheat', number: 6 },
  { terrain: 'brick', number: 6 },
  { terrain: 'sheep', number: 8 },
  { terrain: 'ore', number: 8 },
  { terrain: 'wheat', number: 9 },
  { terrain: 'wood', number: 9 },
  { terrain: 'sheep', number: 10 },
  { terrain: 'brick', number: 10 },
  { terrain: 'wheat', number: 11 },
  { terrain: 'wood', number: 11 },
  { terrain: 'ore', number: 12 },
];

// Cubic coordinates for hexagonal grid
// Reference: https://www.redblobgames.com/grids/hexagons/
const HEX_POSITIONS = [
  // Center
  { q: 0, r: 0, s: 0 },
  
  // Inner ring
  { q: 1, r: -1, s: 0 },
  { q: 1, r: 0, s: -1 },
  { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 },
  { q: -1, r: 0, s: 1 },
  { q: 0, r: -1, s: 1 },
  
  // Outer ring
  { q: 2, r: -2, s: 0 },
  { q: 2, r: -1, s: -1 },
  { q: 2, r: 0, s: -2 },
  { q: 1, r: 1, s: -2 },
  { q: 0, r: 2, s: -2 },
  { q: -1, r: 2, s: -1 },
  { q: -2, r: 2, s: 0 },
  { q: -2, r: 1, s: 1 },
  { q: -2, r: 0, s: 2 },
  { q: -1, r: -1, s: 2 },
  { q: 0, r: -2, s: 2 },
  { q: 1, r: -2, s: 1 },
];

export function generateBoard(): Board {
  // Shuffle terrain and numbers for randomization
  const shuffledLayout = [...CLASSIC_LAYOUT].sort(() => Math.random() - 0.5);
  
  // Create hex tiles
  const hexes: HexTile[] = HEX_POSITIONS.map((pos, index) => ({
    id: `hex_${pos.q}_${pos.r}_${pos.s}`,
    terrain: shuffledLayout[index].terrain,
    number: shuffledLayout[index].number,
    position: pos,
  }));

  // Generate vertices (each hex has 6 vertices)
  const vertexMap = new Map<string, Vertex>();
  
  hexes.forEach(hex => {
    const hexVertices = getHexVertices(hex.position);
    hexVertices.forEach(vertexPos => {
      const vertexId = `v_${vertexPos.q}_${vertexPos.r}_${vertexPos.s}`;
      if (!vertexMap.has(vertexId)) {
        vertexMap.set(vertexId, {
          id: vertexId,
          hexIds: [hex.id],
        });
      } else {
        const vertex = vertexMap.get(vertexId)!;
        if (!vertex.hexIds.includes(hex.id)) {
          vertex.hexIds.push(hex.id);
        }
      }
    });
  });

  const vertices = Array.from(vertexMap.values());

  // Generate edges (connecting adjacent vertices)
  const edgeMap = new Map<string, Edge>();
  
  // For each hex, connect its 6 vertices in order (forming a hexagon)
  hexes.forEach(hex => {
    const hexVertices = getHexVertices(hex.position);
    const vertexIds = hexVertices.map(pos => `v_${pos.q}_${pos.r}_${pos.s}`);
    const vertexCoords = hexVertices;
    
    // Connect each vertex to the next one (and last to first)
    for (let i = 0; i < vertexIds.length; i++) {
      const v1Id = vertexIds[i];
      const v2Id = vertexIds[(i + 1) % vertexIds.length];
      const v1Coords = vertexCoords[i];
      const v2Coords = vertexCoords[(i + 1) % vertexIds.length];
      
      // CRITICAL: Verify vertices are actually adjacent
      // In cubic coordinates, adjacent vertices on a hex have Manhattan distance = 2
      const dq = Math.abs(v1Coords.q - v2Coords.q);
      const dr = Math.abs(v1Coords.r - v2Coords.r);
      const ds = Math.abs(v1Coords.s - v2Coords.s);
      const manhattanDistance = (dq + dr + ds) / 2;
      
      if (manhattanDistance > 2) {
        console.error(`⚠️ Skipping invalid edge: vertices ${v1Id} and ${v2Id} are too far (manhattan distance=${manhattanDistance})`);
        console.error(`   v1: (${v1Coords.q}, ${v1Coords.r}, ${v1Coords.s}), v2: (${v2Coords.q}, ${v2Coords.r}, ${v2Coords.s})`);
        continue;
      }
      
      // Create edge with sorted IDs to avoid duplicates
      const [first, second] = v1Id < v2Id ? [v1Id, v2Id] : [v2Id, v1Id];
      const edgeId = `e_${first}_${second}`;
      
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          vertexIds: [first, second],
        });
      }
    }
  });

  const edges = Array.from(edgeMap.values());
  
  console.log(`Board generated: ${hexes.length} hexes, ${vertices.length} vertices, ${edges.length} edges`);

  return { hexes, vertices, edges };
}

// Get the 6 vertex positions for a hex (in cubic coordinates)
function getHexVertices(hexPos: { q: number; r: number; s: number }) {
  // Vertices are at the corners of each hex
  // Using integer offsets to ensure proper matching
  const q = hexPos.q * 2;
  const r = hexPos.r * 2;
  const s = hexPos.s * 2;
  
  return [
    { q: q + 1, r: r - 1, s: s },
    { q: q + 1, r: r, s: s - 1 },
    { q: q, r: r + 1, s: s - 1 },
    { q: q - 1, r: r + 1, s: s },
    { q: q - 1, r: r, s: s + 1 },
    { q: q, r: r - 1, s: s + 1 },
  ];
}

