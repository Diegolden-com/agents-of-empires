/**
 * Servicio para gestionar nonces incrementales por agente
 *
 * Cada agente tiene su propio contador de nonce que se incrementa
 * con cada transacción firmada. Esto es crítico para validación en blockchain.
 */

interface NonceState {
  currentNonce: number;
  lastUpdated: number;
}

// Store en memoria de nonces por agente
const agentNonces = new Map<string, NonceState>();

/**
 * Obtiene el próximo nonce para un agente y lo incrementa automáticamente
 */
export function getNextNonce(agentAddress: string): number {
  const state = agentNonces.get(agentAddress);

  if (!state) {
    // Primera vez que este agente firma algo
    const initialNonce = 0;
    agentNonces.set(agentAddress, {
      currentNonce: initialNonce + 1,
      lastUpdated: Date.now()
    });
    console.log(`📊 Initialized nonce for ${agentAddress.substring(0, 10)}... → ${initialNonce}`);
    return initialNonce;
  }

  // Incrementar y retornar
  const nextNonce = state.currentNonce;
  agentNonces.set(agentAddress, {
    currentNonce: nextNonce + 1,
    lastUpdated: Date.now()
  });

  console.log(`📊 Nonce for ${agentAddress.substring(0, 10)}... → ${nextNonce} (next: ${nextNonce + 1})`);
  return nextNonce;
}

/**
 * Obtiene el nonce actual sin incrementarlo (solo lectura)
 */
export function getCurrentNonce(agentAddress: string): number {
  const state = agentNonces.get(agentAddress);
  return state ? state.currentNonce : 0;
}

/**
 * Resetea el nonce de un agente (útil para testing o nuevo juego)
 */
export function resetNonce(agentAddress: string): void {
  agentNonces.delete(agentAddress);
  console.log(`🔄 Reset nonce for ${agentAddress.substring(0, 10)}...`);
}

/**
 * Resetea todos los nonces (útil al iniciar un nuevo juego)
 */
export function resetAllNonces(): void {
  const count = agentNonces.size;
  agentNonces.clear();
  console.log(`🔄 Reset all nonces (${count} agents)`);
}

/**
 * Obtiene el estado de todos los nonces (para debugging)
 */
export function getAllNonces(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [address, state] of agentNonces.entries()) {
    result[address] = state.currentNonce;
  }
  return result;
}

/**
 * Limpia nonces antiguos (más de 1 hora sin usar)
 */
export function cleanOldNonces(): void {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  let cleaned = 0;

  for (const [address, state] of agentNonces.entries()) {
    if (state.lastUpdated < oneHourAgo) {
      agentNonces.delete(address);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} old nonce entries`);
  }
}

// Limpiar nonces viejos cada hora
setInterval(cleanOldNonces, 60 * 60 * 1000);
