'use client';

import { useState, useEffect, use } from 'react';
import { GameState } from '@/lib/types';
import { CatanBoardWithBuildings } from '@/components/catan-board-with-buildings';
import { PlayerPanel } from '@/components/player-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default function LiveGamePage({ params }: PageProps) {
  const { gameId } = use(params);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameState();
    const interval = setInterval(loadGameState, 1000);
    return () => clearInterval(interval);
  }, [gameId]);

  async function loadGameState() {
    try {
      console.log('Loading game state for:', gameId);
      const response = await fetch(`/api/game/${gameId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Game state loaded:', data.state.turn);
        setGameState(data.state);
        setLoading(false);
      } else {
        console.error('Failed to load game:', response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8 flex items-center justify-center">
        <div className="text-2xl">Loading game...</div>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Game ID: {gameId}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🤖 AI Battle - Turn {gameState.turn}</h1>
            <p className="text-sm text-muted-foreground">Game ID: {gameId}</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Phase: {gameState.phase.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Players Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Players</h2>
            {gameState.players.map((player, index) => (
              <PlayerPanel
                key={player.id}
                player={player}
                isCurrentPlayer={index === gameState.currentPlayerIndex}
              />
            ))}
          </div>

          {/* Board */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Catan Board - Live Game</CardTitle>
              </CardHeader>
              <CardContent>
                <CatanBoardWithBuildings gameState={gameState} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

