// Core game types for Catan

export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore';
export type TerrainType = ResourceType | 'desert';

export interface Resources {
  wood: number;
  brick: number;
  sheep: number;
  wheat: number;
  ore: number;
}

export interface HexTile {
  id: string;
  terrain: TerrainType;
  number: number | null; // null for desert
  position: { q: number; r: number; s: number }; // Cubic coordinates
}

export interface Vertex {
  id: number; // Simple numeric ID (1-72)
  hexIds: string[]; // Up to 3 adjacent hexes
  position: { q: number; r: number; s: number }; // Keep for rendering
  adjacentVertexIds: number[]; // IDs of connected vertices
  building?: Building;
}

export interface Edge {
  id: number; // Simple numeric ID
  vertexIds: [number, number]; // Two vertex IDs
  road?: Road;
}

export interface Building {
  playerId: string;
  type: 'settlement' | 'city';
}

export interface Road {
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  resources: Resources;
  developmentCards: DevelopmentCard[];
  roads: number; // remaining
  settlements: number; // remaining
  cities: number; // remaining
  victoryPoints: number;
  longestRoad: boolean;
  largestArmy: boolean;
  knightsPlayed: number;
}

export type DevelopmentCard = 'knight' | 'victory_point' | 'road_building' | 'year_of_plenty' | 'monopoly';

export interface GameState {
  board: Board;
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  diceRoll: [number, number] | null;
  turn: number;
  longestRoadPlayerId: string | null;
  largestArmyPlayerId: string | null;
  lastSettlementId?: number; // Track the last settlement built for setup phase validation
}

export type GamePhase = 
  | 'setup_settlement_1' 
  | 'setup_road_1' 
  | 'setup_settlement_2' 
  | 'setup_road_2'
  | 'dice_roll'
  | 'main'
  | 'game_over';

export interface Board {
  hexes: HexTile[];
  vertices: Vertex[];
  edges: Edge[];
}

export interface GameAction {
  type: ActionType;
  playerId: string;
  data?: any;
}

export type ActionType =
  | 'roll_dice'
  | 'build_road'
  | 'build_settlement'
  | 'build_city'
  | 'buy_development_card'
  | 'play_development_card'
  | 'trade_with_bank'
  | 'trade_with_player'
  | 'end_turn'
  | 'discard_resources';

export interface BuildRoadAction {
  edgeId: number;
}

export interface BuildSettlementAction {
  vertexId: number;
}

export interface BuildCityAction {
  vertexId: number;
}

export interface TradeWithBankAction {
  give: Partial<Resources>;
  receive: ResourceType;
}

export interface TradeWithPlayerAction {
  targetPlayerId: string;
  offer: Partial<Resources>;
  request: Partial<Resources>;
}

