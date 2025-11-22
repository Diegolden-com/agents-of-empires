/**
 * 🎯 Ejemplo de Agente que RESPETA TODAS LAS REGLAS de Catan
 * 
 * Este agente demuestra cómo:
 * 1. Verificar la fase actual del juego
 * 2. Usar SOLO posiciones disponibles de las listas
 * 3. Respetar la regla de distancia
 * 4. Conectar carreteras correctamente en setup
 * 5. Verificar recursos antes de construir
 */

interface GameState {
  phase: string;
  currentPlayerIndex: number;
  board: {
    vertices: Array<{ id: string; building?: any }>;
    edges: Array<{ id: string; road?: any }>;
  };
  players: Array<{
    id: string;
    name: string;
    resources: {
      wood: number;
      brick: number;
      sheep: number;
      wheat: number;
      ore: number;
    };
    victoryPoints: number;
  }>;
}

interface AgentState {
  gameInfo: {
    phase: string;
    turn: number;
    isYourTurn: boolean;
  };
  yourStatus: {
    playerId: string;
    resources: any;
    victoryPoints: number;
  };
  opponents: Array<any>;
  availableActions: {
    vertices: Array<{ id: string; hexIds: string[] }>;
    edges: Array<{ id: string; vertexIds: string[] }>;
    possibleActions: string[];
  };
}

/**
 * Función principal de decisión del agente
 */
export async function makeDecision(
  gameId: string,
  playerId: string
): Promise<{ type: string; data?: any; reasoning: string }> {
  
  // 1. Obtener estado del juego
  const response = await fetch(
    `/api/agent/llm?gameId=${gameId}&playerId=${playerId}`
  );
  const agentState: AgentState = await response.json();

  const { phase } = agentState.gameInfo;
  const { resources, victoryPoints } = agentState.yourStatus;
  const { vertices, edges, possibleActions } = agentState.availableActions;

  console.log(`📍 Phase: ${phase}`);
  console.log(`🎯 VP: ${victoryPoints}`);
  console.log(`📦 Resources:`, resources);
  console.log(`✅ Available vertices: ${vertices.length}`);
  console.log(`✅ Available edges: ${edges.length}`);

  // 2. Decisión basada en la fase

  // ═══════════════════════════════════════════════════════
  // SETUP SETTLEMENT (Fases 1 y 3)
  // ═══════════════════════════════════════════════════════
  if (phase === 'setup_settlement_1' || phase === 'setup_settlement_2') {
    if (vertices.length === 0) {
      throw new Error('No available vertices for settlement');
    }

    // Estrategia: Buscar vértice con más hexágonos de números buenos (6, 8)
    const bestVertex = findBestVertex(vertices);

    return {
      type: 'build_settlement',
      data: { vertexId: bestVertex.id },
      reasoning: `Placing ${phase === 'setup_settlement_1' ? 'first' : 'second'} settlement on vertex with good resource production`,
    };
  }

  // ═══════════════════════════════════════════════════════
  // SETUP ROAD (Fases 2 y 4)
  // ═══════════════════════════════════════════════════════
  if (phase === 'setup_road_1' || phase === 'setup_road_2') {
    if (edges.length === 0) {
      throw new Error('No available edges for road');
    }

    // ⚠️ IMPORTANTE: Las edges en la lista YA están filtradas
    // para conectar al último asentamiento construido
    // Simplemente elegimos la mejor opción estratégica

    // Estrategia: Elegir edge que nos da más opciones de expansión
    const bestEdge = edges[0]; // Simplificado para el ejemplo

    return {
      type: 'build_road',
      data: { edgeId: bestEdge.id },
      reasoning: `Placing ${phase === 'setup_road_1' ? 'first' : 'second'} road connected to last settlement (already validated)`,
    };
  }

  // ═══════════════════════════════════════════════════════
  // DICE ROLL
  // ═══════════════════════════════════════════════════════
  if (phase === 'dice_roll') {
    return {
      type: 'roll',
      reasoning: 'Rolling dice to get resources',
    };
  }

  // ═══════════════════════════════════════════════════════
  // MAIN PHASE (Fase principal del juego)
  // ═══════════════════════════════════════════════════════
  if (phase === 'main') {
    
    // Prioridad 1: Construir asentamiento si tenemos recursos
    if (canBuildSettlement(resources) && vertices.length > 0) {
      const bestVertex = findBestVertex(vertices);
      return {
        type: 'build_settlement',
        data: { vertexId: bestVertex.id },
        reasoning: 'Building settlement to gain victory points and resource production',
      };
    }

    // Prioridad 2: Construir carretera para expandir
    if (canBuildRoad(resources) && edges.length > 0) {
      return {
        type: 'build_road',
        data: { edgeId: edges[0].id },
        reasoning: 'Building road to expand territory',
      };
    }

    // Prioridad 3: Comerciar si tenemos exceso
    const tradeAction = findBestTrade(resources);
    if (tradeAction) {
      return {
        type: 'trade_bank',
        data: tradeAction,
        reasoning: 'Trading excess resources for needed ones',
      };
    }

    // Prioridad 4: Terminar turno si no hay nada que hacer
    return {
      type: 'end_turn',
      reasoning: 'No viable actions available with current resources',
    };
  }

  // Fallback
  throw new Error(`Unknown phase: ${phase}`);
}

