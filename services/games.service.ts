import { createClient } from "@/app/utils/supabase/client";
import { ChainGamePayload, Game, GameInsert, GameUpdate } from "@/interface/Game";
import { getAgentAddress } from "./agentSigner.service";

export class GamesService {
  private _supabase: ReturnType<typeof createClient> | null = null;

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  /**
   * Crea un nuevo registro de juego
   */
  async createGame(gameData: GameInsert): Promise<Game> {
    const { data, error } = await this.supabase
      .from("games")
      .insert(gameData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating game: ${error.message}`);
    }

    return data as Game;
  }

  /**
   * Obtiene un juego por su blockchain game ID
   */
  async getGameByGameId(gameId: number): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("game_id", gameId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Error fetching game: ${error.message}`);
    }

    return data as Game;
  }

  /**
   * Actualiza un juego
   */
  async updateGame(gameId: number, updates: GameUpdate): Promise<Game> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from("games")
      .update(updateData)
      .eq("game_id", gameId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating game: ${error.message}`);
    }

    return data as Game;
  }

  /**
   * Marca un juego como finalizado
   */
  async finishGame(
    gameId: number,
    winnerAgent: string,
    winnerIndex: number,
    totalTurns: number,
    totalMoves: number
  ): Promise<Game> {
    return this.updateGame(gameId, {
      status: 'finished',
      winner_agent: winnerAgent,
      winner_index: winnerIndex,
      finished_at: new Date().toISOString(),
      total_turns: totalTurns,
      total_moves: totalMoves
    });
  }

  /**
   * Incrementa el contador de movimientos
   */
  async incrementMoveCount(gameId: number): Promise<void> {
    // Necesitamos hacer un update con increment
    const game = await this.getGameByGameId(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    await this.updateGame(gameId, {
      total_moves: (game.total_moves ?? 0) + 1
    });
  }

  /**
   * Actualiza el contador de turnos
   */
  async updateTurnCount(gameId: number, turnCount: number): Promise<void> {
    await this.updateGame(gameId, {
      total_turns: turnCount
    });
  }

  /**
   * Lista todos los juegos
   */
  async listGames(limit: number = 50): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error listing games: ${error.message}`);
    }

    return data as Game[];
  }

  /**
   * Lista juegos por estado
   */
  async listGamesByStatus(status: 'pending_vrf' | 'ready' | 'active' | 'finished' | 'cancelled'): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("status", status)
      .order("started_at", { ascending: false });

    if (error) {
      throw new Error(`Error listing games by status: ${error.message}`);
    }

    return data as Game[];
  }

  /**
   * Obtiene estadísticas de un agente
   */
  async getAgentStats(agentAddress: string): Promise<{
    totalGames: number;
    wins: number;
    winRate: number;
  }> {
    // Total de juegos donde participó
    const { count: totalGames, error: totalError } = await this.supabase
      .from("games")
      .select("*", { count: 'exact', head: true })
      .contains("agents", [{ address: agentAddress }]);

    if (totalError) {
      throw new Error(`Error fetching agent stats: ${totalError.message}`);
    }

    // Juegos ganados
    const { count: wins, error: winsError } = await this.supabase
      .from("games")
      .select("*", { count: 'exact', head: true })
      .eq("winner_agent", agentAddress);

    if (winsError) {
      throw new Error(`Error fetching agent wins: ${winsError.message}`);
    }

    const winRate = totalGames ? (wins || 0) / totalGames : 0;

    return {
      totalGames: totalGames || 0,
      wins: wins || 0,
      winRate
    };
  }

  /**
   * Registra el juego como solicitado (VRF) en Supabase
   */
  async registerGameRequest(
    gameId: number,
    agentIds: string[],
    bettorAddress?: string,
    bettorChoice?: number
  ): Promise<Game> {
    const agentsConfig = agentIds.map((agentId, index) => ({
      agentId,
      name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
      address: getAgentAddress(agentId),
      playerIndex: index,
    }));

    const existing = await this.getGameByGameId(gameId);

    if (existing) {
      return this.updateGame(gameId, {
        status: 'pending_vrf',
        agents: existing.agents || (agentsConfig as any),
        bettor_address: bettorAddress ?? existing.bettor_address,
        bettor_choice: bettorChoice ?? existing.bettor_choice,
        total_moves: existing.total_moves ?? 0,
        total_turns: existing.total_turns ?? 0,
      });
    }

    return this.createGame({
      game_id: gameId,
      status: 'pending_vrf',
      agents: agentsConfig as any,
      bettor_address: bettorAddress,
      bettor_choice: bettorChoice,
      total_moves: 0,
      total_turns: 0,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Guarda/actualiza el contexto on-chain que llega desde Chainlink CRE
   */
  async saveOnchainContext(payload: ChainGamePayload): Promise<Game> {
    const gameId = parseInt(payload.gameId, 10);
    if (Number.isNaN(gameId)) {
      throw new Error(`Invalid gameId in payload: ${payload.gameId}`);
    }

    const updates: GameUpdate = {
      bettor_address: payload.bettor,
      bettor_choice: payload.bettorChoice,
      chain_status: payload.status,
      chain_random_ready: payload.randomReady,
      chain_request_id: payload.requestId,
      chain_start_time: payload.startTime,
      chain_end_time: payload.endTime,
      chain_deposit: payload.deposit,
      chain_winner: payload.winner,
      ai_players: payload.aiPlayers as any,
      board_state: payload.board as any,
      chain_payload: payload as any,
    };

    // Si startTime viene en epoch y es válido lo convertimos a ISO
    if (payload.startTime && payload.startTime !== '0') {
      const startMillis = parseInt(payload.startTime, 10) * 1000;
      if (!Number.isNaN(startMillis)) {
        updates.started_at = new Date(startMillis).toISOString();
      }
    }

    const existing = await this.getGameByGameId(gameId);

    if (existing?.status === 'active' || existing?.status === 'finished') {
      updates.status = existing.status as any;
    } else {
      updates.status = 'ready';
    }

    if (existing) {
      return this.updateGame(gameId, updates);
    }

    return this.createGame({
      ...updates,
      game_id: gameId,
      agents: payload.aiPlayers as any,
      total_moves: 0,
      total_turns: 0,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Obtiene el último juego finalizado (ordenado por finished_at desc)
   */
  async getLastFinishedGame(): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("status", "finished")
      .order("finished_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching last finished game: ${error.message}`);
    }

    return data as Game;
  }
}
