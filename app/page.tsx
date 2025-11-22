"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import EnhancedGameCanvas from "./components/EnhancedGameCanvas";
import type { Unit, Resource, Building, Position, ResourceType, UnitType } from "./types/game";

type ResourceKey = "food" | "wood" | "gold";

type Civilization = {
  id: string;
  name: string;
  color: string;
  accent: string;
  baseHealth: number;
  resources: Record<ResourceKey, number>;
  trait: string;
};

const INITIAL_CIVS: Civilization[] = [
  {
    id: "solari",
    name: "Imperio Solari",
    color: "#f59e0b",
    accent: "#f97316",
    baseHealth: 100,
    resources: { food: 120, wood: 90, gold: 50 },
    trait: "Eco agresiva: obtiene +20% recursos de madera."
  },
  {
    id: "aurora",
    name: "Clanes Aurora",
    color: "#22d3ee",
    accent: "#38bdf8",
    baseHealth: 100,
    resources: { food: 120, wood: 70, gold: 70 },
    trait: "Mineros natos: +20% oro al recolectar."
  }
];

const RESOURCE_LABEL: Record<ResourceKey, string> = {
  food: "Comida",
  wood: "Madera",
  gold: "Oro"
};

const UNIT_LABEL: Record<UnitType, string> = {
  villager: "Aldeano",
  soldier: "Soldado"
};

const SPEED = 0.5;
const GATHER_DISTANCE = 25;
const GATHER_RATE = 1000; // ms between gathers

function generateResources(): Resource[] {
  const resources: Resource[] = [];
  const resourceTypes: ResourceType[] = ["wood", "gold", "food"];

  // Generate trees (wood)
  for (let i = 0; i < 15; i++) {
    resources.push({
      id: `wood-${i}`,
      type: "wood",
      position: {
        x: 200 + Math.random() * 400,
        y: 100 + Math.random() * 300
      },
      amount: 100,
      maxAmount: 100
    });
  }

  // Generate gold mines
  for (let i = 0; i < 8; i++) {
    resources.push({
      id: `gold-${i}`,
      type: "gold",
      position: {
        x: 150 + Math.random() * 500,
        y: 150 + Math.random() * 250
      },
      amount: 150,
      maxAmount: 150
    });
  }

  // Generate food (berry bushes)
  for (let i = 0; i < 12; i++) {
    resources.push({
      id: `food-${i}`,
      type: "food",
      position: {
        x: 180 + Math.random() * 440,
        y: 120 + Math.random() * 280
      },
      amount: 80,
      maxAmount: 80
    });
  }

  return resources;
}

function initializeGame(): {
  units: Unit[];
  resources: Resource[];
  buildings: Building[];
} {
  const resources = generateResources();

  const buildings: Building[] = [
    {
      id: "townhall-solari",
      type: "townhall",
      position: { x: 100, y: 200 },
      owner: "solari",
      health: 100,
      maxHealth: 100
    },
    {
      id: "townhall-aurora",
      type: "townhall",
      position: { x: 700, y: 200 },
      owner: "aurora",
      health: 100,
      maxHealth: 100
    }
  ];

  const units: Unit[] = [
    // Solari units
    {
      id: "unit-solari-v1",
      type: "villager",
      position: { x: 120, y: 220 },
      owner: "solari",
      isSelected: false,
      isMoving: false,
      health: 25,
      maxHealth: 25
    },
    {
      id: "unit-solari-v2",
      type: "villager",
      position: { x: 100, y: 240 },
      owner: "solari",
      isSelected: false,
      isMoving: false,
      health: 25,
      maxHealth: 25
    },
    {
      id: "unit-solari-v3",
      type: "villager",
      position: { x: 80, y: 220 },
      owner: "solari",
      isSelected: false,
      isMoving: false,
      health: 25,
      maxHealth: 25
    },
    {
      id: "unit-solari-s1",
      type: "soldier",
      position: { x: 100, y: 180 },
      owner: "solari",
      isSelected: false,
      isMoving: false,
      health: 40,
      maxHealth: 40
    },
    // Aurora units
    {
      id: "unit-aurora-v1",
      type: "villager",
      position: { x: 720, y: 220 },
      owner: "aurora",
      isSelected: false,
      isMoving: false,
      health: 25,
      maxHealth: 25
    },
    {
      id: "unit-aurora-v2",
      type: "villager",
      position: { x: 700, y: 240 },
      owner: "aurora",
      isSelected: false,
      isMoving: false,
      health: 25,
      maxHealth: 25
    },
    {
      id: "unit-aurora-v3",
      type: "villager",
      position: { x: 680, y: 220 },
      owner: "aurora",
      isSelected: false,
      isMoving: false,
      health: 25,
      maxHealth: 25
    },
    {
      id: "unit-aurora-s1",
      type: "soldier",
      position: { x: 700, y: 180 },
      owner: "aurora",
      isSelected: false,
      isMoving: false,
      health: 40,
      maxHealth: 40
    }
  ];

  return { units, resources, buildings };
}

