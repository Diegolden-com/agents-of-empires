#!/usr/bin/env node
// Terminal interface for Catan - Agents play via JSON commands

import * as readline from 'readline';
import { GameState } from '../lib/types';
import { createGame, getCurrentPlayer } from '../lib/game-engine';
import { 
  displayGameState, 
  displayBoard, 
  displayAvailableActions,
  displayWinner,
  displayVertices,
  displayEdges,
} from './display';
import {
  getGameStateForAgent,
  executeAgentAction,
  exportGameStateJSON,
  AgentAction,
} from '../lib/agent-interface';

let gameState: GameState;

function startGame(playerNames: string[]): void {
  console.log('\n🎲 SETTLERS OF CATAN - LLM AGENT EDITION 🎲\n');
  console.log(`Starting game with ${playerNames.length} players: ${playerNames.join(', ')}\n`);
  
  gameState = createGame(playerNames);
  
  console.log('Game initialized! Each agent will take turns playing.');
  console.log('Agents can send JSON commands to play the game.\n');
  
  displayGameState(gameState);
  displayBoard(gameState);
  showHelp();
}

function showHelp(): void {
  console.log('\n--- COMMANDS ---');
  console.log('help                     - Show this help message');
  console.log('state                    - Show current game state');
  console.log('board                    - Show board layout');
  console.log('json                     - Export current player state as JSON');
  console.log('vertices [limit]         - Show available vertices');
  console.log('edges [limit]            - Show available edges');
  console.log('action <json>            - Execute an action (JSON format)');
  console.log('quit                     - Exit game');
  console.log('\n--- ACTION FORMAT ---');
  console.log('Roll dice:        action {"type": "roll"}');
  console.log('Build road:       action {"type": "build_road", "data": {"edgeId": "e_..."}}');
  console.log('Build settlement: action {"type": "build_settlement", "data": {"vertexId": "v_..."}}');
  console.log('Build city:       action {"type": "build_city", "data": {"vertexId": "v_..."}}');
  console.log('Trade with bank:  action {"type": "trade_bank", "data": {"give": {"wood": 4}, "receive": "brick"}}');
  console.log('End turn:         action {"type": "end_turn"}');
  console.log('');
}

function handleCommand(command: string): void {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  try {
    switch (cmd) {
      case 'help':
        showHelp();
        break;

      case 'state':
        displayGameState(gameState);
        displayAvailableActions(gameState, getCurrentPlayer(gameState));
        break;

      case 'board':
        displayBoard(gameState);
        break;

      case 'json': {
        const currentPlayer = getCurrentPlayer(gameState);
        console.log('\n--- GAME STATE JSON (for current player) ---');
        console.log(exportGameStateJSON(gameState, currentPlayer.id));
        break;
      }

      case 'vertices': {
        const limit = parts[1] ? parseInt(parts[1]) : 20;
        displayVertices(gameState, limit);
        break;
      }

      case 'edges': {
        const limit = parts[1] ? parseInt(parts[1]) : 20;
        const currentPlayer = getCurrentPlayer(gameState);
        displayEdges(gameState, currentPlayer.id, limit);
        break;
      }

      case 'action': {
        const jsonStr = command.substring(command.indexOf('{'));
        const action: AgentAction = JSON.parse(jsonStr);
        const currentPlayer = getCurrentPlayer(gameState);
        
        console.log(`\n${currentPlayer.name} executing: ${action.type}...`);
        
        const result = executeAgentAction(gameState, currentPlayer.id, action);
        
        if (result.success) {
          console.log(`✅ ${result.message}`);
          if (result.newState) {
            gameState = result.newState;
          }
          
          if (gameState.phase === 'game_over') {
            displayWinner(gameState);
            process.exit(0);
          }
          
          displayGameState(gameState);
          displayAvailableActions(gameState, getCurrentPlayer(gameState));
        } else {
          console.log(`❌ Failed: ${result.message}`);
        }
        break;
      }

      case 'quit':
      case 'exit':
        console.log('Thanks for playing!');
        process.exit(0);
        break;

      case '':
        // Empty command, ignore
        break;

      default:
        console.log(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);
  
  let playerNames: string[];
  
  if (args.length > 0) {
    playerNames = args;
  } else {
    // Default players
    playerNames = ['Agent_GPT4', 'Agent_Claude', 'Agent_Gemini', 'Agent_Llama'];
  }

  if (playerNames.length < 2 || playerNames.length > 4) {
    console.error('Error: Catan requires 2-4 players');
    console.log('Usage: npm run play [player1] [player2] [player3] [player4]');
    process.exit(1);
  }

  startGame(playerNames);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\ncatan> ',
  });

  rl.prompt();

  rl.on('line', (line) => {
    handleCommand(line);
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGame ended.');
    process.exit(0);
  });
}

main();

