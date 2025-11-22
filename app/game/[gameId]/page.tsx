'use client';

import { useState, useEffect, use } from 'react';
import { GameState } from '@/lib/types';
import { CatanBoardWithBuildings } from '@/components/catan-board-with-buildings';
import { PlayerPanel } from '@/components/player-panel';
import { GameControls } from '@/components/game-controls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default function GamePage({ params }: PageProps) {
  const { gameId } = use(params);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameState();
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  useEffect(() => {
    if (autoPlay && gameState && gameState.phase !== 'game_over') {
      const timer = setTimeout(() => {
        playAITurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, gameState]);

  async function loadGameState() {
    try {
      const response = await fetch(`/api/game/${gameId}`);
      const data = await response.json();
      setGameState(data.state);
      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  }

  async function playAITurn() {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    try {
      const response = await fetch('/api/agent/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerId: currentPlayer.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadGameState();
      }
    } catch (error) {
      console.error('Error playing AI turn:', error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8 flex items-center justify-center">
        <div className="text-2xl">Cargando juego...</div>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Juego no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎲 Catán - Turno {gameState.turn}</h1>
            <p className="text-sm text-muted-foreground">Game ID: {gameId}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoPlay ? 'destructive' : 'default'}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pausar Auto-Play
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Auto-Play
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nueva Partida
            </Button>
          </div>
        </div>

        {autoPlay && (
          <Card className="bg-blue-50 border-blue-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Auto-Play Activado</Badge>
                <span className="text-sm text-muted-foreground">
                  Los agentes juegan automáticamente cada turno
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left sidebar - Players */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Jugadores</h2>
            {gameState.players.map((player, index) => (
              <PlayerPanel
                key={player.id}
                player={player}
                isCurrentPlayer={index === gameState.currentPlayerIndex}
              />
            ))}
          </div>

          {/* Center - Board */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tablero de Catán</CardTitle>
              </CardHeader>
              <CardContent>
                <CatanBoardWithBuildings gameState={gameState} />
              </CardContent>
            </Card>

            {/* Manual play option */}
            {!autoPlay && (
              <Card>
                <CardHeader>
                  <CardTitle>Jugar Turno Manualmente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={playAITurn} className="w-full">
                    Ejecutar Turno del Agente Actual
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Game Over */}
        {gameState.phase === 'game_over' && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                🎉 ¡Juego Terminado! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl mb-4">
                Ganador:{' '}
                <strong>
                  {gameState.players.find((p) => p.victoryPoints >= 10)?.name}
                </strong>
              </p>
              <Button onClick={() => (window.location.href = '/')}>
                Jugar de Nuevo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

