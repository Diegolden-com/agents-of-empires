'use client';

import { useState, useEffect } from 'react';
import { CATAN_AGENTS } from '@/lib/agent-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Zap, Brain, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { CatanBoardWithBuildings } from '@/components/catan-board-with-buildings';

export default function AIBattlePage() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(true);

  function toggleAgent(agentId: string) {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else if (selectedAgents.length < 4) {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  }

  async function startBattle() {
    if (selectedAgents.length < 2) return;

    setGameStarted(true);
    setEvents([]);
    setGameState(null);

    try {
      const response = await fetch('/api/game/play-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: selectedAgents }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setEvents(prev => [...prev, data]);
              
              if (data.type === 'game_start') {
                if (data.gameId) setGameId(data.gameId);
                if (data.gameState) {
                  console.log('📋 Initial game state received:', data.gameState);
                  setGameState(data.gameState);
                }
              }
              
              if (data.type === 'action_result' && data.gameState) {
                console.log('♟️ Game state updated (action):', {
                  turn: data.gameState.turn,
                  phase: data.gameState.phase,
                  players: data.gameState.players?.length || 0,
                });
                setGameState(data.gameState);
              }
              
              if (data.type === 'turn_start' && data.gameState) {
                console.log('🔄 Game state updated (turn):', {
                  turn: data.gameState.turn,
                  phase: data.gameState.phase,
                });
                setGameState(data.gameState);
              }
              
              if (data.type === 'victory' && data.gameState) {
                setGameState(data.gameState);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Battle error:', error);
      setEvents(prev => [...prev, { type: 'error', message: `Error: ${error}` }]);
    }
  }

  function getStrategyIcon(style: string) {
    switch (style) {
      case 'AGGRESSIVE_EXPANSION': return <Zap className="w-4 h-4" />;
      case 'BALANCED_TRADER': return <Sparkles className="w-4 h-4" />;
      case 'DEFENSIVE_BUILDER': return <Shield className="w-4 h-4" />;
      case 'OPPORTUNISTIC': return <Brain className="w-4 h-4" />;
      default: return null;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🤖 AI Agent Battle Arena
          </h1>
          <p className="text-xl text-gray-600">
            Watch AI agents compete in Settlers of Catan
          </p>
        </div>

        {!gameStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Selection */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Agents (2-4)</CardTitle>
                  <CardDescription>
                    Choose which AI personalities will compete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CATAN_AGENTS.map((agent) => (
                    <Card
                      key={agent.id}
                      className={`cursor-pointer transition-all ${
                        selectedAgents.includes(agent.id)
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {getStrategyIcon(agent.strategyStyle)}
                                {agent.strategyStyle.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <CardDescription className="text-sm">
                              {agent.personality}
                            </CardDescription>
                          </div>
                          {selectedAgents.includes(agent.id) && (
                            <div className="ml-2 text-blue-600">✓</div>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Button
                onClick={startBattle}
                disabled={selectedAgents.length < 2}
                size="lg"
                className="w-full"
              >
                <Play className="mr-2" />
                Start Battle ({selectedAgents.length} agents selected)
              </Button>
            </div>

            {/* Agent Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAgents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Select 2-4 agents to begin
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedAgents.map((agentId) => {
                        const agent = CATAN_AGENTS.find(a => a.id === agentId);
                        if (!agent) return null;

                        return (
                          <Card key={agent.id}>
                            <CardHeader>
                              <CardTitle className="text-base">{agent.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                              <div>
                                <strong>Goals:</strong>
                                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                  {agent.goals.slice(0, 2).map((goal, i) => (
                                    <li key={i}>{goal}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <strong>Tone:</strong> {agent.toneOfVoice}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Board Integrated */}
            {gameId && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Board */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle>Tablero de Catán</CardTitle>
                      <Badge variant="secondary">Turno {gameState?.turn || 0}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {gameState ? (
                      <CatanBoardWithBuildings gameState={gameState} />
                    ) : (
                      <div className="h-96 flex items-center justify-center text-muted-foreground">
                        Cargando tablero...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Events Feed - Compact */}
                <div className="space-y-4">
                  <Card className="h-[calc(100vh-12rem)]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Eventos del Juego</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEventDetails(!showEventDetails)}
                        >
                          {showEventDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {showEventDetails ? 'Compacto' : 'Detalle'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-5rem)] overflow-y-auto space-y-2">
                      {events.map((event, i) => (
                        <CompactEventCard key={i} event={event} showDetails={showEventDetails} />
                      ))}
                      {events.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Esperando eventos...
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Game Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Estado del Juego</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {gameState?.players ? (
                        <div className="space-y-2">
                          {gameState.players.map((player: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">{player.name}</div>
                                {player.buildings && (
                                  <div className="text-xs text-muted-foreground">
                                    🏠{player.buildings.settlements} 🏰{player.buildings.cities} 🛤️{player.buildings.roads}
                                  </div>
                                )}
                              </div>
                              <Badge variant={player.victoryPoints >= 10 ? 'default' : 'secondary'}>
                                {player.victoryPoints} PV
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No hay datos aún</p>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => {
                      setGameStarted(false);
                      setEvents([]);
                      setGameState(null);
                      setSelectedAgents([]);
                      setGameId(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Nueva Batalla
                  </Button>
                </div>
              </div>
            )}

            {!gameId && (
              <p className="text-center text-muted-foreground py-8">
                Iniciando juego...
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function CompactEventCard({ event, showDetails }: { event: any; showDetails: boolean }) {
  if (event.type === 'game_start') {
    return (
      <div className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-sm">
        <div className="font-semibold text-blue-900">🎮 Juego Iniciado</div>
      </div>
    );
  }

  if (event.type === 'greeting') {
    if (!showDetails) return null;
    return (
      <div className="p-2 bg-purple-50 border-l-4 border-purple-500 rounded text-sm">
        <div className="font-semibold text-purple-900">{event.playerName}</div>
        {showDetails && <div className="text-xs text-purple-700 italic">&quot;{event.message}&quot;</div>}
      </div>
    );
  }

  if (event.type === 'thinking') {
    return (
      <div className="p-2 bg-gray-50 border-l-4 border-gray-300 rounded text-sm">
        <div className="text-gray-600">🤔 {event.playerName} pensando...</div>
      </div>
    );
  }

  if (event.type === 'decision') {
    return (
      <div className="p-2 bg-green-50 border-l-4 border-green-500 rounded text-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-green-900">{event.playerName}</div>
          <Badge variant="outline" className="text-xs">{event.action}</Badge>
        </div>
        {showDetails && (
          <>
            <div className="text-xs text-green-700 mt-1">{event.message}</div>
            <div className="text-xs text-green-600 italic mt-1">→ {event.reasoning}</div>
          </>
        )}
      </div>
    );
  }

  if (event.type === 'action_result') {
    return (
      <div className={`p-2 border-l-4 rounded text-sm ${
        event.success 
          ? 'bg-emerald-50 border-emerald-500' 
          : 'bg-red-50 border-red-500'
      }`}>
        <div className="text-xs">
          {event.success ? '✅' : '❌'} {event.message}
        </div>
      </div>
    );
  }

  if (event.type === 'turn_start') {
    return (
      <div className="p-2 bg-blue-100 border-l-4 border-blue-600 rounded text-sm">
        <div className="font-semibold text-blue-900">
          ⏱️ Turno {event.turn} - {event.currentPlayer.name}
        </div>
      </div>
    );
  }

  if (event.type === 'victory') {
    return (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded">
        <div className="text-center space-y-2">
          <div className="text-2xl">🏆</div>
          <div className="font-bold text-lg text-yellow-900">
            {event.winner.name} GANA!
          </div>
          <div className="text-yellow-700 text-sm">
            {event.winner.victoryPoints} Puntos de Victoria
          </div>
        </div>
      </div>
    );
  }

  if (event.type === 'error') {
    return (
      <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded text-sm">
        <div className="text-red-700">❌ {event.message}</div>
      </div>
    );
  }

  return null;
}

function EventCard({ event }: { event: any }) {
  if (event.type === 'game_start') {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="font-semibold text-blue-900">🎮 Game Started!</div>
          <div className="text-sm text-blue-700">
            Players: {event.players?.map((p: any) => p.name).join(', ')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (event.type === 'greeting') {
    return (
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="font-semibold text-purple-900">{event.playerName}</div>
          <div className="text-sm text-purple-700 italic">&quot;{event.message}&quot;</div>
        </CardContent>
      </Card>
    );
  }

  if (event.type === 'thinking') {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            🤔 {event.playerName} is thinking...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (event.type === 'decision') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="font-semibold text-green-900">{event.playerName}</div>
          <div className="text-sm text-green-700 mb-1">
            <Badge variant="outline">{event.action}</Badge> {event.message}
          </div>
          <div className="text-xs text-green-600 italic">
            Reasoning: {event.reasoning}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (event.type === 'action_result') {
    return (
      <Card className={event.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
        <CardContent className="p-4">
          <div className="text-sm">
            {event.success ? '✅' : '❌'} {event.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (event.type === 'victory') {
    return (
      <Card className="bg-yellow-50 border-yellow-400 border-2">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="text-3xl">🏆</div>
            <div className="font-bold text-xl text-yellow-900">
              {event.winner.name} WINS!
            </div>
            <div className="text-yellow-700">
              {event.winner.victoryPoints} Victory Points
            </div>
            <div className="text-sm text-yellow-600 italic mt-2">
              &quot;{event.message}&quot;
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (event.type === 'error') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="text-sm text-red-700">❌ Error: {event.message}</div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