function gatherRate(villagers: number) {
  return 10 + Math.max(0, villagers - 1) * 2;
}

function distance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function Home() {
  const [civs, setCivs] = useState<Civilization[]>(INITIAL_CIVS);
  const [gameState, setGameState] = useState(initializeGame);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([
    "Los exploradores llegaron al nuevo mapa. ¡Comienza la escaramuza!"
  ]);
  const [gatheringUnits, setGatheringUnits] = useState<Map<string, { resourceId: string; lastGather: number }>>(new Map());
  const [combatCooldowns, setCombatCooldowns] = useState<Map<string, number>>(new Map());

  const isGameOver = useMemo(
    () => civs.some((civ) => civ.baseHealth <= 0),
    [civs]
  );

  const addLog = useCallback((entry: string) => {
    setLog((prev) => [entry, ...prev].slice(0, 10));
  }, []);

  // Update units movement
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const updatedUnits = prev.units.map((unit) => {
          if (!unit.targetPosition) return unit;

          const dx = unit.targetPosition.x - unit.position.x;
          const dy = unit.targetPosition.y - unit.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 2) {
            // Reached target
            return {
              ...unit,
              position: unit.targetPosition,
              targetPosition: undefined,
              isMoving: false
            };
          }

          // Move towards target
          const moveX = (dx / dist) * SPEED;
          const moveY = (dy / dist) * SPEED;

          return {
            ...unit,
            position: {
              x: unit.position.x + moveX,
              y: unit.position.y + moveY
            },
            isMoving: true
          };
        });

        return { ...prev, units: updatedUnits };
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  // Handle resource gathering and combat
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGameState((prev) => {
        const updatedUnits = [...prev.units];
        const updatedResources = [...prev.resources];
        const updatedBuildings = [...prev.buildings];
        const updatedCivs = [...civs];
        const updatedGathering = new Map(gatheringUnits);
        const updatedCombatCooldowns = new Map(combatCooldowns);

        // Resource gathering
        gatheringUnits.forEach((gatherInfo, unitId) => {
          const unit = updatedUnits.find((u) => u.id === unitId);
          const resource = updatedResources.find((r) => r.id === gatherInfo.resourceId);
          const civ = updatedCivs.find((c) => c.id === unit?.owner);

          if (!unit || !resource || !civ || resource.amount <= 0) {
            updatedGathering.delete(unitId);
            return;
          }

          // Check if unit is close enough
          if (distance(unit.position, resource.position) > GATHER_DISTANCE) {
            updatedGathering.delete(unitId);
            return;
          }

          // Gather resource
          if (now - gatherInfo.lastGather >= GATHER_RATE) {
        const traitBonus =
              civ.id === "solari" && resource.type === "wood"
            ? 1.2
                : civ.id === "aurora" && resource.type === "gold"
              ? 1.2
              : 1;

            const amount = Math.round(gatherRate(1) * traitBonus);
            const gathered = Math.min(amount, resource.amount);

            // Update resource
            const resourceIndex = updatedResources.findIndex((r) => r.id === resource.id);
            updatedResources[resourceIndex] = {
              ...resource,
              amount: resource.amount - gathered
            };

            // Update civ resources
            const civIndex = updatedCivs.findIndex((c) => c.id === civ.id);
            updatedCivs[civIndex] = {
          ...civ,
          resources: {
            ...civ.resources,
                [resource.type]: civ.resources[resource.type] + gathered
              }
            };

            updatedGathering.set(unitId, { ...gatherInfo, lastGather: now });
            addLog(`${civ.name} recolectó ${gathered} de ${RESOURCE_LABEL[resource.type]}.`);
          }
        });

        // Auto-combat for soldiers
        updatedUnits.forEach((soldier) => {
          if (soldier.type !== "soldier") return;
          if (soldier.health <= 0) return;

          const attackRange = 30;
          const attackCooldown = 1500; // ms
          const lastAttack = updatedCombatCooldowns.get(soldier.id) || 0;

          // Check for enemy units nearby
          const enemyUnit = updatedUnits.find((u) => {
            if (u.owner === soldier.owner || u.type === "villager") return false;
            return distance(soldier.position, u.position) <= attackRange;
          });

          // Check for enemy buildings nearby
          const enemyBuilding = updatedBuildings.find((b) => {
            if (b.owner === soldier.owner) return false;
            return distance(soldier.position, b.position) <= attackRange + 20;
          });

          const target = enemyUnit || enemyBuilding;

          if (target && now - lastAttack >= attackCooldown) {
            updatedCombatCooldowns.set(soldier.id, now);

            if (enemyUnit) {
              // Attack enemy unit
              enemyUnit.health -= 5;
              if (enemyUnit.health <= 0) {
                const index = updatedUnits.findIndex((u) => u.id === enemyUnit.id);
                if (index !== -1) {
                  updatedUnits.splice(index, 1);
                  addLog(`${civs.find(c => c.id === soldier.owner)?.name} eliminó una unidad enemiga.`);
                }
              }
            } else if (enemyBuilding) {
              // Attack enemy building
              const damage = 3;
              const buildingIndex = updatedBuildings.findIndex((b) => b.id === enemyBuilding.id);
              if (buildingIndex !== -1) {
                updatedBuildings[buildingIndex] = {
                  ...updatedBuildings[buildingIndex],
                  health: Math.max(0, updatedBuildings[buildingIndex].health - damage)
                };
                
                const civIndex = updatedCivs.findIndex((c) => c.id === enemyBuilding.owner);
                if (civIndex !== -1) {
                  updatedCivs[civIndex] = {
                    ...updatedCivs[civIndex],
                    baseHealth: updatedBuildings[buildingIndex].health
                  };
                }

                if (updatedBuildings[buildingIndex].health <= 0) {
                  addLog(`${civs.find(c => c.id === soldier.owner)?.name} destruyó la base enemiga!`);
                }
              }
            }
          }
        });

        setCivs(updatedCivs);
        setGatheringUnits(updatedGathering);
        setCombatCooldowns(updatedCombatCooldowns);

        return {
          ...prev,
          units: updatedUnits.filter((u) => u.health > 0),
          resources: updatedResources.filter((r) => r.amount > 0),
          buildings: updatedBuildings.filter((b) => b.health > 0)
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [civs, gatheringUnits, combatCooldowns, addLog]);

  const handleUnitSelect = useCallback((unitIds: string[]) => {
    setSelectedUnits(unitIds);
    setGameState((prev) => ({
      ...prev,
      units: prev.units.map((u) => ({
        ...u,
        isSelected: unitIds.includes(u.id)
      }))
    }));
  }, []);

  const handleUnitMove = useCallback((unitIds: string[], position: Position) => {
    setGameState((prev) => {
      // Spread units around target position
      const updatedUnits = prev.units.map((unit) => {
        if (!unitIds.includes(unit.id)) return unit;

        const index = unitIds.indexOf(unit.id);
        const offsetX = (index % 3 - 1) * 30;
        const offsetY = Math.floor(index / 3) * 30;

        return {
          ...unit,
          targetPosition: {
            x: position.x + offsetX,
            y: position.y + offsetY
          },
          isMoving: true
        };
      });

      return { ...prev, units: updatedUnits };
    });

    // Stop gathering if moving
    setGatheringUnits((prev) => {
      const updated = new Map(prev);
      unitIds.forEach((id) => updated.delete(id));
      return updated;
    });
  }, []);

  const handleResourceGather = useCallback((unitId: string, resourceId: string) => {
    const unit = gameState.units.find((u) => u.id === unitId);
    const resource = gameState.resources.find((r) => r.id === resourceId);

    if (!unit || !resource || unit.type !== "villager") return;

    // Move unit to resource
    handleUnitMove([unitId], resource.position);

    // Start gathering
    setGatheringUnits((prev) => {
      const updated = new Map(prev);
      updated.set(unitId, { resourceId, lastGather: Date.now() });
        return updated;
    });
  }, [gameState, handleUnitMove]);

  const handleTrain = (civId: string, unitType: UnitType) => {
    const civ = civs.find((item) => item.id === civId);
    if (!civ) return;

      const cost =
      unitType === "villager"
          ? { food: 35, wood: 0, gold: 0 }
          : { food: 30, wood: 15, gold: 15 };

      const canPay = (Object.keys(cost) as ResourceKey[]).every(
        (key) => civ.resources[key] >= cost[key]
      );

      if (!canPay) {
      addLog(`${civ.name} no tiene recursos para entrenar un ${UNIT_LABEL[unitType]}.`);
      return;
    }

    // Find townhall position
    const townhall = gameState.buildings.find((b) => b.owner === civId);
    if (!townhall) return;

    // Create new unit near townhall
    const newUnit: Unit = {
      id: `unit-${civId}-${Date.now()}`,
      type: unitType,
      position: {
        x: townhall.position.x + (Math.random() - 0.5) * 40,
        y: townhall.position.y + (Math.random() - 0.5) * 40
      },
      owner: civId,
      isSelected: false,
      isMoving: false,
      health: unitType === "villager" ? 25 : 40,
      maxHealth: unitType === "villager" ? 25 : 40
    };

    setCivs((prev) =>
      prev.map((item) => {
        if (item.id !== civId) return item;
        const newResources = (Object.keys(cost) as ResourceKey[]).reduce(
          (acc, key) => ({
            ...acc,
            [key]: item.resources[key] - cost[key]
          }),
          item.resources
        );
        return {
          ...item,
          resources: newResources
        };
      })
    );

    setGameState((prev) => ({
      ...prev,
      units: [...prev.units, newUnit]
    }));

    addLog(`${civ.name} entrenó un ${UNIT_LABEL[unitType]}.`);
  };

  const handleAttack = (attackerId: string, defenderId: string) => {
    const attacker = civs.find((civ) => civ.id === attackerId);
    const defender = civs.find((civ) => civ.id === defenderId);
    if (!attacker || !defender) return;

    const attackerSoldiers = gameState.units.filter(
      (u) => u.owner === attackerId && u.type === "soldier"
    );
    const defenderSoldiers = gameState.units.filter(
      (u) => u.owner === defenderId && u.type === "soldier"
    );

    if (attackerSoldiers.length === 0) {
        addLog(`${attacker.name} no tiene ejército para atacar.`);
      return;
    }

    // Move soldiers to enemy townhall
    const enemyTownhall = gameState.buildings.find((b) => b.owner === defenderId);
    if (enemyTownhall) {
      attackerSoldiers.forEach((soldier, index) => {
        const offsetX = (index % 5 - 2) * 20;
        const offsetY = Math.floor(index / 5) * 20;
        handleUnitMove([soldier.id], {
          x: enemyTownhall.position.x + offsetX,
          y: enemyTownhall.position.y + offsetY
        });
      });
    }

    const power = attackerSoldiers.length * 9 + Math.floor(attacker.resources.wood / 60);
      const defenderLosses = Math.min(
      defenderSoldiers.length,
        Math.max(0, Math.floor(power / 15))
      );

    // Remove killed soldiers
    setGameState((prev) => {
      const updatedUnits = [...prev.units];
      let removed = 0;
      for (let i = updatedUnits.length - 1; i >= 0 && removed < defenderLosses; i--) {
        if (updatedUnits[i].owner === defenderId && updatedUnits[i].type === "soldier") {
          updatedUnits.splice(i, 1);
          removed++;
        }
      }
      return { ...prev, units: updatedUnits };
    });

      const nextHealth = Math.max(0, defender.baseHealth - power);

    setCivs((prev) =>
      prev.map((civ) => {
        if (civ.id === defenderId) {
          return {
            ...civ,
            baseHealth: nextHealth
          };
        }
        if (civ.id === attackerId) {
          return {
            ...civ,
            resources: { ...civ.resources, wood: Math.max(0, civ.resources.wood - 15) }
          };
        }
        return civ;
      })
    );

    // Update building health
    setGameState((prev) => ({
      ...prev,
      buildings: prev.buildings.map((b) =>
        b.owner === defenderId ? { ...b, health: nextHealth } : b
      )
    }));

      const winnerTag = nextHealth <= 0 ? " (¡base destruida!)" : "";
      addLog(
        `${attacker.name} asaltó a ${defender.name} causando ${power} de daño${winnerTag}.`
      );
  };

  const handleReset = () => {
    setCivs(INITIAL_CIVS);
    setGameState(initializeGame);
    setSelectedUnits([]);
    setGatheringUnits(new Map());
    setCombatCooldowns(new Map());
    setLog(["Nuevo mapa generado. ¡Reúne, expande y ataca!"]);
  };

  const playerUnits = gameState.units.filter((u) => u.owner === "solari");
  const playerVillagers = playerUnits.filter((u) => u.type === "villager").length;
  const playerSoldiers = playerUnits.filter((u) => u.type === "soldier").length;

  const enemyUnits = gameState.units.filter((u) => u.owner === "aurora");
  const enemyVillagers = enemyUnits.filter((u) => u.type === "villager").length;
  const enemySoldiers = enemyUnits.filter((u) => u.type === "soldier").length;

  return (
    <main
      style={{
        padding: "32px 22px 60px",
        maxWidth: 1400,
        margin: "0 auto",
        position: "relative"
      }}
    >
      <div
        className="grid-overlay"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.35,
          pointerEvents: "none"
        }}
      />
      <header
        className="card glass"
        style={{
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
          marginBottom: 26
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% -10%, rgba(255,255,255,0.1), transparent 40%)",
            pointerEvents: "none"
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
              border: "1px solid var(--panel-strong)"
            }}
          />
          <div>
            <div className="hero-title" style={{ fontSize: 18, color: "#fcd34d" }}>
              AGE OF POCKET EMPIRES
            </div>
            <div style={{ color: "var(--muted)", maxWidth: 720 }}>
              Pequeña batalla 1v1. Recolecta recursos, entrena tropas y destruye la base rival.
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button
              className="button"
              onClick={handleReset}
              style={{
                background: "linear-gradient(135deg, var(--accent-2), #0ea5e9)",
                color: "#0b0e13"
              }}
            >
              Reiniciar mapa
            </button>
          </div>
        </div>
      </header>

      {isGameOver && (
        <div
          className="card glass"
          style={{
            marginBottom: 20,
            padding: 18,
            border: "1px solid var(--panel-strong)",
            background: "linear-gradient(90deg, rgba(56,189,248,0.25), rgba(249,115,22,0.25))"
          }}
        >
          {civs
            .filter((c) => c.baseHealth > 0)
            .map((c) => (
              <div key={c.id} style={{ fontWeight: 700 }}>
                {c.name} domina el mapa.
              </div>
            ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 18, position: "relative", zIndex: 1, minHeight: "600px" }}>
        {/* Game Canvas */}
        <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
          <EnhancedGameCanvas
            units={gameState.units}
            resources={gameState.resources}
            buildings={gameState.buildings}
            selectedUnits={selectedUnits}
            onUnitSelect={handleUnitSelect}
            onUnitMove={handleUnitMove}
            onResourceGather={handleResourceGather}
            playerCivId="solari"
          />
        </div>

        {/* UI Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {civs.map((civ) => {
          const healthPercent = Math.max(0, Math.min(100, (civ.baseHealth / 100) * 100));
            const population = civ.id === "solari" 
              ? playerVillagers + playerSoldiers 
              : enemyVillagers + enemySoldiers;
          const enemy = civs.find((c) => c.id !== civ.id) as Civilization;
            const isPlayer = civ.id === "solari";

          return (
            <div
              key={civ.id}
              className="card glass"
              style={{
                padding: 18,
                border: `1px solid ${civ.accent}33`,
                boxShadow: `0 8px 40px ${civ.accent}20`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: civ.accent,
                    boxShadow: `0 0 0 6px ${civ.accent}25`
                  }}
                />
                <div style={{ fontSize: 18, fontWeight: 800 }}>{civ.name}</div>
                <div style={{ color: "#cbd5f5", fontSize: 12, marginLeft: "auto" }}>{civ.trait}</div>
              </div>

              <div style={{ height: 8, borderRadius: 999, background: "#0b1624", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${healthPercent}%`,
                    background: `linear-gradient(90deg, ${civ.accent}, ${civ.color})`,
                    height: "100%"
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Durabilidad de base: {civ.baseHealth}
              </div>

              <div className="divider" />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {(Object.keys(civ.resources) as ResourceKey[]).map((resKey) => (
                  <div
                    key={resKey}
                    className="card"
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid var(--panel-strong)"
                    }}
                  >
                    <div style={{ color: "#cbd5f5", fontSize: 12 }}>{RESOURCE_LABEL[resKey]}</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{civ.resources[resKey]}</div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                <ActionCard
                  title={`${UNIT_LABEL.villager}s`}
                  subtitle="Mejora la economía"
                    count={isPlayer ? playerVillagers : enemyVillagers}
                  color={civ.accent}
                  actionLabel="Entrenar aldeano"
                  onAction={() => handleTrain(civ.id, "villager")}
                    disabled={isGameOver || !isPlayer}
                  costs={{ food: 35 }}
                />
                <ActionCard
                  title={`${UNIT_LABEL.soldier}s`}
                  subtitle="Defensa y ataque"
                    count={isPlayer ? playerSoldiers : enemySoldiers}
                  color={civ.color}
                  actionLabel="Entrenar soldado"
                  onAction={() => handleTrain(civ.id, "soldier")}
                    disabled={isGameOver || !isPlayer}
                  costs={{ food: 30, wood: 15, gold: 15 }}
                />
              </div>

              <div className="divider" />

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    Población: {population} | Defensa: {Math.round((isPlayer ? playerSoldiers : enemySoldiers) * 5 + civ.baseHealth / 10)}
                </div>
                  {isPlayer && (
                <div style={{ marginLeft: "auto" }}>
                  <button
                    className="button"
                    onClick={() => handleAttack(civ.id, enemy.id)}
                    style={{
                      background: `linear-gradient(135deg, ${civ.color}, ${civ.accent})`,
                      color: "#0b0e13"
                    }}
                    disabled={isGameOver}
                  >
                    Atacar {enemy.name.split(" ")[0]}
                  </button>
                </div>
                  )}
              </div>
            </div>
          );
        })}

      <section
        className="card glass"
        style={{
          padding: 16,
          border: "1px solid var(--panel-strong)",
              maxHeight: "300px",
              overflowY: "auto"
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Eventos recientes</div>
        <div style={{ display: "grid", gap: 8 }}>
          {log.map((entry, index) => (
            <div
              key={entry + index}
              style={{
                padding: 12,
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--panel-strong)",
                    fontSize: "12px"
              }}
            >
              {entry}
            </div>
          ))}
        </div>
      </section>
        </div>
      </div>
    </main>
  );
}

type ActionCardProps = {
  title: string;
  subtitle: string;
  count: number;
  color: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  costs: Partial<Record<ResourceKey, number>>;
};

function ActionCard({
  title,
  subtitle,
  count,
  color,
  actionLabel,
  onAction,
  disabled,
  costs
}: ActionCardProps) {
  const costString = Object.entries(costs)
    .map(([key, value]) => `${RESOURCE_LABEL[key as ResourceKey]} ${value}`)
    .join(" · ");

  return (
    <div
      className="card"
      style={{
        padding: 12,
        border: "1px solid var(--panel-strong)",
        borderRadius: 14
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 0 4px ${color}25`
          }}
        />
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{subtitle}</div>
        </div>
        <div style={{ marginLeft: "auto", fontWeight: 800 }}>{count}</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0" }}>
        Costos: {costString}
      </div>
      <button
        className="button"
        onClick={onAction}
        style={{ width: "100%", background: color, color: "#0b0e13" }}
        disabled={disabled}
      >
        {actionLabel}
      </button>
    </div>
  );
}
