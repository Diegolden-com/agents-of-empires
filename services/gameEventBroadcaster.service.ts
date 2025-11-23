/**
 * Servicio para broadcast de eventos del juego en tiempo real
 * Permite que múltiples clientes (frontend) escuchen eventos de un juego
 */

type GameEventListener = (event: any) => void;

interface GameEventStore {
  listeners: Set<GameEventListener>;
  events: any[];
  lastActivity: number;
}

// Store global de eventos por gameId
const gameEvents = new Map<string, GameEventStore>();

/**
 * Registra un listener para un juego específico
 */
export function addGameListener(gameId: string, listener: GameEventListener): void {
  // Normalizar gameId a string para evitar problemas de tipo
  const normalizedGameId = String(gameId);
  let store = gameEvents.get(normalizedGameId);

  if (!store) {
    store = {
      listeners: new Set(),
      events: [],
      lastActivity: Date.now()
    };
    gameEvents.set(normalizedGameId, store);
    console.log(`📝 Created new event store for game ${normalizedGameId}`);
  } else {
    console.log(`📋 Found existing event store for game ${normalizedGameId} with ${store.events.length} events`);
  }

  store.listeners.add(listener);
  store.lastActivity = Date.now();

  console.log(`👂 Listener added for game ${normalizedGameId} (total: ${store.listeners.size}, events in store: ${store.events.length})`);

  // Enviar eventos históricos al nuevo listener
  // Hacer una copia de los eventos para evitar problemas de sincronización
  const historicalEvents = [...store.events];
  
  if (historicalEvents.length > 0) {
    console.log(`📦 Sending ${historicalEvents.length} historical events to new listener (game ${normalizedGameId})`);
    // Enviar eventos históricos inmediatamente, pero con un pequeño delay
    // para asegurar que el stream SSE esté completamente inicializado
    setImmediate(() => {
      historicalEvents.forEach((event, index) => {
        console.log(`  📨 Historical event ${index + 1}/${historicalEvents.length}: ${event.type}`);
        try {
          listener(event);
        } catch (error) {
          console.error(`❌ Error sending historical event ${index + 1} to listener:`, error);
        }
      });
      console.log(`✅ Finished sending ${historicalEvents.length} historical events`);
    });
  } else {
    console.log(`📭 No historical events to send for game ${normalizedGameId} (store has ${store.events.length} events)`);
    // Debug: mostrar todos los gameIds en el store
    console.log(`🔍 Debug: All gameIds in store:`, Array.from(gameEvents.keys()));
    console.log(`🔍 Debug: Looking for gameId: "${normalizedGameId}" (type: ${typeof normalizedGameId})`);
  }
}

/**
 * Remueve un listener de un juego
 */
export function removeGameListener(gameId: string, listener: GameEventListener): void {
  const normalizedGameId = String(gameId);
  const store = gameEvents.get(normalizedGameId);

  if (store) {
    store.listeners.delete(listener);
    console.log(`👋 Listener removed for game ${normalizedGameId} (remaining: ${store.listeners.size})`);

    // Limpiar el store si no hay listeners
    if (store.listeners.size === 0) {
      // Mantener eventos por 5 minutos después del último listener
      setTimeout(() => {
        const currentStore = gameEvents.get(normalizedGameId);
        if (currentStore && currentStore.listeners.size === 0) {
          gameEvents.delete(normalizedGameId);
          console.log(`🧹 Cleaned up game ${normalizedGameId} event store`);
        }
      }, 5 * 60 * 1000);
    }
  }
}

/**
 * Broadcast de un evento a todos los listeners de un juego
 */
export function broadcastGameEvent(gameId: string, event: any): void {
  // Normalizar gameId a string para evitar problemas de tipo
  const normalizedGameId = String(gameId);
  const store = gameEvents.get(normalizedGameId);

  if (!store) {
    // Si no hay listeners, crear store y guardar el evento
    const newStore: GameEventStore = {
      listeners: new Set(),
      events: [event],
      lastActivity: Date.now()
    };
    gameEvents.set(normalizedGameId, newStore);
    console.log(`📝 Event "${event.type}" stored for game ${normalizedGameId} (no listeners yet, store created with 1 event)`);
    console.log(`🔍 Debug: All gameIds in store now:`, Array.from(gameEvents.keys()));
    return;
  }

  // Guardar el evento en el historial
  store.events.push(event);
  store.lastActivity = Date.now();

  // Limitar historial a últimos 500 eventos
  if (store.events.length > 500) {
    store.events = store.events.slice(-500);
  }

  console.log(`💾 Event "${event.type}" stored for game ${normalizedGameId} (total events: ${store.events.length}, listeners: ${store.listeners.size})`);

  // Broadcast a todos los listeners
  if (store.listeners.size > 0) {
    console.log(`📡 Broadcasting event "${event.type}" to ${store.listeners.size} listeners (game ${normalizedGameId})`);
    let successCount = 0;
    store.listeners.forEach(listener => {
      try {
        listener(event);
        successCount++;
      } catch (error) {
        console.error(`❌ Error in listener (game ${normalizedGameId}):`, error);
      }
    });
    console.log(`✅ Successfully sent to ${successCount}/${store.listeners.size} listeners`);
  } else {
    console.log(`⚠️ No listeners for event "${event.type}" (game ${normalizedGameId}), event stored for later (total: ${store.events.length})`);
  }
}

/**
 * Obtiene el historial de eventos de un juego
 */
export function getGameEvents(gameId: string): any[] {
  const store = gameEvents.get(gameId);
  return store ? [...store.events] : [];
}

/**
 * Limpia juegos inactivos (más de 1 hora sin actividad)
 */
function cleanInactiveGames(): void {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  let cleaned = 0;

  for (const [gameId, store] of gameEvents.entries()) {
    if (store.lastActivity < oneHourAgo && store.listeners.size === 0) {
      gameEvents.delete(gameId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} inactive game event stores`);
  }
}

// Limpiar cada hora
setInterval(cleanInactiveGames, 60 * 60 * 1000);

/**
 * Obtiene estadísticas de broadcasting
 */
export function getBroadcastStats(): Record<string, any> {
  const stats: Record<string, any> = {};

  for (const [gameId, store] of gameEvents.entries()) {
    stats[gameId] = {
      listeners: store.listeners.size,
      events: store.events.length,
      lastActivity: new Date(store.lastActivity).toISOString()
    };
  }

  return stats;
}

/**
 * Obtiene un resumen de juegos activos recientes (para debugging o auto-reconexión)
 */
export function getActiveGameSummaries(maxAgeMs: number = 60 * 60 * 1000): Array<{
  gameId: string;
  listeners: number;
  events: number;
  lastActivity: number;
  lastEventType?: string;
  lastEventTimestamp?: number;
}> {
  const cutoff = Date.now() - maxAgeMs;

  return Array.from(gameEvents.entries())
    .filter(([, store]) => store.lastActivity >= cutoff && store.events.length > 0)
    .map(([gameId, store]) => {
      const lastEvent = store.events[store.events.length - 1];
      return {
        gameId,
        listeners: store.listeners.size,
        events: store.events.length,
        lastActivity: store.lastActivity,
        lastEventType: lastEvent?.type,
        lastEventTimestamp: lastEvent?.timestamp
      };
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);
}
