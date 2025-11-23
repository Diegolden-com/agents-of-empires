'use client';

import { useState, useEffect } from 'react';
import { CATAN_AGENTS, type LLMConfig } from '@/lib/agent-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Zap, Brain, Shield, Sparkles, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { CatanBoardWithBuildings } from '@/components/catan-board-with-buildings';
import { ResourceLog } from '@/components/resource-log';
import { Navbar } from '@/components/navbar';

// ✨ Configuraciones de LLM disponibles
const LLM_OPTIONS: Record<string, { label: string; models: { value: string; label: string; cost: string }[] }> = {
  openai: {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o (Más capaz)', cost: '💰💰💰' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Económico)', cost: '💰' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', cost: '💰💰💰' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Muy económico)', cost: '💰' },
    ],
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Mejor)', cost: '💰💰💰💰' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Rápido)', cost: '💰' },
    ],
  },
  google: {
    label: 'Google (Gemini)',
    models: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', cost: '💰💰💰' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Muy rápido)', cost: '💰' },
    ],
  },
  mistral: {
    label: 'Mistral',
    models: [
      { value: 'mistral-large-latest', label: 'Mistral Large', cost: '💰💰💰' },
      { value: 'mistral-small-latest', label: 'Mistral Small', cost: '💰' },
    ],
  },
};

