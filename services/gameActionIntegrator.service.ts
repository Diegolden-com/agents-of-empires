import { GameMovesService } from './gameMoves.service';
import { GamesService } from './games.service';
import {
  getAgentAddress,
  signAgentMove,
  generateNonce,
  createGameMoveInsert,
  type MoveData
} from './agentSigner.service';
import {
  encodeAgentAction
} from './moveEncoder.service';
import { AgentAction } from '@/lib/agent-interface';
import { GameMoveInsert } from '@/interface/GameMoves';
import { AgentConfig } from '@/interface/Game';

/**
 * Servicio integrador que coordina:
 * 1. Encoding de la acción
 * 2. Firma con la wallet del agente
 * 3. Almacenamiento en Supabase
 */
export class GameActionIntegratorService {
  private gameMovesService: GameMovesService;
  private gamesService: GamesService;

  constructor() {
    this.gameMovesService = new GameMovesService();
    this.gamesService = new GamesService();
  }

  /**
   * Procesa y guarda una acción de un agente
   *
   * @param gameId - ID del juego en blockchain
   * @param agentId - ID del agente (conquistador, merchant, etc.)
   * @param action - Acción del agente
   * @param playerIndex - Índice del jugador (0-3)
   * @returns El movimiento insertado
   */
  async processAndSaveAction(
    gameId: number,
    agentId: string,
    action: AgentAction,
    playerId?: string
  ): Promise<void> {
    try {
      console.log(`\n🎮 Processing action for ${agentId}:`);
      console.log(`   Game ID: ${gameId}`);
      console.log(`   Action: ${action.type}`);
      console.log(`   Data:`, action.data);

      // 1. Obtener la dirección del agente
      const agentAddress = getAgentAddress(agentId);

      // 2. Encodear la acción (pasamos playerId para resolver opciones a IDs)
      // Si no tenemos playerId, usamos agentId como fallback
      const playerIdForMapping = playerId || agentId;
      const { moveType, encodedData } = encodeAgentAction(action, playerIdForMapping);

      console.log(`   Move Type: ${moveType}`);
      console.log(`   Encoded Data: ${encodedData}`);

      // 3. Generar nonce único e incremental para este agente
      const nonce = generateNonce(agentAddress);

      // 4. Preparar datos para firmar
      const moveData: MoveData = {
        gameId,
        agent: agentAddress,
        moveType,
        data: encodedData,
        nonce
      };

      // 5. Obtener evvmID desde las variables de entorno
      const evvmID = process.env.EVVM_ID;
      if (!evvmID) {
        throw new Error('EVVM_ID not found in environment variables');
      }

      // 6. Firmar el movimiento con evvmID
      const signedMove = await signAgentMove(agentId, moveData, evvmID);

      // 7. Crear el payload para Supabase
      const gameMove: GameMoveInsert = createGameMoveInsert(signedMove, {
        priorityFee: 0,
        nonce: 0,
        priorityFlag: false,
        signature: '0x'
      });

      // 8. Guardar en Supabase
      const savedMove = await this.gameMovesService.insertGameMove(gameMove);

      console.log(`   ✅ Move saved to database with ID: ${savedMove.id}`);

      // 9. Incrementar contador de movimientos
      await this.gamesService.incrementMoveCount(gameId);

    } catch (error) {
      console.error(`❌ Error processing action for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Inicializa un juego en la base de datos
   */
  async initializeGame(
    gameId: number,
    agentIds: string[],
    bettorAddress?: string,
    bettorChoice?: number
  ): Promise<void> {
    try {
      console.log(`\n🎮 Initializing game ${gameId} in database`);

      // Crear configuración de agentes (necesario tanto para nuevo como existente)
      const agents: AgentConfig[] = agentIds.map((agentId, index) => ({
        agentId,
        name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
        address: getAgentAddress(agentId),
        playerIndex: index
      }));

      // Verificar si el juego ya existe
      const existingGame = await this.gamesService.getGameByGameId(gameId);
      if (existingGame) {
        console.log(`   ℹ️  Game ${gameId} already exists in database`);
        // Aseguramos que quede marcado como activo antes de jugar
        await this.gamesService.updateGame(gameId, {
          status: 'active',
          agents: existingGame.agents || (agents as any),
          bettor_address: bettorAddress ?? existingGame.bettor_address,
          bettor_choice: bettorChoice ?? existingGame.bettor_choice,
          started_at: existingGame.started_at ?? new Date().toISOString(),
        });
        return;
      }

      console.log(`   Agents:`);
      agents.forEach(agent => {
        console.log(`     - ${agent.name} (${agent.address}) [Player ${agent.playerIndex}]`);
      });

      // Crear el juego en la base de datos
      await this.gamesService.createGame({
        game_id: gameId,
        status: 'active',
        agents: agents as any, // Cast to Json type for Supabase
        bettor_address: bettorAddress,
        bettor_choice: bettorChoice,
        total_turns: 0,
        total_moves: 0
      });

      console.log(`   ✅ Game ${gameId} initialized successfully`);

    } catch (error) {
      console.error(`❌ Error initializing game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Finaliza un juego y guarda el ganador
   */
  async finishGame(
    gameId: number,
    winnerAgentId: string,
    winnerIndex: number,
    totalTurns: number
  ): Promise<void> {
    try {
      console.log(`\n🏆 Finishing game ${gameId}`);
      console.log(`   Winner: ${winnerAgentId} (Player ${winnerIndex})`);
      console.log(`   Total Turns: ${totalTurns}`);

      const winnerAddress = getAgentAddress(winnerAgentId);

      // Obtener el total de movimientos desde la base de datos
      const game = await this.gamesService.getGameByGameId(gameId);
      const totalMoves = game?.total_moves || 0;

      // Actualizar el juego como finalizado
      await this.gamesService.finishGame(
        gameId,
        winnerAddress,
        winnerIndex,
        totalTurns,
        totalMoves
      );

      console.log(`   ✅ Game ${gameId} finished successfully`);

    } catch (error) {
      console.error(`❌ Error finishing game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza el contador de turnos
   */
  async updateTurnCount(gameId: number, turnCount: number): Promise<void> {
    await this.gamesService.updateTurnCount(gameId, turnCount);
  }

  /**
   * Obtiene todos los movimientos de un juego
   */
  async getGameMoves(gameId: number) {
    return this.gameMovesService.getGameMovesByGameId(gameId);
  }

  /**
   * Obtiene información del juego
   */
  async getGame(gameId: number) {
    return this.gamesService.getGameByGameId(gameId);
  }

  /**
   * Helper para determinar el agentId desde el playerIndex
   */
  static getAgentIdFromPlayerIndex(
    agentIds: string[],
    playerIndex: number
  ): string {
    if (playerIndex < 0 || playerIndex >= agentIds.length) {
      throw new Error(`Invalid player index: ${playerIndex}`);
    }
    return agentIds[playerIndex];
  }
}

/**
 * Singleton instance
 */
let instance: GameActionIntegratorService | null = null;

export function getGameActionIntegrator(): GameActionIntegratorService {
  if (!instance) {
    instance = new GameActionIntegratorService();
  }
  return instance;
}
