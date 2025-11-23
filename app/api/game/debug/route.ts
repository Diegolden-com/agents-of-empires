import { NextRequest, NextResponse } from 'next/server';
import { listGames } from '@/lib/game-store';

/**
 * Endpoint de debug para ver todos los juegos activos
 * Útil para diagnosticar problemas de "juego no encontrado"
 */
export async function GET(request: NextRequest) {
  try {
    const games = listGames();
    
    return NextResponse.json({
      totalGames: games.length,
      games: games.map(game => ({
        id: game.id,
        phase: game.state.phase,
        turn: game.state.turn,
        players: game.state.players.length,
        createdAt: game.createdAt.toISOString(),
        lastActivity: game.lastActivity.toISOString(),
        isBlockchain: game.id.startsWith('blockchain_'),
        blockchainGameId: game.blockchainMetadata?.gameId,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error}` },
      { status: 500 }
    );
  }
}

