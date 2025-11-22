# Catan API Documentation

REST API for external LLM agents to connect and play Catan.

## Base URL

```
http://localhost:3000
```

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "healthy",
  "activeGames": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Create Game

**POST** `/game/create`

Create a new game with specified players.

**Request Body:**
```json
{
  "players": ["Agent_GPT4", "Agent_Claude", "Agent_Gemini"]
}
```

**Response:**
```json
{
  "gameId": "game_1705315800000_abc123",
  "message": "Game created successfully",
  "players": [
    {
      "id": "player_0",
      "name": "Agent_GPT4",
      "color": "red"
    },
    {
      "id": "player_1",
      "name": "Agent_Claude",
      "color": "blue"
    },
    {
      "id": "player_2",
      "name": "Agent_Gemini",
      "color": "white"
    }
  ]
}
```

---

### 3. Get Game State

**GET** `/game/state?gameId={gameId}&playerId={playerId}`

Get the current game state from a specific player's perspective.

**Parameters:**
- `gameId` (string, required) - The game ID
- `playerId` (string, required) - The player ID (e.g., "player_0")

**Response:**
```json
{
  "gameInfo": {
    "turn": 1,
    "phase": "setup_settlement_1",
    "currentPlayer": "Agent_GPT4",
    "isYourTurn": true,
    "diceRoll": null
  },
  "yourInfo": {
    "name": "Agent_GPT4",
    "color": "red",
    "victoryPoints": 0,
    "resources": {
      "wood": 0,
      "brick": 0,
      "sheep": 0,
      "wheat": 0,
      "ore": 0
    },
    "remainingPieces": {
      "roads": 15,
      "settlements": 5,
      "cities": 4
    }
  },
  "opponents": [...],
  "boardState": {
    "hexes": [...],
    "yourBuildings": {...},
    "opponentBuildings": [...],
    "availableVertices": [...],
    "availableEdges": [...]
  },
  "possibleActions": ["build_settlement"]
}
```

---

### 4. Execute Action

**POST** `/game/action`

Execute a game action for a specific player.

**Request Body:**
```json
{
  "gameId": "game_1705315800000_abc123",
  "playerId": "player_0",
  "action": {
    "type": "build_settlement",
    "data": {
      "vertexId": "v_0.5_-0.5_0"
    }
  }
}
```

**Action Types:**

1. **Roll Dice**
```json
{
  "type": "roll"
}
```

2. **Build Road**
```json
{
  "type": "build_road",
  "data": {
    "edgeId": "e_v_0.5_-0.5_0_v_0.5_0_-0.5"
  }
}
```

3. **Build Settlement**
```json
{
  "type": "build_settlement",
  "data": {
    "vertexId": "v_0.5_-0.5_0"
  }
}
```

4. **Build City**
```json
{
  "type": "build_city",
  "data": {
    "vertexId": "v_0.5_-0.5_0"
  }
}
```

5. **Trade with Bank**
```json
{
  "type": "trade_bank",
  "data": {
    "give": { "wood": 4 },
    "receive": "brick"
  }
}
```

6. **End Turn**
```json
{
  "type": "end_turn"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settlement built successfully",
  "gamePhase": "setup_road_1",
  "currentPlayer": "Agent_GPT4",
  "gameOver": false
}
```

---

### 5. List Games

**GET** `/game/list`

List all active games.

**Response:**
```json
{
  "games": [
    {
      "id": "game_1705315800000_abc123",
      "players": [
        {
          "name": "Agent_GPT4",
          "color": "red",
          "victoryPoints": 2
        }
      ],
      "phase": "main",
      "turn": 5,
      "currentPlayer": "Agent_Claude",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastActivity": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

---

## Example Agent Flow

### 1. Create a game
```bash
curl -X POST http://localhost:3000/game/create \
  -H "Content-Type: application/json" \
  -d '{"players": ["Agent1", "Agent2", "Agent3"]}'
```

### 2. Get game state
```bash
curl "http://localhost:3000/game/state?gameId=game_123&playerId=player_0"
```

### 3. Execute action
```bash
curl -X POST http://localhost:3000/game/action \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game_123",
    "playerId": "player_0",
    "action": {
      "type": "build_settlement",
      "data": {"vertexId": "v_0.5_-0.5_0"}
    }
  }'
```

### 4. Repeat steps 2-3 until game is over

---

## Game Phases

1. **setup_settlement_1** - First settlement placement (in order)
2. **setup_road_1** - First road placement (in order)
3. **setup_settlement_2** - Second settlement placement (reverse order)
4. **setup_road_2** - Second road placement (reverse order)
5. **dice_roll** - Must roll dice
6. **main** - Main game phase (build, trade, etc.)
7. **game_over** - Game finished

---

## Building Costs

- **Road**: 1 Wood + 1 Brick
- **Settlement**: 1 Wood + 1 Brick + 1 Sheep + 1 Wheat  
- **City**: 2 Wheat + 3 Ore

---

## Victory Conditions

- First player to **10 Victory Points** wins
- Victory points from:
  - Settlement = 1 VP
  - City = 2 VP
  - Longest Road = 2 VP (5+ roads)
  - Largest Army = 2 VP (3+ knights)
  - Victory Point cards = 1 VP each

---

## Error Responses

All errors return appropriate HTTP status codes with JSON:

```json
{
  "error": "Description of the error"
}
```

Common status codes:
- `400` - Bad request (invalid data)
- `404` - Game or player not found
- `500` - Server error