/**
 * Verifica si podemos construir un asentamiento
 */
function canBuildSettlement(resources: any): boolean {
  return (
    resources.wood >= 1 &&
    resources.brick >= 1 &&
    resources.sheep >= 1 &&
    resources.wheat >= 1
  );
}

/**
 * Verifica si podemos construir una carretera
 */
function canBuildRoad(resources: any): boolean {
  return resources.wood >= 1 && resources.brick >= 1;
}

/**
 * Verifica si podemos construir una ciudad
 */
function canBuildCity(resources: any): boolean {
  return resources.wheat >= 2 && resources.ore >= 3;
}

/**
 * Encuentra el mejor vértice para construir
 * (basado en probabilidad de producción de recursos)
 */
function findBestVertex(vertices: Array<{ id: string; hexIds: string[] }>) {
  // ✅ IMPORTANTE: Todos los vértices en la lista ya cumplen
  // la regla de distancia, así que cualquiera es válido
  
  // Para este ejemplo, simplemente tomamos el primero
  // En un agente real, evaluarías los hexágonos adyacentes
  return vertices[0];
}

/**
 * Encuentra el mejor comercio posible
 */
function findBestTrade(resources: any): any | null {
  const resourceTypes = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
  
  // Buscar recurso con 4+ unidades
  for (const giveType of resourceTypes) {
    if (resources[giveType] >= 4) {
      // Buscar recurso que necesitamos (el que menos tenemos)
      const needType = resourceTypes
        .filter(t => t !== giveType)
        .sort((a, b) => resources[a] - resources[b])[0];

      return {
        give: { [giveType]: 4 },
        receive: needType,
      };
    }
  }

  return null;
}

/**
 * Ejemplo de uso con fetch a la API
 */
export async function playTurn(gameId: string, playerId: string) {
  try {
    // Obtener decisión del agente
    const decision = await makeDecision(gameId, playerId);

    console.log('🤖 Agent decision:', decision);

    // Enviar acción a la API
    const response = await fetch('/api/agent/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId,
        playerId,
        action: { type: decision.type, data: decision.data },
        reasoning: decision.reasoning,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Action rejected:', result.message);
      throw new Error(result.message);
    }

    console.log('✅ Action accepted:', result.message);
    return result;

  } catch (error) {
    console.error('💥 Error playing turn:', error);
    throw error;
  }
}

/**
 * Loop de juego completo
 */
export async function playGame(gameId: string, playerId: string) {
  let gameOver = false;
  let turnCount = 0;

  while (!gameOver && turnCount < 100) {
    try {
      // Obtener estado
      const stateResponse = await fetch(
        `/api/agent/llm?gameId=${gameId}&playerId=${playerId}`
      );
      const state: AgentState = await stateResponse.json();

      // Verificar si es nuestro turno
      if (!state.gameInfo.isYourTurn) {
        console.log('⏳ Waiting for turn...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      // Jugar turno
      console.log(`\n🎲 Turn ${turnCount + 1}`);
      const result = await playTurn(gameId, playerId);

      if (result.gameOver) {
        console.log('🏆 Game Over!');
        gameOver = true;
      }

      turnCount++;
      
      // Pequeña pausa entre turnos
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Error in game loop:', error);
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════
// NOTAS IMPORTANTES SOBRE LAS REGLAS:
// ═══════════════════════════════════════════════════════
/*

✅ LO QUE ESTE AGENTE HACE BIEN:

1. Usa SOLO vertices/edges de las listas disponibles
   → Esto garantiza que cumple la regla de distancia
   → Y que las carreteras conectan correctamente

2. Verifica recursos antes de construir (en main phase)
   → Evita acciones que serán rechazadas

3. Usa nombres de acción correctos
   → "build_settlement" no "setup_settlement"
   → "build_road" no "place_road"

4. NUNCA usa "end_turn" en setup
   → En setup siempre construye

5. Responde con el formato correcto
   → { type, data, reasoning }

⚠️ ERRORES COMUNES EVITADOS:

❌ NO inventa vertex/edge IDs
✅ Usa IDs de las listas

❌ NO calcula posiciones manualmente
✅ Confía en las listas filtradas

❌ NO intenta construir sin recursos
✅ Verifica recursos primero

❌ NO usa nombres de fase como acciones
✅ Usa "build_*" en todas las fases

❌ NO intenta end_turn en setup
✅ Siempre construye en setup

*/

