# 🛡️ Mejoras en Enforcement de Reglas de Catan

## 📋 Resumen

Se han implementado mejoras significativas para asegurar que los agentes LLM sigan estrictamente las reglas oficiales de Catan. Estos cambios incluyen documentación completa de reglas, prompts mejorados, y ejemplos de código.

---

## 🎯 Problema Identificado

Los agentes LLM estaban violando las reglas del juego, específicamente:

1. ❌ Colocando asentamientos muy cerca unos de otros (violando regla de distancia)
2. ❌ Construyendo carreteras desconectadas en fase setup
3. ❌ Intentando construir en espacios ocupados
4. ❌ Usando nombres de acción incorrectos
5. ❌ Intentando hacer `end_turn` en fases de setup

---

## ✅ Soluciones Implementadas

### 1. Documentación Completa de Reglas

**Archivo nuevo: `CATAN_RULES.md`**

Documento completo con todas las reglas oficiales del juego, incluyendo:

- ✅ Regla de distancia para asentamientos (2+ aristas)
- ✅ Reglas de conexión para carreteras
- ✅ Reglas especiales de setup
- ✅ Costos de construcción
- ✅ Fases del juego y acciones válidas
- ✅ Errores comunes y cómo evitarlos
- ✅ Probabilidades de dados para estrategia

### 2. System Prompt Mejorado

**Archivos modificados:**
- `lib/agent-decision.ts` (líneas 36-143)
- `app/api/agent/llm/route.ts` (líneas 84-120)

**Mejoras:**

```typescript
// ANTES (vago):
"Build settlements (costs 1 wood + 1 brick + 1 sheep + 1 wheat)"

// DESPUÉS (específico):
"🔴 DISTANCE RULE (MOST IMPORTANT - ALWAYS CHECK):
➤ Settlements MUST be separated from ANY other settlement by AT LEAST 2 EDGES
➤ In other words: NO settlements on ADJACENT vertices
➤ If a vertex has a settlement, ALL vertices directly connected to it are BLOCKED"
```

### 3. Instrucciones por Fase Mejoradas

**Archivo modificado: `lib/agent-decision.ts` (líneas 280-350)**

Ahora cada fase tiene una caja visual con instrucciones explícitas:

```
┌─────────────────────────────────────────────────────────┐
│ ACTION REQUIRED: Place your FIRST settlement           │
│                                                         │
│ ➡️  Use action: "build_settlement"                      │
│ ➡️  With data: { "vertexId": "..." }                    │
│ ➡️  Pick ANY vertexId from VALID Vertices list above    │
│                                                         │
│ ✅ FREE (no resources needed)                           │
│ ✅ Distance rule already enforced in list              │
│ ❌ CANNOT use "end_turn"                                │
└─────────────────────────────────────────────────────────┘
```

### 4. Listas de Posiciones Mejoradas

**Archivo modificado: `lib/agent-decision.ts` (líneas 264-279)**

Ahora se enfatiza que las listas YA están filtradas:

```typescript
✅ VALID Vertices for settlements (8 available):
   These vertices already respect the DISTANCE RULE (2+ edges from other settlements)
  - v_0.5_-0.5_0
  - v_0_0.5_-0.5
  ...

✅ VALID Edges for roads (12 available):
   ⚠️ SETUP PHASE: These edges connect to your LAST settlement (as required)
  - e_v_0.5_-0.5_0_v_0.5_0_-0.5
  ...
```

### 5. Ejemplo de Agente Compliant

**Archivo nuevo: `examples/rules-compliant-agent.ts`**

Agente de ejemplo que demuestra:

- ✅ Cómo verificar la fase actual
- ✅ Cómo usar SOLO posiciones de las listas disponibles
- ✅ Cómo verificar recursos antes de construir
- ✅ Cómo estructurar el código para cada fase
- ✅ Manejo de errores correcto

### 6. Guía de Agentes Actualizada

**Archivo modificado: `AGENT_GUIDE.md`**

Agregado:

- ⚠️ Advertencia para leer `CATAN_RULES.md` primero
- ❌ Sección de errores comunes con ejemplos de código
- 💡 Soluciones para cada tipo de error

---

## 🔍 Validaciones Existentes en el Motor

Las siguientes validaciones YA estaban implementadas en `lib/game-engine.ts`:

### Validación de Asentamientos (líneas 176-225)

```typescript
// 1. Verificar que el vértice no esté ocupado
if (vertex.building) {
  console.error('Settlement build failed: Vertex already has building');
  return false;
}

// 2. Verificar regla de distancia
if (!isVertexDistanceValid(state, vertex.id)) {
  console.error('Settlement build failed: Too close to another settlement');
  return false;
}

// 3. En juego normal, verificar recursos y conexión a carretera
if (!state.phase.startsWith('setup')) {
  if (!canBuildSettlement(player)) {
    console.error('Not enough resources');
    return false;
  }
  
  if (!isVertexConnectedToPlayerRoad(state, vertex.id, playerId)) {
    console.error('Must be connected to your road');
    return false;
  }
}
```

### Validación de Carreteras (líneas 112-174)

