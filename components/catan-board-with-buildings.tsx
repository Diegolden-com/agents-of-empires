'use client';

import { GameState, HexTile } from '@/lib/types';

interface CatanBoardWithBuildingsProps {
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
  wood: '🌲',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
  ore: '⛏️',
  desert: '🏜️',
};

const PLAYER_COLORS: Record<string, string> = {
  red: '#e53935',
  blue: '#1e88e5',
  white: '#fafafa',
  orange: '#fb8c00',
};

function HexagonTile({ hex, x, y }: { hex: HexTile; x: number; y: number }) {
  const colors = TERRAIN_COLORS[hex.terrain] || TERRAIN_COLORS.desert;
  const size = 70;
  const height = size * 2;
  const width = Math.sqrt(3) * size;

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

      {/* Hexágono principal con gradiente */}
      <defs>
        <linearGradient id={`grad-${hex.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.fill, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: colors.shadow, stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>

      <polygon
        points={points}
        fill={`url(#grad-${hex.id})`}
        stroke={colors.stroke}
        strokeWidth="3"
        className="transition-all hover:brightness-110 cursor-pointer"
      />

      {/* Borde interior para efecto 3D */}
      <polygon
        points={points}
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        transform="translate(2, 2)"
      />

      {/* Icono del terreno */}
      <text
        x={width / 2}
        y={height / 2 - 15}
        textAnchor="middle"
        fontSize="28"
      >
        {TERRAIN_NAMES[hex.terrain]}
      </text>

      {/* Número de producción */}
      {hex.number && (
        <g>
          <circle
            cx={width / 2}
            cy={height / 2 + 20}
            r="24"
            fill="#f5f5dc"
            stroke="#8b7355"
            strokeWidth="3"
          />
          
          <circle
            cx={width / 2}
            cy={height / 2 + 20}
            r="22"
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1"
          />

          <text
            x={width / 2}
            y={height / 2 + 30}
            textAnchor="middle"
            fontSize="26"
            fontWeight="bold"
            fill={hex.number === 6 || hex.number === 8 ? '#d32f2f' : '#3e2723'}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {hex.number}
          </text>

          <text
            x={width / 2}
            y={height / 2 + 6}
            textAnchor="middle"
            fontSize="9"
            fill="#666"
            fontWeight="bold"
          >
            {'•'.repeat(6 - Math.abs(7 - hex.number))}
          </text>
        </g>
      )}
    </g>
  );
}

function Settlement({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sombra */}
      <polygon
        points="0,12 -8,4 -8,-4 8,-4 8,4"
        fill="rgba(0,0,0,0.3)"
        transform="translate(2, 2)"
      />
      {/* Casa */}
      <polygon
        points="0,12 -8,4 -8,-4 8,-4 8,4"
        fill={color}
        stroke="#333"
        strokeWidth="1.5"
      />
      {/* Techo */}
      <polygon
        points="0,-8 -10,0 10,0"
        fill={color}
        stroke="#333"
        strokeWidth="1.5"
        style={{ filter: 'brightness(0.8)' }}
      />
      {/* Ventana */}
      <rect x="-3" y="0" width="6" height="6" fill="#ffeb3b" stroke="#333" strokeWidth="0.5" />
    </g>
  );
}

function City({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sombra */}
      <rect x="-10" y="-6" width="20" height="20" fill="rgba(0,0,0,0.3)" transform="translate(2, 2)" />
      
      {/* Torre principal */}
      <rect x="-10" y="-6" width="20" height="20" fill={color} stroke="#333" strokeWidth="2" />
      
      {/* Torres laterales */}
      <rect x="-12" y="4" width="6" height="10" fill={color} stroke="#333" strokeWidth="1.5" style={{ filter: 'brightness(0.9)' }} />
      <rect x="6" y="4" width="6" height="10" fill={color} stroke="#333" strokeWidth="1.5" style={{ filter: 'brightness(0.9)' }} />
      
      {/* Almenas */}
      <rect x="-10" y="-10" width="4" height="4" fill={color} stroke="#333" strokeWidth="1" />
      <rect x="-2" y="-10" width="4" height="4" fill={color} stroke="#333" strokeWidth="1" />
      <rect x="6" y="-10" width="4" height="4" fill={color} stroke="#333" strokeWidth="1" />
      
      {/* Ventanas */}
      <rect x="-6" y="2" width="4" height="4" fill="#ffeb3b" stroke="#333" strokeWidth="0.5" />
      <rect x="2" y="2" width="4" height="4" fill="#ffeb3b" stroke="#333" strokeWidth="0.5" />
      <rect x="-3" y="8" width="6" height="4" fill="#8b4513" stroke="#333" strokeWidth="0.5" />
    </g>
  );
}

