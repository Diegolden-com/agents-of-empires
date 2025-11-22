import { NextResponse } from 'next/server';
import { listGames } from '@/lib/game-store';
import { getCurrentPlayer } from '@/lib/game-engine';

export async function GET() {
  const games = listGames();

  const gameList = games.map((game) => ({
    id: game.id,
    players: game.state.players.map((p) => ({
      name: p.name,
      color: p.color,
      victoryPoints: p.victoryPoints,
    })),
    phase: game.state.phase,
    turn: game.state.turn,
    currentPlayer: getCurrentPlayer(game.state).name,
    createdAt: game.createdAt,
    lastActivity: game.lastActivity,
  }));

  return NextResponse.json({ games: gameList });
}