```typescript
// 1. Verificar que la arista no esté ocupada
if (edge.road) {
  console.error('Road build failed: Edge already has a road');
  return false;
}

// 2. En setup, verificar conexión al último asentamiento
if (state.phase === 'setup_road_1' || state.phase === 'setup_road_2') {
  const playerSettlements = state.board.vertices.filter(v => 
    v.building && v.building.playerId === playerId
  );
  
  const lastSettlement = playerSettlements[playerSettlements.length - 1];
  const connectsToLastSettlement = edge.vertexIds.includes(lastSettlement.id);
  
  if (!connectsToLastSettlement) {
    console.error('In setup, road must connect to your last settlement');
    return false;
  }
}

// 3. En juego normal, verificar recursos y conexión
else if (!state.phase.startsWith('setup')) {
  if (!canBuildRoad(player)) {
    console.error('Not enough resources');
    return false;
  }
  
  if (!isEdgeConnectedToPlayer(state, edge.id, playerId)) {
    console.error('Road must connect to your existing roads or settlements');
    return false;
  }
}
```

### Regla de Distancia (líneas 345-360)

```typescript
function isVertexDistanceValid(state: GameState, vertexId: string): boolean {
  // Encuentra vértices adyacentes
  const adjacentVertexIds = state.board.edges
    .filter(e => e.vertexIds.includes(vertexId))
    .flatMap(e => e.vertexIds)
    .filter(id => id !== vertexId);

  // Verifica que ninguno tenga edificio
  return !adjacentVertexIds.some(id => {
    const adjacentVertex = state.board.vertices.find(v => v.id === id);
    return adjacentVertex?.building !== undefined;
  });
}
```

---

## 📊 Impacto Esperado

Con estas mejoras, los agentes deberían:

1. ✅ **Entender las reglas claramente** - Documentación exhaustiva
2. ✅ **Recibir instrucciones explícitas** - Prompts mejorados por fase
3. ✅ **Usar posiciones válidas** - Énfasis en listas pre-filtradas
4. ✅ **Evitar errores comunes** - Ejemplos de qué NO hacer
5. ✅ **Seguir el ejemplo correcto** - Código de referencia completo

---

## 🧪 Cómo Probar

### Test Manual

```bash
# 1. Crear un juego
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"playerNames": ["Agent1", "Agent2", "Agent3"]}'

# 2. Obtener estado para agente
curl "http://localhost:3000/api/agent/llm?gameId=GAME_ID&playerId=player_0"

# 3. Enviar acción
curl -X POST http://localhost:3000/api/agent/llm \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "GAME_ID",
    "playerId": "player_0",
    "action": {
      "type": "build_settlement",
      "data": { "vertexId": "v_..." }
    },
    "reasoning": "Testing rules compliance"
  }'
```

### Test con Agente de Ejemplo

```typescript
import { playGame } from './examples/rules-compliant-agent';

// Jugar un juego completo
await playGame('game-123', 'player_0');
```

---

## 📝 Checklist de Validación

Para verificar que un agente sigue las reglas:

- [ ] Lee `CATAN_RULES.md` antes de implementar
- [ ] Usa SOLO vertex/edge IDs de las listas disponibles
- [ ] Verifica recursos antes de construir (en main phase)
- [ ] Usa nombres de acción correctos (`build_*`, no `setup_*`)
- [ ] NUNCA usa `end_turn` en setup
- [ ] Maneja errores de la API correctamente
- [ ] Incluye `reasoning` en cada decisión
- [ ] Sigue el formato JSON correcto

---

## 🔧 Archivos Modificados

1. ✅ `CATAN_RULES.md` - **NUEVO** - Documentación completa de reglas
2. ✅ `lib/agent-decision.ts` - System prompt mejorado + instrucciones por fase
3. ✅ `app/api/agent/llm/route.ts` - Prompt para agentes externos mejorado
4. ✅ `AGENT_GUIDE.md` - Advertencia de reglas + errores comunes
5. ✅ `examples/rules-compliant-agent.ts` - **NUEVO** - Ejemplo completo
6. ✅ `RULES_ENFORCEMENT.md` - **NUEVO** - Este documento

---

## 🎯 Próximos Pasos Opcionales

Si los agentes continúan violando reglas:

1. **Agregar validación pre-action**: Crear endpoint que valide acción antes de ejecutarla
2. **Logging mejorado**: Registrar todas las violaciones de reglas
3. **Penalizaciones**: Restar puntos por violaciones repetidas
4. **Tutorial interactivo**: Modo de práctica que explica cada regla
5. **Validación de LLM**: Usar un segundo LLM para validar la respuesta del primero

---

## ✅ Conclusión

Con estas mejoras, los agentes LLM tienen toda la información necesaria para jugar Catan correctamente:

- 📖 **Documentación completa** de todas las reglas
- 🎯 **Instrucciones explícitas** para cada fase
- 💡 **Ejemplos de código** funcionales
- ❌ **Guía de errores** comunes y soluciones
- 🛡️ **Validaciones robustas** en el motor del juego

Los LLM ahora deberían poder jugar siguiendo todas las reglas oficiales de Catan. 🎲✨

