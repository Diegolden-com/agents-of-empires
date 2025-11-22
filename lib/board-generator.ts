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
  let edgesAttempted = 0;
  let edgesRejected = 0;
  let edgesCreated = 0;
  let edgesDuplicate = 0;
  
  // For each hex, connect its 6 vertices in order (forming a hexagon)
  hexes.forEach((hex, hexIndex) => {
    const hexVertices = getHexVertices(hex.position);
    const vertexIds = hexVertices.map(pos => `v_${pos.q}_${pos.r}_${pos.s}`);
    const vertexCoords = hexVertices;
    
    // Connect each vertex to the next one (and last to first)
    for (let i = 0; i < vertexIds.length; i++) {
      const v1Id = vertexIds[i];
      const v2Id = vertexIds[(i + 1) % vertexIds.length];
      const v1Coords = vertexCoords[i];
      const v2Coords = vertexCoords[(i + 1) % vertexIds.length];
      
      edgesAttempted++;
      
      // CRITICAL: Verify vertices are actually adjacent
      // Adjacent vertices on a hex should have Chebyshev distance (max of |dq|, |dr|, |ds|) = 1
      const dq = Math.abs(v1Coords.q - v2Coords.q);
      const dr = Math.abs(v1Coords.r - v2Coords.r);
      const ds = Math.abs(v1Coords.s - v2Coords.s);
      const chebyshevDistance = Math.max(dq, dr, ds);
      
      if (chebyshevDistance !== 1) {
        console.error(`⚠️ Hex ${hexIndex} (${hex.id}): Rejecting edge ${i}→${(i+1)%6}`);
        console.error(`   ${v1Id} to ${v2Id}`);
        console.error(`   Chebyshev distance: ${chebyshevDistance} (must be 1)`);
        console.error(`   Delta: (${dq}, ${dr}, ${ds})`);
        edgesRejected++;
        continue;
      }
      
      // Create edge with sorted IDs to avoid duplicates
      const [first, second] = v1Id < v2Id ? [v1Id, v2Id] : [v2Id, v1Id];
      const edgeId = `e_${first}_${second}`;
      
      if (edgeMap.has(edgeId)) {
        edgesDuplicate++;
      } else {
        edgeMap.set(edgeId, {
          id: edgeId,
          vertexIds: [first, second],
        });
        edgesCreated++;
      }
    }
  });
  
  console.log(`   Edge generation stats:`);
  console.log(`     - Attempted: ${edgesAttempted}`);
  console.log(`     - Rejected (invalid distance): ${edgesRejected}`);
  console.log(`     - Created (unique): ${edgesCreated}`);
  console.log(`     - Duplicates (shared between hexes): ${edgesDuplicate}`);

  const edges = Array.from(edgeMap.values());
  
  console.log(`\n🎲 Board generated: ${hexes.length} hexes, ${vertices.length} vertices, ${edges.length} edges`);
  console.log(`   Expected edges: ${hexes.length * 6} (before deduplication)`);
  
  // VALIDATE: Each edge should connect vertices that are EXACTLY 1 Chebyshev distance apart
  let invalidEdgeCount = 0;
  edges.forEach(edge => {
    const [v1Id, v2Id] = edge.vertexIds;
    const v1Parts = v1Id.split('_');
    const v2Parts = v2Id.split('_');
    const v1Coords = { q: parseInt(v1Parts[1]), r: parseInt(v1Parts[2]), s: parseInt(v1Parts[3]) };
    const v2Coords = { q: parseInt(v2Parts[1]), r: parseInt(v2Parts[2]), s: parseInt(v2Parts[3]) };
    
    const dq = Math.abs(v1Coords.q - v2Coords.q);
    const dr = Math.abs(v1Coords.r - v2Coords.r);
    const ds = Math.abs(v1Coords.s - v2Coords.s);
    const chebyshevDistance = Math.max(dq, dr, ds);
    
    if (chebyshevDistance !== 1) {
      console.error(`⚠️ INVALID EDGE DETECTED: ${edge.id}`);
      console.error(`   Connects ${v1Id} and ${v2Id}`);
      console.error(`   Chebyshev Distance: ${chebyshevDistance} (should be exactly 1)`);
      console.error(`   Delta: (${dq}, ${dr}, ${ds})`);
      invalidEdgeCount++;
    }
  });
  
  if (invalidEdgeCount > 0) {
    console.error(`❌ Found ${invalidEdgeCount} invalid edges! Board generation has ERRORS.`);
  } else {
    console.log(`✅ All ${edges.length} edges are valid (Chebyshev distance = 1)`);
  }

  return { hexes, vertices, edges };
}

// Get the 6 vertex positions for a hex (in cubic coordinates)
// Returns vertices in clockwise order starting from top
function getHexVertices(hexPos: { q: number; r: number; s: number }) {
  // Vertices are at the corners of each hex
  // Using integer offsets to ensure proper matching
  const q = hexPos.q * 2;
  const r = hexPos.r * 2;
  const s = hexPos.s * 2;
  
  // CRITICAL: These offsets define the 6 corners in clockwise order
  // Each pair of consecutive vertices should have Manhattan distance = 2
  const vertices = [
    { q: q + 1, r: r - 1, s: s },      // 0: Top (NE)
    { q: q + 1, r: r, s: s - 1 },      // 1: Top-right (E)
    { q: q, r: r + 1, s: s - 1 },      // 2: Bottom-right (SE)
    { q: q - 1, r: r + 1, s: s },      // 3: Bottom (SW)
    { q: q - 1, r: r, s: s + 1 },      // 4: Bottom-left (W)
    { q: q, r: r - 1, s: s + 1 },      // 5: Top-left (NW)
  ];
  
  // VALIDATE: Check that consecutive vertices are exactly 1 Chebyshev unit apart
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const dq = Math.abs(v1.q - v2.q);
    const dr = Math.abs(v1.r - v2.r);
    const ds = Math.abs(v1.s - v2.s);
    const chebyshevDist = Math.max(dq, dr, ds);
    
    if (chebyshevDist !== 1) {
      console.error(`❌ INVALID HEX VERTEX ORDER at hex (${hexPos.q}, ${hexPos.r}, ${hexPos.s})`);
      console.error(`   Vertex ${i} to ${(i + 1) % 6}: Chebyshev distance = ${chebyshevDist} (should be 1)`);
      console.error(`   v1: (${v1.q}, ${v1.r}, ${v1.s}), v2: (${v2.q}, ${v2.r}, ${v2.s})`);
    }
  }
  
  return vertices;
}

