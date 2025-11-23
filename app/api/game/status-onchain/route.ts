import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const GAME_CONTROLLER_ABI = [
  "function getGameStatus(uint256 gameId) external view returns (uint8)",
  "function getGameResult(uint256 gameId) external view returns (uint8 winner, uint256 duration)"
];

/**
 * GET /api/game/status-onchain?gameId=X
 * Verifica el estado del juego en el contrato de blockchain
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get('gameId');

    if (!gameIdParam) {
      return NextResponse.json(
        { error: 'gameId parameter is required' },
        { status: 400 }
      );
    }

    const gameId = parseInt(gameIdParam, 10);
    if (isNaN(gameId)) {
      return NextResponse.json(
        { error: 'Invalid gameId' },
        { status: 400 }
      );
    }

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL,
      {
        chainId: 84532,
        name: 'base-sepolia'
      },
      { staticNetwork: true }
    );

    const gameControllerAddress = process.env.GAME_CONTROLLER_ADDRESS;
    if (!gameControllerAddress || !ethers.isAddress(gameControllerAddress)) {
      return NextResponse.json(
        { error: 'Invalid GAME_CONTROLLER_ADDRESS configuration' },
        { status: 500 }
      );
    }

    const gameController = new ethers.Contract(
      gameControllerAddress,
      GAME_CONTROLLER_ABI,
      provider
    );

    // Get game status from contract
    const status = await gameController.getGameStatus(gameId);

    // Status enum: 0=PENDING_RANDOMNESS, 1=ACTIVE, 2=FINISHED, 3=CANCELLED
    const statusMap: Record<number, string> = {
      0: 'PENDING_RANDOMNESS',
      1: 'ACTIVE',
      2: 'FINISHED',
      3: 'CANCELLED'
    };

    const statusName = statusMap[Number(status)] || 'UNKNOWN';

    let winner = null;
    let duration = null;

    // If game is finished, get the result
    if (Number(status) === 2) {
      const result = await gameController.getGameResult(gameId);
      winner = Number(result.winner);
      duration = Number(result.duration);
    }

    return NextResponse.json({
      gameId,
      status: Number(status),
      statusName,
      isFinished: Number(status) === 2,
      winner,
      duration
    });

  } catch (error: any) {
    console.error('Error getting game status from blockchain:', error);
    return NextResponse.json(
      { error: 'Failed to get game status', details: error.message },
      { status: 500 }
    );
  }
}
