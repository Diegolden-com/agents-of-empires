import { NextRequest, NextResponse } from 'next/server';
import { getGame } from '@/lib/game-store';

interface RouteParams {
  params: Promise<{
    gameId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { gameId } = await params;

  console.log(`🔍 GET /api/game/${gameId}`);
  
  // Importar listGames para debug
  const { listGames } = await import('@/lib/game-store');
  const allGames = listGames();
  console.log(`   Total games in store: ${allGames.length}`);
  if (allGames.length > 0) {
    console.log(`   Available game IDs:`, allGames.map(g => g.id));
  }
  
  const game = getGame(gameId);
  if (!game) {
    console.error(`❌ Game not found: ${gameId}`);
    console.error(`   This might be a timing issue or the game was deleted`);
    return NextResponse.json(
      { 
        error: 'Game not found',
        gameId,
        message: `No game found with ID: ${gameId}`,
        availableGames: allGames.map(g => g.id),
      }, 
      { status: 404 }
    );
  }

  console.log(`✅ Game found: ${game.id}, phase: ${game.state.phase}`);
  
  return NextResponse.json({
    id: game.id,
    state: game.state,
    createdAt: game.createdAt,
    lastActivity: game.lastActivity,
  });
}

