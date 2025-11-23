'use client';

import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { CatanBoardWithBuildings } from '@/components/catan-board-with-buildings';
import { PlayerPanel } from '@/components/player-panel';
import { GameControls } from '@/components/game-controls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export default function HomePage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);

  async function createGame(playerNames: string[]) {
    setLoading(true);
    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: playerNames }),
      });

      const data = await response.json();
      setGameId(data.gameId);
      await loadGameState(data.gameId);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadGameState(id: string) {
    try {
      const response = await fetch(`/api/game/${id}`);
      const data = await response.json();
      setGameState(data.state);
    } catch (error) {
      console.error('Error loading game:', error);
    }
  }

  async function handleAction(action: any) {
    if (!gameId || !gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    try {
      const response = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerId: currentPlayer.id,
          action,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload game state after action
        await loadGameState(gameId);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  }

  function startNewGame() {
    const playerNames = [
      'Jugador Humano',
      'Agent GPT-4',
      'Agent Claude',
    ];
    createGame(playerNames);
  }

  if (!gameState) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                🎲 Catán
              </h1>
              <p className="text-2xl text-gray-600 mb-2">
                LLM Agent Battle Edition
              </p>
              <p className="text-gray-500">
                Donde agentes de IA compiten por dominar la isla
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6" />
                  Comenzar Nueva Partida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Juega contra agentes LLM o deja que los agentes jueguen entre ellos.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={startNewGame}
                    disabled={loading}
                    size="lg"
                    className="w-full"
                  >
                    <Sparkles className="mr-2" />
                    {loading ? 'Creando juego...' : 'Iniciar Juego (3 Jugadores)'}
                  </Button>

                  <Button
                    onClick={() => window.location.href = '/ai-battle'}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    🤖 Ver Batalla de AI Agents
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
                  <p className="font-semibold">Características:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tablero hexagonal clásico de Catán</li>
                    <li>Sistema completo de recursos y construcción</li>
                    <li>Interfaz visual moderna con Tailwind + Shadcn</li>
                    <li>API REST para agentes LLM externos</li>
                    <li>Juego para 2-4 jugadores</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎲 Catán - Turno {gameState.turn}</h1>
            <Button
              variant="link"
              onClick={() => window.location.href = '/ai-battle'}
              className="text-sm"
            >
              🤖 Ver Batalla de AI
            </Button>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Nueva Partida
          </Button>
        </div>

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

            {/* Game Controls */}
            <GameControls gameState={gameState} onAction={handleAction} />
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
                Ganador: <strong>{gameState.players.find(p => p.victoryPoints >= 10)?.name}</strong>
              </p>
              <Button onClick={() => window.location.reload()}>
                Jugar de Nuevo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
    </>
  );
}

