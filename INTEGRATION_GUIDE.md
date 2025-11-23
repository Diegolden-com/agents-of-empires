# Guía de Integración - Sistema de Firma y Almacenamiento

Esta guía explica cómo integrar el sistema de firma de transacciones y almacenamiento en Supabase.

## 📋 Resumen de Componentes

### 1. **Wallets de Agentes** (`scripts/generate-agent-wallets.ts`)
Script para generar wallets únicas para cada agente.

**Uso:**
```bash
yarn tsx scripts/generate-agent-wallets.ts
```

Esto genera:
- `.wallets/agent-wallets.env` - Variables de entorno con private keys
- `.wallets/agent-wallets.json` - Backup en JSON
- `lib/agent-addresses.ts` - Direcciones públicas

**Siguiente paso:** Copiar las variables de entorno a tu `.env`

### 2. **Servicios Creados**

#### `services/agentSigner.service.ts`
- Firma mensajes con EIP-191
- Gestiona wallets de agentes
- Genera nonces únicos

#### `services/moveEncoder.service.ts`
- Encodea datos según el formato del smart contract
- Soporta todos los tipos de acciones

#### `services/gameMoves.service.ts`
- CRUD para la tabla `game_moves`

#### `services/games.service.ts`
- CRUD para la tabla `games`

#### `services/gameActionIntegrator.service.ts`
- Servicio coordinador que usa todos los anteriores
- Simplifica la integración

### 3. **Tablas de Supabase**

#### Tabla `game_moves` (ya existe)
Almacena cada movimiento individual.

#### Tabla `games` (nueva - ejecutar migración)
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: app/utils/supabase/migrations/0002_create_games_table.sql
```

Almacena metadata del juego completo.

## 🔧 Integración en `/api/game/play-ai`

### Modificaciones Necesarias

#### 1. Recibir `gameId` de blockchain

```typescript
// ANTES
const body = await req.json();
const { agentIds, llmConfigs } = body;

// DESPUÉS
const body = await req.json();
const { gameId, agentIds, llmConfigs, bettorAddress, bettorChoice } = body;

if (!gameId || typeof gameId !== 'number') {
  send({ type: 'error', message: 'gameId (number) is required' });
  controller.close();
  return;
}
```

#### 2. Inicializar el juego en Supabase

```typescript
import { getGameActionIntegrator } from '@/services/gameActionIntegrator.service';

// AGREGAR después de crear el gameState (línea ~108)
const integrator = getGameActionIntegrator();

// Inicializar el juego en la base de datos
await integrator.initializeGame(
  gameId,
  agentIds,
  bettorAddress,
  bettorChoice
);
```

#### 3. Guardar cada acción ejecutada

```typescript
// AGREGAR después de executeAgentAction (línea ~222)
const result = executeAgentAction(gameState, currentPlayer.id, {
  type: decision.action,
  data: decision.data,
});

// ✨ NUEVO: Guardar la acción en Supabase
if (result.success) {
  try {
    await integrator.processAndSaveAction(
      gameId,
      agentIds[gameState.currentPlayerIndex],
      {
        type: decision.action,
        data: decision.data
      },
      gameState.currentPlayerIndex
    );
  } catch (error) {
    console.error('Error saving action to database:', error);
    // Continuar el juego incluso si falla el guardado
  }
}
```

#### 4. Guardar el ganador al finalizar

```typescript
// AGREGAR cuando hay un ganador (línea ~286)
if (winner) {
  const winnerAgent = agentConfigs[gameState.players.indexOf(winner)];

  // ✨ NUEVO: Guardar el ganador en la base de datos
  try {
    await integrator.finishGame(
      gameId,
      agentIds[gameState.players.indexOf(winner)],
      gameState.players.indexOf(winner),
      gameState.turn
    );
  } catch (error) {
    console.error('Error finishing game in database:', error);
  }

  send({
    type: 'victory',
    winner: {
      id: winner.id,
      name: winner.name,
      victoryPoints: winner.victoryPoints,
      agentName: winnerAgent?.name,
    },
    // ... resto del código
  });
}
```

#### 5. Actualizar contadores de turnos (opcional)

```typescript
// AGREGAR al inicio del loop (línea ~145)
while (turnCount < maxTurns) {
  // ... código existente

  // ✨ NUEVO: Actualizar contador cada 10 turnos
  if (gameState.turn % 10 === 0) {
    try {
      await integrator.updateTurnCount(gameId, gameState.turn);
    } catch (error) {
      console.error('Error updating turn count:', error);
    }
  }
}
```

## 🔑 Variables de Entorno Necesarias

Agregar a `.env`:

```bash
# Agent Wallets
AGENT_CONQUISTADOR_PRIVATE_KEY=0x...
AGENT_MERCHANT_PRIVATE_KEY=0x...
AGENT_ARCHITECT_PRIVATE_KEY=0x...
AGENT_GAMBLER_PRIVATE_KEY=0x...

