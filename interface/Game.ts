import { Database } from "../app/utils/supabase/database.types";

// Cuando tengas las types actualizadas, usa esto:
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];