export default function AIBattlePage() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentLLMConfigs, setAgentLLMConfigs] = useState<Record<string, LLMConfig>>({});
  const [gameStarted, setGameStarted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(true);
  const [showLLMConfig, setShowLLMConfig] = useState(false);

  function toggleAgent(agentId: string) {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
      // Limpiar configuración de LLM
      const newConfigs = { ...agentLLMConfigs };
      delete newConfigs[agentId];
      setAgentLLMConfigs(newConfigs);
    } else if (selectedAgents.length < 4) {
      setSelectedAgents([...selectedAgents, agentId]);
      // Inicializar con configuración por defecto del agente
      const agent = CATAN_AGENTS.find(a => a.id === agentId);
      if (agent) {
        setAgentLLMConfigs({
          ...agentLLMConfigs,
          [agentId]: agent.llmConfig,
        });
      }
    }
  }

  function updateAgentLLM(agentId: string, provider: string, model: string) {
    setAgentLLMConfigs({
      ...agentLLMConfigs,
      [agentId]: {
        provider: provider as any,
        model,
        temperature: agentLLMConfigs[agentId]?.temperature ?? 0.7,
        maxTokens: agentLLMConfigs[agentId]?.maxTokens ?? 300,
      },
    });
  }

  function updateAgentTemperature(agentId: string, temperature: number) {
    if (agentLLMConfigs[agentId]) {
      setAgentLLMConfigs({
        ...agentLLMConfigs,
        [agentId]: {
          ...agentLLMConfigs[agentId],
          temperature,
        },
      });
    }
  }

  async function startBattle() {
    if (selectedAgents.length < 2) return;

    setGameStarted(true);
    setEvents([]);
    setGameState(null);

    try {
      // ✨ Enviar configuraciones personalizadas de LLM
      const response = await fetch('/api/game/play-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentIds: selectedAgents,
          llmConfigs: agentLLMConfigs, // ✨ Configuraciones personalizadas
        }),
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
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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

              {/* Quick Presets */}
              {selectedAgents.length >= 2 && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">⚡ Quick Presets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const configs: Record<string, any> = {};
                        selectedAgents.forEach(id => {
                          configs[id] = {
                            provider: 'openai',
                            model: 'gpt-4o-mini',
                            temperature: 0.7,
                            maxTokens: 300,
                          };
                        });
                        setAgentLLMConfigs(configs);
                      }}
                    >
                      💰 All GPT-4o-mini (Económico)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const configs: Record<string, any> = {};
                        selectedAgents.forEach(id => {
                          configs[id] = {
                            provider: 'openai',
                            model: 'gpt-4o',
                            temperature: 0.7,
                            maxTokens: 300,
                          };
                        });
                        setAgentLLMConfigs(configs);
                      }}
                    >
                      🔥 All GPT-4o (Premium)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const configs: Record<string, any> = {};
                        const providers = ['openai', 'anthropic', 'google', 'openai'];
                        const models = ['gpt-4o', 'claude-3-5-sonnet-20241022', 'gemini-1.5-flash', 'gpt-4o-mini'];
                        selectedAgents.forEach((id, i) => {
                          configs[id] = {
                            provider: providers[i % providers.length],
                            model: models[i % models.length],
                            temperature: 0.7,
                            maxTokens: 300,
                          };
                        });
                        setAgentLLMConfigs(configs);
                      }}
                    >
                      🌈 Mix de Proveedores
                    </Button>
                  </CardContent>
                </Card>
              )}

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

            {/* Agent Details & LLM Configuration */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Selected Agents</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLLMConfig(!showLLMConfig)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showLLMConfig ? 'Hide' : 'Configure'} LLMs
                    </Button>
                  </div>
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

                        const llmConfig = agentLLMConfigs[agentId];
                        const currentProvider = llmConfig?.provider || agent.llmConfig.provider;
                        const currentModel = llmConfig?.model || agent.llmConfig.model;
                        const currentTemp = llmConfig?.temperature ?? agent.llmConfig.temperature ?? 0.7;

                        return (
                          <Card key={agent.id} className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">{agent.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {agent.personality}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                              {showLLMConfig ? (
                                <>
                                  {/* LLM Provider Selection */}
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                      🤖 LLM Provider
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded text-sm bg-white"
                                      value={currentProvider}
                                      onChange={(e) => {
                                        const provider = e.target.value;
                                        const firstModel = LLM_OPTIONS[provider].models[0].value;
                                        updateAgentLLM(agentId, provider, firstModel);
                                      }}
                                    >
                                      {Object.entries(LLM_OPTIONS).map(([key, { label }]) => (
                                        <option key={key} value={key}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Model Selection */}
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                      🎯 Model
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded text-sm bg-white"
                                      value={currentModel}
                                      onChange={(e) => updateAgentLLM(agentId, currentProvider, e.target.value)}
                                    >
                                      {LLM_OPTIONS[currentProvider]?.models.map((model) => (
                                        <option key={model.value} value={model.value}>
                                          {model.label} {model.cost}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Temperature Slider */}
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                      🌡️ Temperature: {currentTemp.toFixed(2)}
                                      <span className="text-xs text-gray-500 ml-2">
                                        {currentTemp < 0.4 ? '(Muy conservador)' : 
                                         currentTemp < 0.6 ? '(Conservador)' :
                                         currentTemp < 0.8 ? '(Balanceado)' :
                                         currentTemp < 0.9 ? '(Creativo)' : '(Muy arriesgado)'}
                                      </span>
                                    </label>
                                    <input
                                      type="range"
                                      min="0.3"
                                      max="1.0"
                                      step="0.05"
                                      value={currentTemp}
                                      onChange={(e) => updateAgentTemperature(agentId, parseFloat(e.target.value))}
                                      className="w-full"
                                    />
                                  </div>

                                  {/* Current Config Display */}
                                  <div className="pt-2 border-t">
                                    <Badge variant="outline" className="text-xs">
                                      {LLM_OPTIONS[currentProvider]?.label} / {currentModel}
                                    </Badge>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Compact View */}
                                  <div>
                                    <strong>Strategy:</strong>
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      {agent.strategyStyle.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <strong>LLM:</strong>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {LLM_OPTIONS[currentProvider]?.label}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Model: {currentModel} • Temp: {currentTemp.toFixed(2)}
                                  </div>
                                </>
                              )}
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

            {/* Resource Log - Detailed view */}
            {gameState && (
              <ResourceLog 
                players={gameState.players}
                currentPlayerIndex={gameState.currentPlayerIndex}
              />
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
    </>
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

