// In-memory game store for managing active games

import { GameState, BlockchainMetadata } from './types';

export interface GameSession {
  id: string;
  state: GameState;
  createdAt: Date;
  lastActivity: Date;
  blockchainMetadata?: BlockchainMetadata; // Metadatos adicionales del blockchain
}

const games = new Map<string, GameSession>();
const blockchainGameIdMap = new Map<string, string>(); // Mapeo de blockchain gameId a session gameId

export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function createGameSession(state: GameState): string {
  const gameId = generateGameId();
  games.set(gameId, {
    id: gameId,
    state,
    createdAt: new Date(),
    lastActivity: new Date(),
  });
  return gameId;
}

/**
 * Crea una sesión de juego desde el blockchain
 * Usa el gameId del blockchain como identificador principal
 */
export function createBlockchainGameSession(
  blockchainGameId: string,
  state: GameState,
  metadata: Omit<BlockchainMetadata, 'gameId'>
): string {
  // Usar el gameId del blockchain como identificador de sesión
  const sessionGameId = `blockchain_${blockchainGameId}`;
  
  // Guardar metadatos completos
  const fullMetadata: BlockchainMetadata = {
    gameId: blockchainGameId,
    ...metadata,
  };
  
  const gameSession: GameSession = {
    id: sessionGameId,
    state,
    createdAt: new Date(),
    lastActivity: new Date(),
    blockchainMetadata: fullMetadata,
  };
  
  games.set(sessionGameId, gameSession);
  
  // Mantener mapeo bidireccional
  blockchainGameIdMap.set(blockchainGameId, sessionGameId);
  
  // Verificar inmediatamente que se guardó
  const verify = games.get(sessionGameId);
  if (!verify) {
    console.error(`❌ CRITICAL: Game was not saved to Map! sessionGameId=${sessionGameId}`);
    throw new Error(`Failed to save game to store: ${sessionGameId}`);
  }
  
  console.log(`🔗 Blockchain game session created: ${sessionGameId}`);
  console.log(`   Blockchain Game ID: ${blockchainGameId}`);
  console.log(`   Bettor: ${metadata.bettor}`);
  console.log(`   Deposit: ${metadata.deposit}`);
  console.log(`   Total games in store: ${games.size}`);
  console.log(`   Game verified in store: ${verify ? 'YES' : 'NO'}`);
  
  return sessionGameId;
}

/**
 * Obtiene el gameId de sesión a partir del gameId del blockchain
 */
export function getSessionIdFromBlockchainId(blockchainGameId: string): string | undefined {
  return blockchainGameIdMap.get(blockchainGameId);
}

/**
 * Verifica si un juego proviene del blockchain
 */
export function isBlockchainGame(sessionGameId: string): boolean {
  return sessionGameId.startsWith('blockchain_');
}

export function getGame(gameId: string): GameSession | undefined {
  const game = games.get(gameId);
  console.log(`Getting game ${gameId}:`, game ? 'FOUND' : 'NOT FOUND');
  console.log(`   Total games in store: ${games.size}`);
  if (games.size > 0) {
    console.log(`   Available game IDs:`, Array.from(games.keys()));
  }
  return game;
}

export function updateGame(gameId: string, state: GameState): void {
  const game = games.get(gameId);
  if (game) {
    // Preservar metadatos del blockchain si existen
    const blockchainMetadata = game.blockchainMetadata;
    
    game.state = state;
    game.lastActivity = new Date();
    
    // Asegurar que los metadatos del blockchain se preserven
    if (blockchainMetadata && !state.blockchainMetadata) {
      state.blockchainMetadata = blockchainMetadata;
    }
    
    console.log(`✅ Game updated: ${gameId}, phase: ${state.phase}, games in store: ${games.size}`);
  } else {
    console.error(`❌ Cannot update game ${gameId}: game not found in store`);
    console.error(`   Available games:`, Array.from(games.keys()));
  }
}

export function deleteGame(gameId: string): void {
  games.delete(gameId);
}

export function listGames(): GameSession[] {
  return Array.from(games.values());
}

export function cleanupOldGames(maxAgeMs: number = 60 * 60 * 1000): void {
  const cutoffTime = new Date(Date.now() - maxAgeMs);
  for (const [gameId, game] of games.entries()) {
    if (game.lastActivity < cutoffTime) {
      games.delete(gameId);
    }
  }
}

