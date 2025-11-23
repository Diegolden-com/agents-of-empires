'use client';

import { GameState, HexTile } from '@/lib/types';

interface CatanBoardProps {
  gameState: GameState;
}

const TERRAIN_COLORS: Record<string, { fill: string; stroke: string; shadow: string }> = {
  wood: { fill: '#2d5016', stroke: '#1a3409', shadow: '#1a3409' },
  brick: { fill: '#c94a3a', stroke: '#8b2e23', shadow: '#6b1e13' },
  sheep: { fill: '#9ccc65', stroke: '#7cb342', shadow: '#558b2f' },
  wheat: { fill: '#ffd54f', stroke: '#fbc02d', shadow: '#f9a825' },
  ore: { fill: '#78909c', stroke: '#546e7a', shadow: '#37474f' },
  desert: { fill: '#e6c896', stroke: '#d4a574', shadow: '#b8935a' },
};

const TERRAIN_NAMES: Record<string, string> = {
  wood: '🌲 Bosque',
  brick: '🧱 Arcilla',
  sheep: '🐑 Pasto',
  wheat: '🌾 Campo',
  ore: '⛏️  Montaña',
  desert: '🏜️  Desierto',
};

function HexagonTile({ hex, x, y }: { hex: HexTile; x: number; y: number }) {
  const colors = TERRAIN_COLORS[hex.terrain] || TERRAIN_COLORS.desert;
  const size = 70; // Radio del hexágono
  const height = size * 2;
  const width = Math.sqrt(3) * size;

  // Calcular puntos del hexágono
  const points = [
    [width / 2, 0],
    [width, height / 4],
    [width, (3 * height) / 4],
    [width / 2, height],
    [0, (3 * height) / 4],
    [0, height / 4],
  ]
    .map((p) => p.join(','))
    .join(' ');

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sombra */}
      <polygon
        points={points}
        fill={colors.shadow}
        opacity="0.3"
        transform="translate(3, 3)"
      />

      {/* Hexágono principal */}
      <polygon
        points={points}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="3"
        className="transition-all hover:brightness-110"
      />

      {/* Borde interior para efecto 3D */}
      <polygon
        points={points}
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        transform="translate(2, 2)"
      />

      {/* Nombre del terreno */}
      <text
        x={width / 2}
        y={height / 2 - 20}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="600"
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
      >
        {TERRAIN_NAMES[hex.terrain]}
      </text>

      {/* Número de producción */}
      {hex.number && (
        <g>
          {/* Círculo del número */}
          <circle
            cx={width / 2}
            cy={height / 2 + 15}
            r="22"
            fill="#f5f5dc"
            stroke="#8b7355"
            strokeWidth="2.5"
          />
          
          {/* Sombra del círculo */}
          <circle
            cx={width / 2}
            cy={height / 2 + 15}
            r="22"
            fill="none"
            stroke="rgba(0, 0, 0, 0.2)"
            strokeWidth="1"
            transform="translate(1, 1)"
          />

          {/* Número */}
          <text
            x={width / 2}
            y={height / 2 + 23}
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill={hex.number === 6 || hex.number === 8 ? '#d32f2f' : '#3e2723'}
          >
            {hex.number}
          </text>

          {/* Puntos (pips) - indicador de probabilidad */}
          <text
            x={width / 2}
            y={height / 2 + 5}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
          >
            {'•'.repeat(6 - Math.abs(7 - hex.number))}
          </text>
        </g>
      )}

      {/* Desierto - icono especial */}
      {hex.terrain === 'desert' && (
        <text
          x={width / 2}
          y={height / 2 + 15}
          textAnchor="middle"
          fontSize="32"
        >
          🏜️
        </text>
      )}
    </g>
  );
}

export function CatanBoard({ gameState }: CatanBoardProps) {
  const size = 70;
  const width = Math.sqrt(3) * size;
  const height = size * 2;

  // Calcular posiciones usando coordenadas cúbicas
  const hexPositions = gameState.board.hexes.map((hex) => {
    const { q, r } = hex.position;
    
    // Convertir coordenadas cúbicas a pixel
    const x = width * (q + r / 2);
    const y = height * (3 / 4) * r;

    return { hex, x, y };
  });

  // Calcular límites para centrar el SVG
  const minX = Math.min(...hexPositions.map((p) => p.x));
  const maxX = Math.max(...hexPositions.map((p) => p.x)) + width;
  const minY = Math.min(...hexPositions.map((p) => p.y));
  const maxY = Math.max(...hexPositions.map((p) => p.y)) + height;

  const viewBoxWidth = maxX - minX + 40;
  const viewBoxHeight = maxY - minY + 40;
  const offsetX = -minX + 20;
  const offsetY = -minY + 20;

  return (
    <div className="flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-inner">
      <div className="relative bg-blue-300/30 rounded-lg p-4 shadow-lg">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto max-w-4xl drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
        >
          {/* Fondo del océano */}
          <defs>
            <radialGradient id="ocean" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4fc3f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0288d1" stopOpacity="0.5" />
            </radialGradient>
          </defs>
          <rect
            width={viewBoxWidth}
            height={viewBoxHeight}
            fill="url(#ocean)"
            rx="10"
          />

          {/* Renderizar hexágonos */}
          <g transform={`translate(${offsetX}, ${offsetY})`}>
            {hexPositions.map(({ hex, x, y }) => (
              <HexagonTile key={hex.id} hex={hex} x={x} y={y} />
            ))}
          </g>
        </svg>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded shadow-sm">
            <span className="font-semibold text-red-600">6 y 8</span>
            <span className="text-gray-600">= Más frecuentes</span>
          </div>
          <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded shadow-sm">
            <span className="text-gray-600">Los puntos (•) indican probabilidad</span>
          </div>
        </div>
      </div>
    </div>
  );
}

