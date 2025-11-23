import { NextRequest, NextResponse } from 'next/server';
import { getGame } from '@/lib/game-store';

interface RouteParams {
  params: Promise<{
    gameId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { gameId } = await params;

  const game = getGame(gameId);
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: game.id,
    state: game.state,
    createdAt: game.createdAt,
    lastActivity: game.lastActivity,
  });
}

