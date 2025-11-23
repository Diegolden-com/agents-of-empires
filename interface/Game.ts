import { Database } from "../app/utils/supabase/database.types";

// Cuando tengas las types actualizadas, usa esto:
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

// Configuración de agente para el juego
export interface AgentConfig {
  agentId: string;
  name: string;
  address: string;
  playerIndex: number; // 0-3
}

// Payload que envía Chainlink CRE al iniciar el juego
export interface ChainGamePayload {
  gameId: string;
  bettor: string;
  deposit: string;
  status: number;
  randomReady: boolean;
  bettorChoice: number;
  requestId: string;
  startTime: string;
  endTime: string;
  winner: number;
  aiPlayers: Array<{
    index: number;
    company: number;
    companyName: string;
    modelIndex: number;
    modelName: string;
    playOrder: number;
  }>;
  board: Array<{
    index: number;
    position: string;
    resource: number;
    resourceName: string;
  }>;
}
