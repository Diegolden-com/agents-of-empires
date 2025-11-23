#!/usr/bin/env node
// HTTP API server for external LLM agents to connect and play

import * as http from 'http';
import { GameState } from '../lib/types';
import { createGame, getCurrentPlayer } from '../lib/game-engine';
import {
  getGameStateForAgent,
  executeAgentAction,
  AgentAction,
} from '../lib/agent-interface';

interface GameSession {
  id: string;
  state: GameState;
  createdAt: Date;
  lastActivity: Date;
}

const games = new Map<string, GameSession>();

function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  // Route handling
  if (path === '/health' && req.method === 'GET') {
    handleHealth(res);
  } else if (path === '/game/create' && req.method === 'POST') {
    handleCreateGame(req, res);
  } else if (path === '/game/state' && req.method === 'GET') {
    handleGetGameState(url, res);
  } else if (path === '/game/action' && req.method === 'POST') {
    handleGameAction(req, res);
  } else if (path === '/game/list' && req.method === 'GET') {
    handleListGames(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

function handleHealth(res: http.ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'healthy', 
    activeGames: games.size,
    timestamp: new Date().toISOString()
  }));
}

function handleCreateGame(req: http.IncomingMessage, res: http.ServerResponse): void {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const playerNames = data.players;

      if (!playerNames || !Array.isArray(playerNames)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'players array required' }));
        return;
      }

      if (playerNames.length < 2 || playerNames.length > 4) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Catan requires 2-4 players' }));
        return;
      }

      const gameId = generateGameId();
      const gameState = createGame(playerNames);
      
      games.set(gameId, {
        id: gameId,
        state: gameState,
        createdAt: new Date(),
        lastActivity: new Date(),
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        gameId,
        message: 'Game created successfully',
        players: gameState.players.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
        })),
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Invalid request: ${error}` }));
    }
  });
}

function handleGetGameState(url: URL, res: http.ServerResponse): void {
  const gameId = url.searchParams.get('gameId');
  const playerId = url.searchParams.get('playerId');

  if (!gameId || !playerId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'gameId and playerId required' }));
    return;
  }

  const game = games.get(gameId);
  if (!game) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Game not found' }));
    return;
  }

  try {
    const agentState = getGameStateForAgent(game.state, playerId);
    game.lastActivity = new Date();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agentState));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Error: ${error}` }));
  }
}

function handleGameAction(req: http.IncomingMessage, res: http.ServerResponse): void {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { gameId, playerId, action } = data;

      if (!gameId || !playerId || !action) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'gameId, playerId, and action required' }));
        return;
      }

      const game = games.get(gameId);
      if (!game) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Game not found' }));
        return;
      }

      const result = executeAgentAction(game.state, playerId, action as AgentAction);
      game.lastActivity = new Date();

      if (result.success && result.newState) {
        game.state = result.newState;
      }

      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: result.success,
        message: result.message,
        gamePhase: game.state.phase,
        currentPlayer: getCurrentPlayer(game.state).name,
        gameOver: game.state.phase === 'game_over',
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Invalid request: ${error}` }));
    }
  });
}

function handleListGames(res: http.ServerResponse): void {
  const gameList = Array.from(games.values()).map(game => ({
    id: game.id,
    players: game.state.players.map(p => ({
      name: p.name,
      color: p.color,
      victoryPoints: p.victoryPoints,
    })),
    phase: game.state.phase,
    turn: game.state.turn,
    currentPlayer: getCurrentPlayer(game.state).name,
    createdAt: game.createdAt,
    lastActivity: game.lastActivity,
  }));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ games: gameList }));
}

// Clean up old games (inactive for > 1 hour)
function cleanupOldGames(): void {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [gameId, game] of games.entries()) {
    if (game.lastActivity < oneHourAgo) {
      games.delete(gameId);
      console.log(`Cleaned up inactive game: ${gameId}`);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupOldGames, 10 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n🎲 Catan API Server running on http://localhost:${PORT}`);
  console.log('\nAPI Endpoints:');
  console.log(`  GET  /health                  - Health check`);
  console.log(`  POST /game/create             - Create new game`);
  console.log(`  GET  /game/state              - Get game state for a player`);
  console.log(`  POST /game/action             - Execute an action`);
  console.log(`  GET  /game/list               - List all active games`);
  console.log('\nExample usage:');
  console.log(`  curl -X POST http://localhost:${PORT}/game/create -H "Content-Type: application/json" -d '{"players":["Agent1","Agent2","Agent3"]}'`);
  console.log('');
});

