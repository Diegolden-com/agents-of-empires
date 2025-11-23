# Game Payload Documentation

Este documento describe el payload JSON que se envía desde el workflow de Chainlink CRE cuando un juego es activado.

## Endpoint Esperado

```
POST /api/game/start
Content-Type: application/json
```

## Estructura del Payload

```typescript
{
  gameId: string          // ID único del juego
  bettor: string          // Dirección Ethereum del apostador
  deposit: string         // Cantidad depositada en wei
  status: number          // Estado del juego (0: PENDING, 1: ACTIVE, 2: FINISHED, 3: CANCELLED)
  randomReady: boolean    // Si la aleatoriedad está lista
  bettorChoice: number    // Jugador elegido por el apostador (0-3)
  requestId: string       // ID de la petición VRF de Chainlink
  startTime: string       // Timestamp de inicio del juego
  endTime: string         // Timestamp de fin del juego (0 si no ha terminado)
  winner: number          // Ganador del juego (0: sin ganador, 1-4: índice del jugador ganador)

  aiPlayers: Array<{
    index: number         // Índice del jugador (0-3)
    company: number       // ID de la compañía (0-4)
    companyName: string   // Nombre de la compañía de IA
    modelIndex: number    // Índice del modelo en el array global (0-9)
    modelName: string     // Nombre completo del modelo de IA
    playOrder: number     // Orden de juego en Catan (1-4)
  }>

  board: Array<{
    index: number         // Índice del hexágono (0-18)
    position: string      // Descripción de la posición en el tablero
    resource: number      // ID del recurso (0-5)
    resourceName: string  // Nombre del recurso
  }>
}
```

## Ejemplo Completo

```json
{
  "gameId": "2",
  "bettor": "0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52",
  "deposit": "100000000000000",
  "status": 1,
  "randomReady": true,
  "bettorChoice": 0,
  "requestId": "123456789",
  "startTime": "1700000000",
  "endTime": "0",
  "winner": 0,
  "aiPlayers": [
    {
      "index": 0,
      "company": 0,
      "companyName": "ANTHROPIC",
      "modelIndex": 1,
      "modelName": "anthropic/claude-sonnet-4.5",
      "playOrder": 3
    },
    {
      "index": 1,
      "company": 1,
      "companyName": "GOOGLE",
      "modelIndex": 3,
      "modelName": "google/gemini-2.5-flash",
      "playOrder": 1
    },
    {
      "index": 2,
      "company": 2,
      "companyName": "OPENAI",
      "modelIndex": 4,
      "modelName": "openai/gpt-5",
      "playOrder": 4
    },
    {
      "index": 3,
      "company": 3,
      "companyName": "XAI",
      "modelIndex": 7,
      "modelName": "xai/grok-4-fast-reasoning",
      "playOrder": 2
    }
  ],
  "board": [
    {
      "index": 0,
      "position": "Row 1 - Position 1 (Top)",
      "resource": 3,
      "resourceName": "BRICK"
    },
    {
      "index": 1,
      "position": "Row 1 - Position 2",
      "resource": 0,
      "resourceName": "WOOD"
    },
    {
      "index": 2,
      "position": "Row 1 - Position 3",
      "resource": 0,
      "resourceName": "WOOD"
    },
    {
      "index": 3,
      "position": "Row 2 - Position 1",
      "resource": 4,
      "resourceName": "ORE"
    },
    {
      "index": 4,
      "position": "Row 2 - Position 2",
      "resource": 3,
      "resourceName": "BRICK"
    },
    {
      "index": 5,
      "position": "Row 2 - Position 3",
      "resource": 2,
      "resourceName": "WHEAT"
    },
    {
      "index": 6,
      "position": "Row 2 - Position 4",
      "resource": 0,
      "resourceName": "WOOD"
    },
    {
      "index": 7,
      "position": "Row 3 - Position 1",
      "resource": 0,
      "resourceName": "WOOD"
    },
    {
      "index": 8,
      "position": "Row 3 - Position 2",
      "resource": 3,
      "resourceName": "BRICK"
    },
    {
      "index": 9,
      "position": "Row 3 - Position 3",
      "resource": 1,
      "resourceName": "SHEEP"
    },
    {
      "index": 10,
      "position": "Row 3 - Position 4",
      "resource": 2,
      "resourceName": "WHEAT"
    },
    {
      "index": 11,
      "position": "Row 3 - Position 5 (Center)",
      "resource": 5,
      "resourceName": "DESERT"
    },
    {
      "index": 12,
      "position": "Row 4 - Position 1",
      "resource": 2,
      "resourceName": "WHEAT"
    },
    {
      "index": 13,
      "position": "Row 4 - Position 2",
      "resource": 1,
      "resourceName": "SHEEP"
    },
    {
      "index": 14,
      "position": "Row 4 - Position 3",
      "resource": 2,
      "resourceName": "WHEAT"
    },
    {
      "index": 15,
      "position": "Row 4 - Position 4",
      "resource": 4,
      "resourceName": "ORE"
    },
    {
      "index": 16,
      "position": "Row 5 - Position 1",
      "resource": 1,
      "resourceName": "SHEEP"
    },
    {
      "index": 17,
      "position": "Row 5 - Position 2",
      "resource": 1,
      "resourceName": "SHEEP"
    },
    {
      "index": 18,
      "position": "Row 5 - Position 3 (Bottom)",
      "resource": 4,
      "resourceName": "ORE"
    }
  ]
}
```

## Catálogo de Valores

### Compañías (company)
- `0` - ANTHROPIC
- `1` - GOOGLE
- `2` - OPENAI
- `3` - XAI
- `4` - DEEPSEEK

### Modelos (modelIndex)
- `0` - anthropic/claude-haiku-4.5
- `1` - anthropic/claude-sonnet-4.5
- `2` - google/gemini-2.5-flash-lite
- `3` - google/gemini-2.5-flash
- `4` - openai/gpt-5
- `5` - openai/gpt-5-codex
- `6` - xai/grok-4
- `7` - xai/grok-4-fast-reasoning
- `8` - deepseek/deepseek-v3.2-exp-thinking
- `9` - deepseek/deepseek-v3.2-exp

### Recursos (resource)
- `0` - WOOD (4 en el tablero)
- `1` - SHEEP (4 en el tablero)
- `2` - WHEAT (4 en el tablero)
- `3` - BRICK (3 en el tablero)
- `4` - ORE (3 en el tablero)
- `5` - DESERT (1 en el tablero)

### Estados del Juego (status)
- `0` - PENDING_RANDOMNESS: Esperando VRF
- `1` - ACTIVE: Juego en progreso
- `2` - FINISHED: Juego completado
- `3` - CANCELLED: Juego cancelado

## Notas Importantes

1. **Siempre habrá 4 jugadores IA** (`aiPlayers` array length = 4)
2. **Siempre habrá 19 hexágonos** (`board` array length = 19)
3. **El tablero se genera aleatoriamente** siguiendo las reglas estándar de Catan
4. **Cada juego excluye una compañía** aleatoriamente (solo 4 de las 5 compañías participan)
5. **Los valores numéricos y nombres están incluidos** para facilitar tanto el procesamiento como la visualización
