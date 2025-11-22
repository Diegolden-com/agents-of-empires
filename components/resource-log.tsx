'use client';

import { Player, Resources } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Coins, Building2, Route } from 'lucide-react';

interface ResourceLogProps {
  players: Player[];
  currentPlayerIndex: number;
}

const RESOURCE_ICONS: Record<keyof Resources, string> = {
  wood: '🌲',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
  ore: '⛏️',
};

const PLAYER_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  white: 'bg-gray-400',
  orange: 'bg-orange-500',
};

export function ResourceLog({ players, currentPlayerIndex }: ResourceLogProps) {
  const getTotalResources = (resources: Resources) => {
    return Object.values(resources).reduce((sum, val) => sum + val, 0);
  };

  const getResourceDistribution = (player: Player) => {
    const total = getTotalResources(player.resources);
    if (total === 0) return [];
    
    return (Object.entries(player.resources) as [keyof Resources, number][])
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {players.map((player, index) => {
          const totalResources = getTotalResources(player.resources);
          const isCurrentPlayer = index === currentPlayerIndex;
          
          return (
            <Card 
              key={player.id} 
              className={`border-2 ${isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''}`}
              style={{ borderColor: PLAYER_COLORS[player.color] }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold truncate">
                    {player.name}
                  </CardTitle>
                  {isCurrentPlayer && (
                    <Badge variant="secondary" className="text-xs">Activo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Total Resources */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Coins className="h-3 w-3" />
                    <span>Total</span>
                  </div>
                  <div className="text-lg font-bold">{totalResources}</div>
                </div>

                {/* Resource Icons */}
                <div className="flex justify-between pt-1 border-t">
                  {(Object.keys(RESOURCE_ICONS) as Array<keyof Resources>).map((resource) => (
                    <div key={resource} className="flex flex-col items-center">
                      <span className="text-sm">{RESOURCE_ICONS[resource]}</span>
                      <span className="text-xs font-semibold">{player.resources[resource]}</span>
                    </div>
                  ))}
                </div>

                {/* Buildings Built */}
                <div className="flex justify-between text-xs pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Route className="h-3 w-3" />
                    <span>{15 - player.roads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{5 - player.settlements}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 fill-current" />
                    <span>{4 - player.cities}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Resource Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            📊 Distribución de Recursos Detallada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {players.map((player) => {
              const distribution = getResourceDistribution(player);
              const total = getTotalResources(player.resources);
              
              return (
                <div key={player.id} className="space-y-2">
                  {/* Player Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${PLAYER_COLORS[player.color]}`}
                      />
                      <span className="font-semibold text-sm">{player.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {player.victoryPoints} PV
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {total} recursos totales
                    </span>
                  </div>

                  {/* Resource Bars */}
                  <div className="space-y-1">
                    {distribution.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">
                        Sin recursos
                      </div>
                    ) : (
                      distribution.map(([resource, count]) => (
                        <div key={resource} className="flex items-center gap-2">
                          <span className="text-lg">{RESOURCE_ICONS[resource]}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium capitalize">{resource}</span>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
                                style={{ width: `${(count / Math.max(total, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resource Production Potential */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            🎲 Capacidad Productiva (Asentamientos + Ciudades)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {players.map((player) => {
              const settlementsBuilt = 5 - player.settlements;
              const citiesBuilt = 4 - player.cities;
              const productionMultiplier = settlementsBuilt + (citiesBuilt * 2);
              
              return (
                <div key={player.id} className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${PLAYER_COLORS[player.color]}`}
                    />
                    <span className="text-sm font-semibold">{player.name}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {settlementsBuilt} asentamientos × 1
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {citiesBuilt} ciudades × 2
                    </div>
                    <div className="text-lg font-bold text-primary pt-1 border-t">
                      ×{productionMultiplier}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      recursos/turno potencial
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

