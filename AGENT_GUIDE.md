# 🤖 Guía para Construir Agentes LLM

Esta guía te ayudará a construir agentes LLM que puedan jugar Catán de manera competitiva.

## ⚠️ IMPORTANTE: Lee las Reglas Primero

Antes de empezar, **LEE el archivo `CATAN_RULES.md`** que contiene todas las reglas oficiales del juego.
Los agentes que no sigan estas reglas tendrán sus acciones rechazadas.

**Reglas críticas que DEBES respetar:**
1. ✅ **REGLA DE DISTANCIA**: Asentamientos deben estar a 2+ aristas de distancia
2. ✅ **CONEXIÓN DE CARRETERAS**: En setup, las carreteras DEBEN conectar al último asentamiento construido
3. ✅ **NO CONSTRUIR EN OCUPADO**: Solo usa IDs de las listas de posiciones disponibles
4. ✅ **ACCIONES CORRECTAS**: Usa "build_settlement", NO "setup_settlement"
5. ✅ **NO END_TURN EN SETUP**: En setup DEBES construir

## 🚀 Quick Start

### 1. Obtener el Estado del Juego

```bash
GET /api/agent/llm?gameId=GAME_ID&playerId=PLAYER_ID
```

Retorna un objeto con:
- `systemPrompt`: Instrucciones para el LLM
- `gameState`: Estado completo del juego
- `instructions`: Qué puedes hacer en este turno

### 2. Decidir Acción con tu LLM

```typescript
const llmResponse = await yourLLM.complete(systemPrompt + gameState);
const action = JSON.parse(llmResponse);
```

### 3. Ejecutar la Acción

```bash
POST /api/agent/llm
Body: {
  "gameId": "GAME_ID",
  "playerId": "PLAYER_ID",
  "action": { "type": "roll" },
  "reasoning": "Tu razonamiento estratégico"
}
```

## 📋 Tipos de Acciones

### 1. Tirar Dados (roll)

```json
{
  "type": "roll"
}
```

### 2. Construir Camino (build_road)

```json
{
  "type": "build_road",
  "data": {
    "edgeId": "e_v_0.5_-0.5_0_v_0.5_0_-0.5"
  }
}
```

Costo: 1🌲 + 1🧱

### 3. Construir Asentamiento (build_settlement)

```json
{
  "type": "build_settlement",
  "data": {
    "vertexId": "v_0.5_-0.5_0"
  }
}
```

Costo: 1🌲 + 1🧱 + 1🐑 + 1🌾

### 4. Construir Ciudad (build_city)

```json
{
  "type": "build_city",
  "data": {
    "vertexId": "v_0.5_-0.5_0"
  }
}
```

Costo: 2🌾 + 3⛏️

### 5. Comerciar con Banco (trade_bank)

```json
{
  "type": "trade_bank",
  "data": {
    "give": { "wood": 4 },
    "receive": "brick"
  }
}
```

Ratio: 4:1 (das 4 de cualquier recurso, recibes 1 del que elijas)

### 6. Terminar Turno (end_turn)

```json
{
  "type": "end_turn"
}
```

## 🎯 Estrategias Recomendadas

### Fase de Setup (Primeros Turnos)

1. **Prioriza números buenos**: 6 y 8 son los más probables
2. **Diversifica recursos**: Intenta tener acceso a los 5 tipos
3. **Piensa en expansión**: Deja espacio para construir

**Probabilidad de dados:**
- 6 y 8: ~14% cada uno (más frecuentes)
- 5 y 9: ~11% cada uno
- 4 y 10: ~8% cada uno
- 3 y 11: ~6% cada uno
- 2 y 12: ~3% cada uno

### Juego Temprano (Turnos 5-15)

1. **Construye caminos** para expandirte
2. **Busca asentamientos adicionales** antes que ciudades
3. **Comercia inteligentemente** si tienes exceso de un recurso

### Juego Medio (Turnos 15-30)

1. **Actualiza a ciudades** para duplicar producción
2. **Bloquea a oponentes** construyendo donde ellos quieren
3. **Calcula camino más largo** si tienes ventaja

### Juego Final (Cerca de 10 VP)

1. **Cuenta los PV de todos** - saber quién va ganando
2. **Bloquea al líder** si no eres tú
3. **Calcula tu ruta más rápida** a 10 VP

## 🧠 Ejemplo de Prompt para LLM

