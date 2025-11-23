import { createClient } from "@/app/utils/supabase/client";
import { Game, GameInsert, GameUpdate } from "@/interface/Game";

export class GamesService {
  private supabase;

  constructor() {
    this.supabase = createClient();
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
  async listGamesByStatus(status: 'ready' | 'active' | 'finished' | 'cancelled'): Promise<Game[]> {
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
}
