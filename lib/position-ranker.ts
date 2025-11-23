// Sistema para rankear posiciones por calidad estratégica

import { GameState, Vertex, Edge } from './types';

interface RankedVertex {
  id: number;
  hexIds: string[];
  score: number;
  reasoning: string;
  hexNumbers: number[];
  hexTerrains: string[];
}

interface RankedEdge {
  id: number;
  vertexIds: number[];
  score: number;
  reasoning: string;
}

// Probabilidades de cada número en Catan
const DICE_PROBABILITY: Record<number, number> = {
  2: 1/36,
  3: 2/36,
  4: 3/36,
  5: 4/36,
  6: 5/36,
  7: 0,     // No produce recursos
  8: 5/36,
  9: 4/36,
  10: 3/36,
  11: 2/36,
  12: 1/36,
};

// Valor relativo de cada recurso
const RESOURCE_VALUE: Record<string, number> = {
  wood: 1.0,
  brick: 1.0,
  sheep: 0.9,
  wheat: 1.1,
  ore: 1.2,
  desert: 0,
};

/**
 * Calcula el valor esperado de un vértice basado en:
 * - Probabilidad de los números adyacentes
 * - Diversidad de recursos
 * - Valor de los recursos
 */
function calculateVertexScore(
  vertex: Vertex,
  gameState: GameState
): { score: number; reasoning: string; hexNumbers: number[]; hexTerrains: string[] } {
  let totalScore = 0;
  const hexNumbers: number[] = [];
  const hexTerrains: string[] = [];
  const resourceTypes = new Set<string>();

  // Evaluar cada hexágono adyacente
  for (const hexId of vertex.hexIds) {
    const hex = gameState.board.hexes.find(h => h.id === hexId);
    if (!hex || hex.terrain === 'desert') continue;

    const number = hex.number || 0;
    const probability = DICE_PROBABILITY[number] || 0;
    const resourceValue = RESOURCE_VALUE[hex.terrain] || 0;
    
    // Score = probabilidad × valor del recurso
    const hexScore = probability * resourceValue * 100;
    totalScore += hexScore;

    hexNumbers.push(number);
    hexTerrains.push(hex.terrain);
    resourceTypes.add(hex.terrain);
  }

  // Bonus por diversidad de recursos (importante en early game)
  const diversityBonus = resourceTypes.size * 5;
  totalScore += diversityBonus;

  // Bonus extra por números 6 y 8 (los más frecuentes)
  const has6or8 = hexNumbers.some(n => n === 6 || n === 8);
  if (has6or8) totalScore += 10;

  // Generar razonamiento
  const numberStr = hexNumbers.length > 0 
    ? hexNumbers.sort((a, b) => b - a).join(', ') 
    : 'ninguno';
  
  const terrainStr = [...new Set(hexTerrains)].join(', ');
  
  let reasoning = `Números: [${numberStr}]`;
  if (resourceTypes.size > 0) {
    reasoning += ` | Recursos: ${terrainStr}`;
  }
  if (has6or8) {
    reasoning += ` | ⭐ Tiene 6 u 8`;
  }

  return {
    score: Math.round(totalScore),
    reasoning,
    hexNumbers,
    hexTerrains,
  };
}

/**
 * Calcula el score de una arista basado en:
 * - Expansión potencial
 * - Acceso a nuevas posiciones para asentamientos
 */
function calculateEdgeScore(
  edge: Edge,
  gameState: GameState,
  playerId: string
): { score: number; reasoning: string } {
  let score = 50; // Base score

  // Evaluar los dos vértices que conecta
  const [v1Id, v2Id] = edge.vertexIds;
  const v1 = gameState.board.vertices.find(v => v.id === v1Id);
  const v2 = gameState.board.vertices.find(v => v.id === v2Id);

  let reasoning = 'Expande red';

  // Bonus si algún vértice está disponible para construir
  const v1Available = v1 && !v1.building;
  const v2Available = v2 && !v2.building;

  if (v1Available || v2Available) {
    score += 20;
    reasoning += ' | Acceso a vértices libres';
  }

  // Bonus si conecta a hexágonos con buenos números
  const allHexIds = [...(v1?.hexIds || []), ...(v2?.hexIds || [])];
  const goodNumbers = allHexIds
    .map(hexId => gameState.board.hexes.find(h => h.id === hexId))
    .filter(hex => hex && (hex.number === 6 || hex.number === 8));

  if (goodNumbers.length > 0) {
    score += goodNumbers.length * 15;
    reasoning += ' | Cerca de 6/8';
  }

  return { score, reasoning };
}

/**
 * Rankea y devuelve las mejores opciones de vértices
 */
export function rankVertices(
  availableVertices: Vertex[],
  gameState: GameState,
  limit: number = 5
): RankedVertex[] {
  const ranked = availableVertices.map(vertex => {
    const { score, reasoning, hexNumbers, hexTerrains } = calculateVertexScore(vertex, gameState);
    return {
      id: vertex.id,
      hexIds: vertex.hexIds,
      score,
      reasoning,
      hexNumbers,
      hexTerrains,
    };
  });

  // Ordenar por score (mayor a menor)
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}

/**
 * Rankea y devuelve las mejores opciones de aristas
 */
export function rankEdges(
  availableEdges: Edge[],
  gameState: GameState,
  playerId: string,
  limit: number = 5
): RankedEdge[] {
  const ranked = availableEdges.map(edge => {
    const { score, reasoning } = calculateEdgeScore(edge, gameState, playerId);
    return {
      id: edge.id,
      vertexIds: edge.vertexIds,
      score,
      reasoning,
    };
  });

  // Ordenar por score (mayor a menor)
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}

/**
 * Formatea opciones numeradas para mostrar al LLM
 */
export function formatVertexOptions(rankedVertices: RankedVertex[]): string {
  return rankedVertices
    .map((v, index) => {
      const option = index + 1;
      return `   ${option}. ${v.reasoning} (Score: ${v.score})`;
    })
    .join('\n');
}

/**
 * Formatea opciones de aristas numeradas para mostrar al LLM
 */
export function formatEdgeOptions(rankedEdges: RankedEdge[]): string {
  return rankedEdges
    .map((e, index) => {
      const option = index + 1;
      return `   ${option}. ${e.reasoning} (Score: ${e.score})`;
    })
    .join('\n');
}

