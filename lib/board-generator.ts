// Generates the classic Catan board layout with SIMPLE NUMERIC IDs

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

export interface BlockchainBoardConfig {
  hexes: Array<{
    index: number;
    resource: number; // 0: WOOD, 1: SHEEP, 2: WHEAT, 3: BRICK, 4: ORE, 5: DESERT
  }>;
}

// Mapeo de recursos del blockchain a terrenos del juego
const RESOURCE_TO_TERRAIN: Record<number, TerrainType> = {
  0: 'wood',
  1: 'sheep',
  2: 'wheat',
  3: 'brick',
  4: 'ore',
  5: 'desert',
};

export function generateBoard(blockchainConfig?: BlockchainBoardConfig): Board {
  let hexes: HexTile[];
  
  if (blockchainConfig) {
    // Usar configuración del blockchain
    console.log('🔗 Generando tablero desde configuración del blockchain');
    
    hexes = HEX_POSITIONS.map((pos, index) => {
      const blockchainHex = blockchainConfig.hexes.find(h => h.index === index);
      if (!blockchainHex) {
        throw new Error(`Missing blockchain hex at index ${index}`);
      }
      
      const terrain = RESOURCE_TO_TERRAIN[blockchainHex.resource];
      if (!terrain) {
        throw new Error(`Invalid resource type: ${blockchainHex.resource}`);
      }
      
      // Asignar números según las reglas de Catan
      // Para simplificar, usamos el layout clásico pero con los terrenos del blockchain
      const number = terrain === 'desert' ? null : CLASSIC_LAYOUT[index].number;
      
      return {
        id: `hex_${pos.q}_${pos.r}_${pos.s}`,
        terrain,
        number,
        position: pos,
        blockchainIndex: blockchainHex.index,
      };
    });
  } else {
    // Generación aleatoria tradicional
    const shuffledLayout = [...CLASSIC_LAYOUT].sort(() => Math.random() - 0.5);
    
    hexes = HEX_POSITIONS.map((pos, index) => ({
      id: `hex_${pos.q}_${pos.r}_${pos.s}`,
      terrain: shuffledLayout[index].terrain,
      number: shuffledLayout[index].number,
      position: pos,
    }));
  }

  // Generate vertices with SIMPLE NUMERIC IDs
  // Map from coordinate string to vertex data
  const vertexCoordMap = new Map<string, { id: number; position: { q: number; r: number; s: number }; hexIds: string[] }>();
  let nextVertexId = 1;
  
  hexes.forEach(hex => {
    const hexVertices = getHexVertices(hex.position);
    hexVertices.forEach(vertexPos => {
      const coordKey = `${vertexPos.q},${vertexPos.r},${vertexPos.s}`;
      
      if (!vertexCoordMap.has(coordKey)) {
        vertexCoordMap.set(coordKey, {
          id: nextVertexId++,
          position: vertexPos,  // ✅ Guardamos las coordenadas cúbicas
          hexIds: [hex.id],
        });
      } else {
        const vertex = vertexCoordMap.get(coordKey)!;
        if (!vertex.hexIds.includes(hex.id)) {
          vertex.hexIds.push(hex.id);
        }
      }
    });
  });

  // Build adjacency map for vertices
  // Two vertices are adjacent if they are on the same hex and consecutive
  const adjacencyMap = new Map<number, Set<number>>();
  
  hexes.forEach(hex => {
    const hexVertices = getHexVertices(hex.position);
    const vertexIds = hexVertices.map(pos => {
      const coordKey = `${pos.q},${pos.r},${pos.s}`;
      return vertexCoordMap.get(coordKey)!.id;
    });
    
    // Connect consecutive vertices around the hexagon
    for (let i = 0; i < vertexIds.length; i++) {
      const v1 = vertexIds[i];
      const v2 = vertexIds[(i + 1) % vertexIds.length];
      
      if (!adjacencyMap.has(v1)) adjacencyMap.set(v1, new Set());
      if (!adjacencyMap.has(v2)) adjacencyMap.set(v2, new Set());
      
      adjacencyMap.get(v1)!.add(v2);
      adjacencyMap.get(v2)!.add(v1);
    }
  });

  // Create final vertex array with adjacency info
  const vertices: Vertex[] = Array.from(vertexCoordMap.values()).map(v => ({
    id: v.id,
    hexIds: v.hexIds,
    position: v.position,  // ✅ Incluimos las coordenadas cúbicas para rendering
    adjacentVertexIds: Array.from(adjacencyMap.get(v.id) || []).sort((a, b) => a - b),
  }));

  // Sort vertices by ID for consistency
  vertices.sort((a, b) => a.id - b.id);

  // Generate edges with SIMPLE NUMERIC IDs
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  let nextEdgeId = 1;
  
  vertices.forEach(vertex => {
    vertex.adjacentVertexIds.forEach(adjacentId => {
      // Create edge key with sorted vertex IDs to avoid duplicates
      const [v1, v2] = vertex.id < adjacentId ? [vertex.id, adjacentId] : [adjacentId, vertex.id];
      const edgeKey = `${v1}-${v2}`;
      
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: nextEdgeId++,
          vertexIds: [v1, v2],
        });
      }
    });
  });

  // Sort edges by ID for consistency
  edges.sort((a, b) => a.id - b.id);
  
  console.log(`\n🎲 Board generated with SIMPLE IDs:`);
  console.log(`   ${hexes.length} hexes`);
  console.log(`   ${vertices.length} vertices (IDs: 1-${vertices.length})`);
  console.log(`   ${edges.length} edges (IDs: 1-${edges.length})`);
  console.log(`\n✅ Sample vertices:`);
  vertices.slice(0, 5).forEach(v => {
    console.log(`   Vertex ${v.id}: ${v.adjacentVertexIds.length} connections → [${v.adjacentVertexIds.slice(0, 3).join(', ')}...]`);
  });
  console.log(`\n✅ Sample edges:`);
  edges.slice(0, 5).forEach(e => {
    console.log(`   Edge ${e.id}: connects vertices ${e.vertexIds[0]} ↔ ${e.vertexIds[1]}`);
  });

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
  
  // These offsets define the 6 corners in clockwise order
  const vertices = [
    { q: q + 1, r: r - 1, s: s },      // 0: Top (NE)
    { q: q + 1, r: r, s: s - 1 },      // 1: Top-right (E)
    { q: q, r: r + 1, s: s - 1 },      // 2: Bottom-right (SE)
    { q: q - 1, r: r + 1, s: s },      // 3: Bottom (SW)
    { q: q - 1, r: r, s: s + 1 },      // 4: Bottom-left (W)
    { q: q, r: r - 1, s: s + 1 },      // 5: Top-left (NW)
  ];
  
  return vertices;
}
