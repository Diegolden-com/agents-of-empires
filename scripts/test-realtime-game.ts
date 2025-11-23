/**
 * Script para probar que el juego se inicia en tiempo real
 * Ejecuta: npx tsx scripts/test-realtime-game.ts
 */

const TEST_PAYLOAD = {
  "gameId": `test_${Date.now()}`,
  "bettor": "0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52",
  "deposit": "100000000000000",
  "status": 1,
  "randomReady": true,
  "bettorChoice": 0,
  "requestId": `req_${Date.now()}`,
  "startTime": Math.floor(Date.now() / 1000).toString(),
  "endTime": "0",
  "winner": 0,
  "aiPlayers": [
    {
      "index": 0,
      "company": 0,
      "companyName": "ANTHROPIC",
      "modelIndex": 1,
      "modelName": "anthropic/claude-sonnet-4.5",
      "playOrder": 3
    },
    {
      "index": 1,
      "company": 1,
      "companyName": "GOOGLE",
      "modelIndex": 3,
      "modelName": "google/gemini-2.5-flash",
      "playOrder": 1
    },
    {
      "index": 2,
      "company": 2,
      "companyName": "OPENAI",
      "modelIndex": 4,
      "modelName": "openai/gpt-5",
      "playOrder": 4
    },
    {
      "index": 3,
      "company": 3,
      "companyName": "XAI",
      "modelIndex": 7,
      "modelName": "xai/grok-4-fast-reasoning",
      "playOrder": 2
    }
  ],
  "board": [
    { "index": 0, "resource": 3 },
    { "index": 1, "resource": 0 },
    { "index": 2, "resource": 0 },
    { "index": 3, "resource": 4 },
    { "index": 4, "resource": 3 },
    { "index": 5, "resource": 2 },
    { "index": 6, "resource": 0 },
    { "index": 7, "resource": 0 },
    { "index": 8, "resource": 3 },
    { "index": 9, "resource": 1 },
    { "index": 10, "resource": 2 },
    { "index": 11, "resource": 5 },
    { "index": 12, "resource": 2 },
    { "index": 13, "resource": 1 },
    { "index": 14, "resource": 2 },
    { "index": 15, "resource": 4 },
    { "index": 16, "resource": 1 },
    { "index": 17, "resource": 1 },
    { "index": 18, "resource": 4 }
  ]
};

async function testRealtimeGame() {
  console.log('🧪 Probando inicio de juego en tiempo real...\n');
  console.log('📡 Enviando solicitud HTTP POST a /api/game/start...\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/game/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_PAYLOAD),
    });

    const elapsed = Date.now() - startTime;
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Juego creado exitosamente en', elapsed, 'ms\n');
      console.log('📊 Información del juego:');
      console.log('   ⚠️  IMPORTANTE: Usa el "Game ID" (no el Blockchain Game ID)');
      console.log('   Game ID (USA ESTE):', result.gameId);
      console.log('   Blockchain Game ID:', result.blockchainGameId);
      console.log('   URL del juego:', `http://localhost:3000${result.gameUrl}`);
      console.log('   Fase:', result.gameState.phase);
      console.log('   Turno:', result.gameState.turn);
      console.log('   Jugador actual:', result.gameState.currentPlayer);
      console.log('\n👥 Jugadores:');
      result.players.forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. ${p.name} (${p.color})`);
      });
      
      console.log('\n🔍 Verificando que el juego está disponible inmediatamente...\n');
      
      // Verificar inmediatamente que el juego existe
      const verifyResponse = await fetch(`http://localhost:3000/api/game/${result.gameId}`);
      if (verifyResponse.ok) {
        const gameData = await verifyResponse.json();
        console.log('✅ Juego verificado y disponible en tiempo real!');
        console.log('   Estado del juego:', gameData.state.phase);
        console.log('   Número de jugadores:', gameData.state.players.length);
        console.log('   Hexágonos en el tablero:', gameData.state.board.hexes.length);
        console.log('\n🎮 El juego está listo para jugar en:');
        console.log(`   👉 http://localhost:3000${result.gameUrl}`);
        console.log(`\n💡 Copia y pega esta URL en tu navegador:`);
        console.log(`   http://localhost:3000/game/${result.gameId}`);
      } else {
        const errorData = await verifyResponse.json().catch(() => ({}));
        console.error('❌ Error: El juego no está disponible después de crearse');
        console.error('   Status:', verifyResponse.status);
        console.error('   Error:', errorData);
        console.log('\n🔍 Verificando juegos activos...');
        const debugResponse = await fetch('http://localhost:3000/api/game/debug');
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log(`   Juegos activos: ${debugData.totalGames}`);
          if (debugData.games.length > 0) {
            console.log('   IDs disponibles:');
            debugData.games.forEach((g: any) => {
              console.log(`     - ${g.id}`);
            });
          }
        }
      }
      
    } else {
      console.error('❌ Error al crear el juego:', result.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo:');
    console.log('   npm run dev');
  }
}

// Ejecutar test
testRealtimeGame();