```
Eres un jugador experto de Catán. Tu objetivo es ganar llegando primero a 10 puntos de victoria.

ESTADO DEL JUEGO:
Turno: 12
Fase: main
Tus Puntos de Victoria: 5
Líder actual: Oponente 1 (7 PV)

TUS RECURSOS:
🌲 Madera: 3
🧱 Ladrillo: 2
🐑 Oveja: 1
🌾 Trigo: 2
⛏️  Mineral: 0

ACCIONES POSIBLES:
- build_road
- build_settlement
- trade_bank
- end_turn

TUS EDIFICIOS:
- 2 asentamientos
- 4 caminos

ANÁLISIS:
1. ¿Qué construcción te acerca más a 10 PV?
2. ¿Puedes bloquear al líder?
3. ¿Necesitas comerciar primero?

Responde SOLO con JSON:
{
  "type": "accion",
  "data": { ... },
  "reasoning": "tu análisis estratégico"
}
```

## 💡 Tips Avanzados

### 1. Análisis de Probabilidades

Calcula qué hexágonos te dan más recursos:

```typescript
function calculateExpectedValue(hexNumber: number): number {
  const probabilities: Record<number, number> = {
    2: 1/36, 3: 2/36, 4: 3/36, 5: 4/36, 6: 5/36,
    8: 5/36, 9: 4/36, 10: 3/36, 11: 2/36, 12: 1/36
  };
  return probabilities[hexNumber] || 0;
}
```

### 2. Evaluación de Posiciones

```typescript
function evaluateVertex(vertex: Vertex, hexes: HexTile[]): number {
  let score = 0;
  
  for (const hexId of vertex.hexIds) {
    const hex = hexes.find(h => h.id === hexId);
    if (!hex || hex.terrain === 'desert') continue;
    
    // Suma valor esperado del hex
    score += calculateExpectedValue(hex.number!);
    
    // Bonus por diversidad de recursos
    // ... (implementa tu lógica)
  }
  
  return score;
}
```

### 3. Detección de Bloqueos

```typescript
function canOpponentWin(opponent: Player): boolean {
  // Si el oponente tiene 8+ PV, puede ganar pronto
  if (opponent.victoryPoints >= 8) {
    // Verifica si tiene recursos para una ciudad
    if (opponent.resources.wheat >= 2 && opponent.resources.ore >= 3) {
      return true;
    }
  }
  return false;
}
```

### 4. Optimización de Comercio

```typescript
function findBestTrade(resources: Resources, needed: ResourceType): ResourceType | null {
  const counts = Object.entries(resources);
  
  // Comercia el recurso que más tienes (excepto el que necesitas)
  const sortedResources = counts
    .filter(([type]) => type !== needed)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedResources[0][1] >= 4) {
    return sortedResources[0][0] as ResourceType;
  }
  
  return null;
}
```

## 📊 Métricas de Éxito

Mide el desempeño de tu agente:

1. **Win Rate**: % de partidas ganadas
2. **Avg Victory Points**: PV promedio al final
3. **Turns to Win**: Turnos promedio para ganar
4. **Resource Efficiency**: Recursos usados vs obtenidos
5. **Building Rate**: Construcciones por turno

## 🔗 Integraciones Populares

### OpenAI GPT-4

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function playTurn(gameId: string, playerId: string) {
  const state = await fetch(`/api/agent/llm?gameId=${gameId}&playerId=${playerId}`);
  const { systemPrompt, gameState, instructions } = await state.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${instructions}\n\n${JSON.stringify(gameState)}` },
    ],
    response_format: { type: 'json_object' },
  });

  const action = JSON.parse(response.choices[0].message.content);
  
  return fetch('/api/agent/llm', {
    method: 'POST',
    body: JSON.stringify({ gameId, playerId, action }),
  });
}
```

### Anthropic Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function playTurn(gameId: string, playerId: string) {
  const state = await fetch(`/api/agent/llm?gameId=${gameId}&playerId=${playerId}`);
  const { systemPrompt, gameState } = await state.json();

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      { role: 'user', content: JSON.stringify(gameState) },
    ],
  });

  const action = JSON.parse(response.content[0].text);
  
  return fetch('/api/agent/llm', {
    method: 'POST',
    body: JSON.stringify({ gameId, playerId, action }),
  });
}
```

## 🏆 Competencia de Agentes

Organiza torneos entre agentes:

1. Crea múltiples juegos
2. Cada agente juega contra todos (round-robin)
3. Registra estadísticas
4. Determina el mejor agente

```typescript
async function runTournament(agents: Agent[]) {
  const results = [];
  
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      for (let k = j + 1; k < agents.length; k++) {
        // Juego de 3 agentes
        const game = await createGame([agents[i], agents[j], agents[k]]);
        const winner = await playGameToEnd(game);
        results.push({ game: game.id, winner });
      }
    }
  }
  
  return analyzeResults(results);
}
```

---

## ❌ Errores Comunes y Cómo Evitarlos

### Error 1: Violación de Regla de Distancia

**Síntoma**: Tu acción `build_settlement` es rechazada con mensaje "Too close to another settlement"

**Causa**: Intentaste construir en un vértice adyacente a otro asentamiento

**Solución**: 
```typescript
// ❌ MAL: Elegir cualquier vértice
const vertexId = "v_0.5_-0.5_0"; // Puede estar muy cerca de otros

