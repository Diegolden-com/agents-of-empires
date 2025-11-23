import { Database } from "@/app/utils/supabase/database.types";

export type GameMove = Database["public"]["Tables"]["game_moves"]["Row"];
export type GameMoveInsert = Database["public"]["Tables"]["game_moves"]["Insert"];
export type GameMoveUpdate = Database["public"]["Tables"]["game_moves"]["Update"];