# Supabase (si no están ya)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Fisher (para procesar transacciones)
FISHER_PRIVATE_KEY=0x...
RPC_URL=https://your-rpc-url
GAME_MOVE_SERVICE_ADDRESS=0x...
```

## 🚀 Flujo Completo

```
1. Usuario inicia juego con gameId de blockchain
   └─ POST /api/game/play-ai { gameId: 123, agentIds: [...] }

2. API inicializa el juego en Supabase
   └─ Crea registro en tabla 'games'

3. Loop del juego:
   ├─ Agente decide acción (LLM)
   ├─ Ejecuta acción en game state
   ├─ Encodea los datos (abi.encode)
   ├─ Firma con wallet del agente (EIP-191)
   └─ Guarda en tabla 'game_moves' (status: pending)

4. Fisher procesa en background
   └─ POST /api/fisher/process
   └─ Lee moves pendientes
   └─ Envía a blockchain
   └─ Actualiza status (completed/failed)

5. Juego termina
   └─ Actualiza tabla 'games' con ganador
```

## 📊 Consultas Útiles

### Ver movimientos de un juego
```typescript
const integrator = getGameActionIntegrator();
const moves = await integrator.getGameMoves(gameId);
```

### Ver información del juego
```typescript
const game = await integrator.getGame(gameId);
console.log('Winner:', game.winner_agent);
console.log('Total moves:', game.total_moves);
```

### Ver estadísticas de un agente
```typescript
const gamesService = new GamesService();
const stats = await gamesService.getAgentStats('0x...');
console.log('Win rate:', stats.winRate);
```

## 🐛 Debugging

### Ver mensajes firmados
```typescript
import { buildMessageToSign } from '@/services/agentSigner.service';

const message = buildMessageToSign({
  gameId: 123,
  agent: '0x...',
  moveType: 'BUILD_ROAD',
  data: '0x...',
  nonce: 123
});
console.log('Message:', message);
```

### Decodear datos
```typescript
import { decodeData } from '@/services/moveEncoder.service';

const decoded = decodeData('BUILD_ROAD', '0x...');
console.log('Edge ID:', decoded);
```

## ⚠️ Consideraciones de Seguridad

1. **NUNCA** commitees las private keys
2. Las wallets de agentes deben tener fondos SOLO para gas
3. Usa variables de entorno para todas las keys
4. El directorio `.wallets/` está en `.gitignore`

## 📝 Próximos Pasos

1. ✅ Generar wallets: `yarn tsx scripts/generate-agent-wallets.ts`
2. ✅ Copiar variables al `.env`
3. ✅ Ejecutar migración SQL en Supabase
4. ✅ Modificar `/api/game/play-ai` según esta guía
5. ⏳ Probar con un juego de prueba
6. ⏳ Configurar Fisher para procesar en background

## 🔄 Fisher Processing

El endpoint `/api/fisher/process` ya está implementado y listo.

Puedes configurarlo para ejecutarse:
- **Manualmente**: `POST /api/fisher/process`
- **Con cron job**: Configurar en Vercel/Railway
- **Con Supabase Edge Functions**: Trigger cada N segundos

Ejemplo de cron (Vercel):
```json
{
  "crons": [
    {
      "path": "/api/fisher/process",
      "schedule": "*/30 * * * *"
    }
  ]
}
```
