'use client';

import { GameState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dices, Home, Route, Building2, ArrowRightLeft } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  onAction: (action: any) => void;
}

export function GameControls({ gameState, onAction }: GameControlsProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const phase = gameState.phase;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Controles del Juego</span>
          <Badge variant="secondary">Turno {gameState.turn}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Phase indicator */}
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-sm text-muted-foreground">Fase Actual</div>
          <div className="font-semibold text-lg capitalize">
            {phase.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Dice roll display */}
        {gameState.diceRoll && (
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Última Tirada</div>
            <div className="flex justify-center gap-2 mt-1">
              <div className="w-12 h-12 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center text-2xl font-bold">
                {gameState.diceRoll[0]}
              </div>
              <div className="w-12 h-12 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center text-2xl font-bold">
                {gameState.diceRoll[1]}
              </div>
              <div className="flex items-center text-2xl font-bold">
                = {gameState.diceRoll[0] + gameState.diceRoll[1]}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {phase === 'dice_roll' && (
            <Button
              onClick={() => onAction({ type: 'roll' })}
              className="w-full"
              size="lg"
            >
              <Dices className="mr-2" />
              Tirar Dados
            </Button>
          )}

          {(phase === 'setup_settlement_1' || phase === 'setup_settlement_2') && (
            <Button
              onClick={() => onAction({ type: 'build_settlement' })}
              className="w-full"
              size="lg"
            >
              <Home className="mr-2" />
              Construir Asentamiento
            </Button>
          )}

          {(phase === 'setup_road_1' || phase === 'setup_road_2') && (
            <Button
              onClick={() => onAction({ type: 'build_road' })}
              className="w-full"
              size="lg"
            >
              <Route className="mr-2" />
              Construir Camino
            </Button>
          )}

          {phase === 'main' && (
            <>
              <Button
                onClick={() => onAction({ type: 'build_road' })}
                className="w-full"
                variant="outline"
                disabled={
                  currentPlayer.resources.wood < 1 ||
                  currentPlayer.resources.brick < 1 ||
                  currentPlayer.roads === 0
                }
              >
                <Route className="mr-2" />
                Construir Camino (1🌲 1🧱)
              </Button>

              <Button
                onClick={() => onAction({ type: 'build_settlement' })}
                className="w-full"
                variant="outline"
                disabled={
                  currentPlayer.resources.wood < 1 ||
                  currentPlayer.resources.brick < 1 ||
                  currentPlayer.resources.sheep < 1 ||
                  currentPlayer.resources.wheat < 1 ||
                  currentPlayer.settlements === 0
                }
              >
                <Home className="mr-2" />
                Construir Asentamiento (1🌲 1🧱 1🐑 1🌾)
              </Button>

              <Button
                onClick={() => onAction({ type: 'build_city' })}
                className="w-full"
                variant="outline"
                disabled={
                  currentPlayer.resources.wheat < 2 ||
                  currentPlayer.resources.ore < 3 ||
                  currentPlayer.cities === 0
                }
              >
                <Building2 className="mr-2" />
                Construir Ciudad (2🌾 3⛏️)
              </Button>

              <Button
                onClick={() => onAction({ type: 'trade_bank' })}
                className="w-full"
                variant="outline"
                disabled={
                  Object.values(currentPlayer.resources).reduce((a, b) => a + b, 0) < 4
                }
              >
                <ArrowRightLeft className="mr-2" />
                Comerciar con Banco (4:1)
              </Button>

              <Button
                onClick={() => onAction({ type: 'end_turn' })}
                className="w-full mt-4"
                variant="secondary"
                size="lg"
              >
                Terminar Turno
              </Button>
            </>
          )}
        </div>

        {/* Building costs reference */}
        <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded space-y-1">
          <div className="font-semibold mb-2">Costos de Construcción:</div>
          <div>• Camino: 1🌲 1🧱</div>
          <div>• Asentamiento: 1🌲 1🧱 1🐑 1🌾</div>
          <div>• Ciudad: 2🌾 3⛏️</div>
        </div>
      </CardContent>
    </Card>
  );
}

