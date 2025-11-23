import { createClient } from "@/app/utils/supabase/client";
import { GameMove, GameMoveInsert } from "@/interface/GameMoves";

export class GameMovesService {
  private _supabase: ReturnType<typeof createClient> | null = null;

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  async getGameMovesByGameId(gameId: number): Promise<GameMove[]> {
    const { data, error } = await this.supabase
      .from("game_moves")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Error fetching game moves: ${error.message}`);
    }

    return data as GameMove[];
  }

  async insertGameMove(moveData: GameMoveInsert): Promise<GameMove> {
    const { data, error } = await this.supabase
      .from("game_moves")
      .insert(moveData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error inserting game move: ${error.message}`);
    }

    return data as GameMove;
  }

  async getGameMovesByGameIdAndStatus(
    gameId: number,
    status: string
  ): Promise<GameMove[]> {
    const { data, error } = await this.supabase
      .from("game_moves")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", status)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Error fetching game moves: ${error.message}`);
    }

    return data as GameMove[];
  }

  async updateGameMoveStatus(
    id: string,
    status: string,
    txHash?: string
  ): Promise<GameMove> {
    const updateData: any = { status };
    if (txHash) {
      updateData.tx_hash = txHash;
    }

    const { data, error } = await this.supabase
      .from("game_moves")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating game move: ${error.message}`);
    }

    return data as GameMove;
  }
}