function Road({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  return (
    <g>
      {/* Sombra */}
      <line
        x1={x1 + 1}
        y1={y1 + 1}
        x2={x2 + 1}
        y2={y2 + 1}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Camino */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Borde */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#333"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.3"
      />
    </g>
  );
}

export function CatanBoardWithBuildings({ gameState }: CatanBoardWithBuildingsProps) {
  console.log('🎨 CatanBoardWithBuildings rendering:', {
    hasGameState: !!gameState,
    hasBoard: !!gameState?.board,
    hexCount: gameState?.board?.hexes?.length || 0,
    vertexCount: gameState?.board?.vertices?.length || 0,
    edgeCount: gameState?.board?.edges?.length || 0,
    playerCount: gameState?.players?.length || 0,
  });

  if (!gameState || !gameState.board || !gameState.board.hexes) {
    console.error('❌ Invalid gameState:', gameState);
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>No hay datos del tablero</div>
          <div className="text-xs mt-2">
            Esperando inicialización del juego...
          </div>
        </div>
      </div>
    );
  }

  const size = 70;
  const width = Math.sqrt(3) * size;
  const height = size * 2;

  // Calcular posiciones de hexágonos
  const hexPositions = gameState.board.hexes.map((hex) => {
    const { q, r } = hex.position;
    const x = width * (q + r / 2);
    const y = height * (3 / 4) * r;
    return { hex, x, y };
  });

  // Calcular límites
  const minX = Math.min(...hexPositions.map((p) => p.x));
  const maxX = Math.max(...hexPositions.map((p) => p.x)) + width;
  const minY = Math.min(...hexPositions.map((p) => p.y));
  const maxY = Math.max(...hexPositions.map((p) => p.y)) + height;

  const viewBoxWidth = maxX - minX + 40;
  const viewBoxHeight = maxY - minY + 40;
  const offsetX = -minX + 20;
  const offsetY = -minY + 20;

  // Calcular posiciones de vértices usando los hexágonos a los que pertenecen
  const vertexPositions = new Map<string, { x: number; y: number }>();
  
  // Crear un mapa de hexId a posición
  const hexPositionMap = new Map(hexPositions.map(hp => [hp.hex.id, { x: hp.x, y: hp.y, hex: hp.hex }]));
  
  // Definir los offsets de vértices (mismo que board-generator.ts)
  const getVertexOffsetInHex = (vertexId: string, hexId: string): { dx: number; dy: number } | null => {
    const hexPos = hexPositionMap.get(hexId);
    if (!hexPos) return null;
    
    // Parse vertex cubic coords
    const vParts = vertexId.split('_');
    const vQ = parseInt(vParts[1]);
    const vR = parseInt(vParts[2]);
    const vS = parseInt(vParts[3]);
    
    // Parse hex cubic coords
    const hParts = hexId.split('_');
    const hQ = parseInt(hParts[1]);
    const hR = parseInt(hParts[2]);
    const hS = parseInt(hParts[3]);
    
    // Calculate the offset from hex center to vertex
    const offsetQ = vQ - (hQ * 2);
    const offsetR = vR - (hR * 2);
    const offsetS = vS - (hS * 2);
    
    // Map offset to pixel position (same order as board-generator.ts)
    const cornerMap: { [key: string]: { dx: number; dy: number } } = {
      '1_-1_0': { dx: width / 2, dy: 0 },                  // Top
      '1_0_-1': { dx: width, dy: height / 4 },             // Top-right
      '0_1_-1': { dx: width, dy: (3 * height) / 4 },       // Bottom-right
      '-1_1_0': { dx: width / 2, dy: height },             // Bottom
      '-1_0_1': { dx: 0, dy: (3 * height) / 4 },           // Bottom-left
      '0_-1_1': { dx: 0, dy: height / 4 },                 // Top-left
    };
    
    const offsetKey = `${offsetQ}_${offsetR}_${offsetS}`;
    return cornerMap[offsetKey] || null;
  };
  
  // Para cada vértice, calcular su posición usando el primer hex al que pertenece
  gameState.board.vertices.forEach(vertex => {
    if (vertex.hexIds.length === 0) {
      console.warn(`⚠️ Vertex ${vertex.id} has no adjacent hexes`);
      return;
    }
    
    // Usar el primer hex para calcular la posición
    const firstHexId = vertex.hexIds[0];
    const hexData = hexPositionMap.get(firstHexId);
    
    if (!hexData) {
      console.warn(`⚠️ Hex ${firstHexId} not found for vertex ${vertex.id}`);
      return;
    }
    
    const offset = getVertexOffsetInHex(vertex.id, firstHexId);
    if (!offset) {
      console.warn(`⚠️ Could not calculate offset for vertex ${vertex.id} in hex ${firstHexId}`);
      return;
    }
    
    vertexPositions.set(vertex.id, {
      x: hexData.x + offset.dx,
      y: hexData.y + offset.dy,
    });
  });
  
  const missingCount = gameState.board.vertices.length - vertexPositions.size;
  if (missingCount > 0) {
    console.error(`❌ ${missingCount} vertices are missing positions!`);
  } else {
    console.log(`✅ All ${vertexPositions.size} vertices have positions`);
  }

  return (
    <div className="flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200 rounded-xl shadow-inner">
      <div className="relative bg-gradient-to-br from-blue-400/20 to-blue-500/30 rounded-xl p-6 shadow-2xl border-4 border-blue-300/50">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto max-w-5xl"
          style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
        >
          {/* Fondo del océano con olas */}
          <defs>
            <radialGradient id="ocean" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#81d4fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0277bd" stopOpacity="0.6" />
            </radialGradient>
            <pattern id="waves" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 Q10 10, 20 20 T40 20" stroke="#4fc3f7" strokeWidth="0.5" fill="none" opacity="0.3" />
            </pattern>
          </defs>
          
          <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#ocean)" rx="15" />
          <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#waves)" rx="15" />

          <g transform={`translate(${offsetX}, ${offsetY})`}>
            {/* Renderizar hexágonos */}
            {hexPositions.map(({ hex, x, y }) => (
              <HexagonTile key={hex.id} hex={hex} x={x} y={y} />
            ))}

            {/* Renderizar caminos */}
            {gameState.board.edges
              .filter((edge) => edge.road)
              .map((edge) => {
                const [v1Id, v2Id] = edge.vertexIds;
                const v1Pos = vertexPositions.get(v1Id);
                const v2Pos = vertexPositions.get(v2Id);
                
                if (!v1Pos || !v2Pos) {
                  console.warn(`⚠️ Road ${edge.id}: Cannot find positions for vertices ${v1Id} or ${v2Id}`);
                  return null;
                }
                
                // Calculate pixel distance for debugging
                const pixelDistance = Math.sqrt(
                  Math.pow(v2Pos.x - v1Pos.x, 2) + Math.pow(v2Pos.y - v1Pos.y, 2)
                );
                
                // Parse cubic coordinates for validation
                const v1Parts = v1Id.split('_');
                const v2Parts = v2Id.split('_');
                const v1Coords = { q: parseInt(v1Parts[1]), r: parseInt(v1Parts[2]), s: parseInt(v1Parts[3]) };
                const v2Coords = { q: parseInt(v2Parts[1]), r: parseInt(v2Parts[2]), s: parseInt(v2Parts[3]) };
                const chebyshevDist = Math.max(
                  Math.abs(v1Coords.q - v2Coords.q),
                  Math.abs(v1Coords.r - v2Coords.r),
                  Math.abs(v1Coords.s - v2Coords.s)
                );
                
                if (chebyshevDist !== 1) {
                  console.error(`🚨 RENDERING INVALID ROAD: ${edge.id}`);
                  console.error(`   ${v1Id} to ${v2Id}`);
                  console.error(`   Chebyshev distance: ${chebyshevDist} (should be 1)`);
                  console.error(`   Pixel distance: ${pixelDistance.toFixed(1)}px`);
                  console.error(`   v1 pos: (${v1Pos.x.toFixed(1)}, ${v1Pos.y.toFixed(1)})`);
                  console.error(`   v2 pos: (${v2Pos.x.toFixed(1)}, ${v2Pos.y.toFixed(1)})`);
                }
                
                const player = gameState.players.find((p) => p.id === edge.road!.playerId);
                
                return (
                  <Road
                    key={edge.id}
                    x1={v1Pos.x}
                    y1={v1Pos.y}
                    x2={v2Pos.x}
                    y2={v2Pos.y}
                    color={PLAYER_COLORS[player?.color || 'white'] || '#ffffff'}
                  />
                );
              })}

            {/* Renderizar asentamientos y ciudades */}
            {gameState.board.vertices
              .filter((vertex) => vertex.building)
              .map((vertex) => {
                const pos = vertexPositions.get(vertex.id);
                
                if (!pos) {
                  console.warn(`⚠️ Building at ${vertex.id}: Cannot find position`);
                  return null;
                }

                const player = gameState.players.find((p) => p.id === vertex.building!.playerId);
                const color = PLAYER_COLORS[player?.color || 'white'] || '#ffffff';

                if (vertex.building!.type === 'settlement') {
                  return <Settlement key={vertex.id} x={pos.x} y={pos.y} color={color} />;
                } else {
                  return <City key={vertex.id} x={pos.x} y={pos.y} color={color} />;
                }
              })}
          </g>
        </svg>

        {/* Leyenda mejorada */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-lg shadow-sm border-2"
                style={{ borderColor: PLAYER_COLORS[player.color] }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: PLAYER_COLORS[player.color] }}
                />
                <span className="text-xs font-semibold">{player.name}</span>
                <span className="text-xs text-gray-600">{player.victoryPoints} PV</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <div className="bg-white/80 px-2 py-1 rounded shadow-sm">
              <span className="font-semibold text-red-600">6 y 8</span> = Más frecuentes
            </div>
            <div className="bg-white/80 px-2 py-1 rounded shadow-sm">
              Los puntos (•) = Probabilidad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

