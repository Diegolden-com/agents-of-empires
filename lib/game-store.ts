// In-memory game store for managing active games

import { GameState } from './types';

export interface GameSession {
  id: string;
  state: GameState;
  createdAt: Date;
  lastActivity: Date;
}

const games = new Map<string, GameSession>();

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

export function getGame(gameId: string): GameSession | undefined {
  console.log(`Getting game ${gameId}, available games:`, Array.from(games.keys()));
  return games.get(gameId);
}

export function updateGame(gameId: string, state: GameState): void {
  const game = games.get(gameId);
  if (game) {
    game.state = state;
    game.lastActivity = new Date();
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

