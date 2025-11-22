export type ResourceType = "food" | "wood" | "gold";
export type UnitType = "villager" | "soldier";

export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  position: Position;
  targetPosition?: Position;
  owner: string; // civ id
  isSelected: boolean;
  isMoving: boolean;
  health: number;
  maxHealth: number;
}

export interface Resource {
  id: string;
  type: ResourceType;
  position: Position;
  amount: number;
  maxAmount: number;
}

export interface Building {
  id: string;
  type: "townhall";
  position: Position;
  owner: string;
  health: number;
  maxHealth: number;
}

export interface GameState {
  units: Unit[];
  resources: Resource[];
  buildings: Building[];
  selectedUnits: string[];
  camera: Position;
}

