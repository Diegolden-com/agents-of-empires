'use client';

import { Player, Resources } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlayerPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
}

const RESOURCE_ICONS: Record<keyof Resources, string> = {
  wood: '🌲',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
  ore: '⛏️',
};

const COLOR_CLASSES: Record<string, string> = {
  red: 'border-red-500 bg-red-50',
  blue: 'border-blue-500 bg-blue-50',
  white: 'border-gray-400 bg-gray-50',
  orange: 'border-orange-500 bg-orange-50',
};

export function PlayerPanel({ player, isCurrentPlayer }: PlayerPanelProps) {
  return (
    <Card className={cn(
      'border-2 transition-all',
      COLOR_CLASSES[player.color] || 'border-gray-300',
      isCurrentPlayer && 'ring-4 ring-yellow-400 ring-offset-2'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {player.name}
            {isCurrentPlayer && (
              <Badge className="bg-yellow-500 text-white">Turno Actual</Badge>
            )}
          </CardTitle>
          <div className="text-2xl font-bold text-primary">
            {player.victoryPoints} PV
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Resources */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {(Object.keys(RESOURCE_ICONS) as Array<keyof Resources>).map((resource) => (
            <div key={resource} className="flex flex-col items-center">
              <div className="text-2xl">{RESOURCE_ICONS[resource]}</div>
              <div className="text-sm font-bold">{player.resources[resource]}</div>
            </div>
          ))}
        </div>

        {/* Building pieces */}
        <div className="grid grid-cols-3 gap-2 text-xs text-center pt-2 border-t">
          <div>
            <div className="font-semibold">Caminos</div>
            <div className="text-muted-foreground">{15 - player.roads}/15</div>
          </div>
          <div>
            <div className="font-semibold">Asentamientos</div>
            <div className="text-muted-foreground">{5 - player.settlements}/5</div>
          </div>
          <div>
            <div className="font-semibold">Ciudades</div>
            <div className="text-muted-foreground">{4 - player.cities}/4</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