// ✅ BIEN: Usar SOLO vértices de la lista disponible
const availableVertices = gameState.availableVertices; // Ya filtrados
const vertexId = availableVertices[0].id; // Seguro que cumple regla
```

### Error 2: Carretera Desconectada en Setup

**Síntoma**: Tu acción `build_road` falla con "Road must connect to your last settlement"

**Causa**: En setup_road_1 o setup_road_2, intentaste conectar a un asentamiento que no es el más reciente

**Solución**:
```typescript
// ❌ MAL: Conectar a cualquier asentamiento
const mySettlements = gameState.board.vertices.filter(v => 
  v.building?.playerId === myId
);
const anySettlement = mySettlements[0]; // Puede ser el primero

// ✅ BIEN: Conectar al ÚLTIMO asentamiento
const lastSettlement = mySettlements[mySettlements.length - 1]; // El más reciente
const validEdges = gameState.availableEdges; // Ya filtrados para conectar al último
```

### Error 3: Usar Nombres de Acción Incorrectos

**Síntoma**: Error "Invalid action type"

**Causa**: Usaste nombres como "setup_settlement" o "place_road"

**Solución**:
```typescript
// ❌ MAL: Nombres incorrectos
{ "type": "setup_settlement", ... }
{ "type": "place_road", ... }
{ "type": "finish_turn", ... }

// ✅ BIEN: Nombres correctos (incluso en setup)
{ "type": "build_settlement", ... }
{ "type": "build_road", ... }
{ "type": "end_turn", ... }
```

### Error 4: Intentar end_turn en Setup

**Síntoma**: Acción rechazada en fase setup

**Causa**: Intentaste terminar turno cuando debes construir

**Solución**:
```typescript
// ❌ MAL: end_turn en setup
if (gameState.phase === 'setup_settlement_1') {
  return { type: 'end_turn' }; // RECHAZADO
}

// ✅ BIEN: Construir en setup
if (gameState.phase === 'setup_settlement_1') {
  return { 
    type: 'build_settlement',
    data: { vertexId: availableVertices[0].id }
  };
}
```

### Error 5: No Usar IDs de Listas Disponibles

**Síntoma**: "Vertex not found" o "Edge already has road"

**Causa**: Inventaste IDs o usaste IDs ocupados

**Solución**:
```typescript
// ❌ MAL: Inventar IDs o calcularlos
const vertexId = `v_${x}_${y}_${z}`; // Puede no existir o estar ocupado

// ✅ BIEN: Usar IDs de la lista
const gameState = await getGameState(gameId, playerId);
const vertexId = gameState.availableVertices[0].id; // Garantizado válido
```

### Error 6: Construir sin Recursos en Fase Main

**Síntoma**: "Not enough resources"

**Causa**: Intentaste construir sin verificar recursos

**Solución**:
```typescript
// ❌ MAL: Construir sin verificar
return { type: 'build_settlement', data: { ... } };

// ✅ BIEN: Verificar recursos primero
const { wood, brick, sheep, wheat } = player.resources;
if (wood >= 1 && brick >= 1 && sheep >= 1 && wheat >= 1) {
  return { type: 'build_settlement', data: { ... } };
} else {
  // Comerciar o terminar turno
  return { type: 'end_turn' };
}
```

---

## 📚 Recursos Adicionales

- 📖 **`CATAN_RULES.md`** - Reglas oficiales completas del juego
- 🔧 **`/examples`** - Ejemplos de agentes funcionales
- 🌐 **`API.md`** - Documentación completa de la API

---

¿Preguntas? Revisa los ejemplos en `/examples` o abre un issue en GitHub.

¡Buena suerte construyendo el mejor agente de Catán! 🎲🤖

