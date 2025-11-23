import { NextRequest, NextResponse } from 'next/server';
import { createGameFromBlockchain } from '@/lib/game-engine';
import { createBlockchainGameSession } from '@/lib/game-store';

/**
 * Endpoint para iniciar un juego desde el smart contract de Chainlink CRE
 * Recibe el payload con la configuración del juego desde el blockchain
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validar payload requerido
    if (!payload.gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    if (!payload.aiPlayers || !Array.isArray(payload.aiPlayers) || payload.aiPlayers.length !== 4) {
      return NextResponse.json(
        { error: 'aiPlayers array with 4 players is required' },
        { status: 400 }
      );
    }

    if (!payload.board || !Array.isArray(payload.board) || payload.board.length !== 19) {
      return NextResponse.json(
        { error: 'board array with 19 hexes is required' },
        { status: 400 }
      );
    }

    console.log('🔗 Creating game from blockchain:', payload.gameId);
    console.log('📊 AI Players:', payload.aiPlayers.map((p: any) => `${p.modelName} (Order: ${p.playOrder})`));
    console.log('🎲 Board configuration:', payload.board.length, 'hexes');

    // Crear el estado del juego con la configuración del blockchain
    const gameState = createGameFromBlockchain(payload);
    
    // Crear sesión con metadatos del blockchain
    const sessionGameId = createBlockchainGameSession(payload.gameId, gameState, {
      bettor: payload.bettor,
      deposit: payload.deposit,
      bettorChoice: payload.bettorChoice,
      requestId: payload.requestId,
      startTime: payload.startTime,
      status: payload.status,
    });

    // Verificar que el juego se creó correctamente
    const { getGame, listGames } = await import('@/lib/game-store');
    const verifyGame = getGame(sessionGameId);
    const allGames = listGames();
    
    console.log(`✅ Game creation verification:`);
    console.log(`   Session Game ID: ${sessionGameId}`);
    console.log(`   Game exists: ${verifyGame ? 'YES' : 'NO'}`);
    console.log(`   Total games in store: ${allGames.length}`);
    if (allGames.length > 0) {
      console.log(`   All game IDs:`, allGames.map(g => g.id));
    }

    if (!verifyGame) {
      console.error(`❌ CRITICAL: Game was not created! sessionGameId=${sessionGameId}`);
      return NextResponse.json(
        { error: 'Failed to create game session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gameId: sessionGameId,
      blockchainGameId: payload.gameId,
      message: 'Game created from blockchain successfully',
      gameUrl: `/game/${sessionGameId}`, // URL directa para acceder al juego
      players: gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
      })),
      metadata: {
        bettor: payload.bettor,
        deposit: payload.deposit,
        bettorChoice: payload.bettorChoice,
      },
      // Información del estado inicial del juego
      gameState: {
        phase: gameState.phase,
        turn: gameState.turn,
        currentPlayer: gameState.players[gameState.currentPlayerIndex].name,
      },
    });
  } catch (error) {
    console.error('❌ Error creating game from blockchain:', error);
    return NextResponse.json(
      { error: `Failed to create game: ${error}` },
      { status: 500 }
    );
  }
}

