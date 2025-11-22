// Mapeo de opciones numeradas a IDs reales
// Esto permite que los agentes usen números pero el sistema use IDs internamente

interface OptionMap {
  vertices: Map<number, string>; // opción → vertexId
  edges: Map<number, string>;    // opción → edgeId
  timestamp: number;
}

// Almacén en memoria de mapeos por jugador
const optionMaps = new Map<string, OptionMap>();

/**
 * Guarda el mapeo de opciones para un jugador
 */
export function saveOptionMap(
  playerId: string,
  vertexOptions: Array<{ id: string }>,
  edgeOptions: Array<{ id: string }>
): void {
  const vertices = new Map<number, string>();
  const edges = new Map<number, string>();

  vertexOptions.forEach((v, index) => {
    vertices.set(index + 1, v.id); // 1-indexed
  });

  edgeOptions.forEach((e, index) => {
    edges.set(index + 1, e.id); // 1-indexed
  });

  optionMaps.set(playerId, {
    vertices,
    edges,
    timestamp: Date.now(),
  });

  console.log(`📋 Saved option map for ${playerId}:`);
  console.log(`   Vertex options: ${vertices.size}`);
  console.log(`   Edge options: ${edges.size}`);
}

/**
 * Obtiene el vertexId correspondiente a una opción
 */
export function getVertexIdFromOption(
  playerId: string,
  option: number
): string | null {
  const map = optionMaps.get(playerId);
  if (!map) {
    console.error(`❌ No option map found for player ${playerId}`);
    return null;
  }

  const vertexId = map.vertices.get(option);
  if (!vertexId) {
    console.error(`❌ Invalid vertex option ${option} for player ${playerId}`);
    console.error(`   Available options: ${Array.from(map.vertices.keys()).join(', ')}`);
    return null;
  }

  console.log(`✅ Mapped vertex option ${option} → ${vertexId}`);
  return vertexId;
}

/**
 * Obtiene el edgeId correspondiente a una opción
 */
export function getEdgeIdFromOption(
  playerId: string,
  option: number
): string | null {
  const map = optionMaps.get(playerId);
  if (!map) {
    console.error(`❌ No option map found for player ${playerId}`);
    return null;
  }

  const edgeId = map.edges.get(option);
  if (!edgeId) {
    console.error(`❌ Invalid edge option ${option} for player ${playerId}`);
    console.error(`   Available options: ${Array.from(map.edges.keys()).join(', ')}`);
    return null;
  }

  console.log(`✅ Mapped edge option ${option} → ${edgeId}`);
  return edgeId;
}

/**
 * Limpia mapeos antiguos (más de 5 minutos)
 */
export function cleanOldMaps(): void {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  for (const [playerId, map] of optionMaps.entries()) {
    if (now - map.timestamp > fiveMinutes) {
      optionMaps.delete(playerId);
      console.log(`🧹 Cleaned old option map for ${playerId}`);
    }
  }
}

// Limpiar mapeos viejos cada minuto
setInterval(cleanOldMaps, 60000);

