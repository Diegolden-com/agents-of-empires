/**
 * Script de prueba para simular la creación de un juego desde el blockchain
 * Puedes ejecutar esto con: npx tsx scripts/test-blockchain-game.ts
 */

const TEST_PAYLOAD = {
  "gameId": "2",
  "bettor": "0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52",
  "deposit": "100000000000000",
  "status": 1,
  "randomReady": true,
  "bettorChoice": 0,
  "requestId": "123456789",
  "startTime": "1700000000",
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
    { "index": 0, "position": "Row 1 - Position 1 (Top)", "resource": 3, "resourceName": "BRICK" },
    { "index": 1, "position": "Row 1 - Position 2", "resource": 0, "resourceName": "WOOD" },
    { "index": 2, "position": "Row 1 - Position 3", "resource": 0, "resourceName": "WOOD" },
    { "index": 3, "position": "Row 2 - Position 1", "resource": 4, "resourceName": "ORE" },
    { "index": 4, "position": "Row 2 - Position 2", "resource": 3, "resourceName": "BRICK" },
    { "index": 5, "position": "Row 2 - Position 3", "resource": 2, "resourceName": "WHEAT" },
    { "index": 6, "position": "Row 2 - Position 4", "resource": 0, "resourceName": "WOOD" },
    { "index": 7, "position": "Row 3 - Position 1", "resource": 0, "resourceName": "WOOD" },
    { "index": 8, "position": "Row 3 - Position 2", "resource": 3, "resourceName": "BRICK" },
    { "index": 9, "position": "Row 3 - Position 3", "resource": 1, "resourceName": "SHEEP" },
    { "index": 10, "position": "Row 3 - Position 4", "resource": 2, "resourceName": "WHEAT" },
    { "index": 11, "position": "Row 3 - Position 5 (Center)", "resource": 5, "resourceName": "DESERT" },
    { "index": 12, "position": "Row 4 - Position 1", "resource": 2, "resourceName": "WHEAT" },
    { "index": 13, "position": "Row 4 - Position 2", "resource": 1, "resourceName": "SHEEP" },
    { "index": 14, "position": "Row 4 - Position 3", "resource": 2, "resourceName": "WHEAT" },
    { "index": 15, "position": "Row 4 - Position 4", "resource": 4, "resourceName": "ORE" },
    { "index": 16, "position": "Row 5 - Position 1", "resource": 1, "resourceName": "SHEEP" },
    { "index": 17, "position": "Row 5 - Position 2", "resource": 1, "resourceName": "SHEEP" },
    { "index": 18, "position": "Row 5 - Position 3 (Bottom)", "resource": 4, "resourceName": "ORE" }
  ]
};

async function testBlockchainGame() {
  console.log('🧪 Probando creación de juego desde blockchain...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/game/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_PAYLOAD),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Juego creado exitosamente!');
      console.log('   Game ID:', result.gameId);
      console.log('   Blockchain Game ID:', result.blockchainGameId);
      console.log('   Jugadores:', result.players.map((p: any) => p.name));
      console.log('\n🎮 Puedes jugar en: http://localhost:3000/game/' + result.gameId);
    } else {
      console.error('❌ Error al crear el juego:', result.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000');
  }
}

// Ejecutar test
testBlockchainGame();

