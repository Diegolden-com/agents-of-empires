"use client";

import { useEffect, useRef, useState } from "react";
import type { Unit, Resource, Building, Position, ResourceType, UnitType } from "../types/game";

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

interface GameCanvasProps {
  units: Unit[];
  resources: Resource[];
  buildings: Building[];
  selectedUnits: string[];
  onUnitSelect: (unitIds: string[]) => void;
  onUnitMove: (unitIds: string[], position: Position) => void;
  onResourceGather: (unitId: string, resourceId: string) => void;
  playerCivId: string;
}

export default function GameCanvas({
  units,
  resources,
  buildings,
  selectedUnits,
  onUnitSelect,
  onUnitMove,
  onResourceGather,
  playerCivId
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: Position; end: Position } | null>(null);

  // Draw sprite functions
  const drawVillager = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isSelected: boolean) => {
    ctx.save();
    
    if (isSelected) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body (circle)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#ffdbac";
    ctx.beginPath();
    ctx.arc(x, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Tool (pickaxe/axe)
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 2);
    ctx.lineTo(x + 10, y - 6);
    ctx.stroke();

    ctx.restore();
  };

  const drawSoldier = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isSelected: boolean) => {
    ctx.save();
    
    if (isSelected) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body (square/torso)
    ctx.fillStyle = color;
    ctx.fillRect(x - 6, y - 4, 12, 10);

    // Head
    ctx.fillStyle = "#ffdbac";
    ctx.beginPath();
    ctx.arc(x, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Weapon (sword)
    ctx.strokeStyle = "#c0c0c0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x + 10, y - 10);
    ctx.stroke();

    ctx.restore();
  };

  const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Trunk
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(x - 3, y + 2, 6, 10);

    // Leaves (circle)
    ctx.fillStyle = "#228b22";
    ctx.beginPath();
    ctx.arc(x, y - 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawGoldMine = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Rock base
    ctx.fillStyle = "#696969";
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Gold sparkle
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawFood = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Berry bush
    ctx.fillStyle = "#2d5016";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Berries
    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawTownHall = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, health: number, maxHealth: number) => {
    ctx.save();
    
    // Base
    ctx.fillStyle = color;
    ctx.fillRect(x - 15, y - 10, 30, 20);

    // Roof
    ctx.fillStyle = "#8b4513";
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 10);
    ctx.lineTo(x, y - 20);
    ctx.lineTo(x + 15, y - 10);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = "#654321";
    ctx.fillRect(x - 4, y + 2, 8, 8);

    // Health bar
    const healthPercent = health / maxHealth;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x - 12, y - 25, 24, 4);
    ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000";
    ctx.fillRect(x - 12, y - 25, 24 * healthPercent, 4);

    ctx.restore();
  };

  const worldToScreen = (worldPos: Position): Position => {
    return {
      x: worldPos.x - camera.x,
      y: worldPos.y - camera.y
    };
  };

  const screenToWorld = (screenPos: Position): Position => {
    return {
      x: screenPos.x + camera.x,
      y: screenPos.y + camera.y
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#2d5016";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let x = -camera.x % TILE_SIZE; x < canvas.width; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = -camera.y % TILE_SIZE; y < canvas.height; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw resources
    resources.forEach((resource) => {
      const screenPos = worldToScreen(resource.position);
      if (screenPos.x < -50 || screenPos.x > canvas.width + 50 || 
          screenPos.y < -50 || screenPos.y > canvas.height + 50) return;

      switch (resource.type) {
        case "wood":
          drawTree(ctx, screenPos.x, screenPos.y);
          break;
        case "gold":
          drawGoldMine(ctx, screenPos.x, screenPos.y);
          break;
        case "food":
          drawFood(ctx, screenPos.x, screenPos.y);
          break;
      }
    });

    // Draw buildings
    buildings.forEach((building) => {
      const screenPos = worldToScreen(building.position);
      if (screenPos.x < -50 || screenPos.x > canvas.width + 50 || 
          screenPos.y < -50 || screenPos.y > canvas.height + 50) return;

      const civ = building.owner === playerCivId ? "#f59e0b" : "#22d3ee";
      drawTownHall(ctx, screenPos.x, screenPos.y, civ, building.health, building.maxHealth);
    });

    // Draw units
    units.forEach((unit) => {
      const screenPos = worldToScreen(unit.position);
      if (screenPos.x < -50 || screenPos.x > canvas.width + 50 || 
          screenPos.y < -50 || screenPos.y > canvas.height + 50) return;

      const isSelected = selectedUnits.includes(unit.id);
      const color = unit.owner === playerCivId ? "#f59e0b" : "#22d3ee";

      if (unit.type === "villager") {
        drawVillager(ctx, screenPos.x, screenPos.y, color, isSelected);
      } else {
        drawSoldier(ctx, screenPos.x, screenPos.y, color, isSelected);
      }

      // Draw target position indicator
      if (unit.targetPosition && unit.isMoving) {
        const targetScreen = worldToScreen(unit.targetPosition);
        ctx.strokeStyle = unit.type === "soldier" ? "#ff4444" : "#00ff00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y);
        ctx.lineTo(targetScreen.x, targetScreen.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target marker
        ctx.fillStyle = unit.type === "soldier" ? "#ff4444" : "#00ff00";
        ctx.beginPath();
        ctx.arc(targetScreen.x, targetScreen.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Health bar for units
      if (unit.health < unit.maxHealth) {
        const healthPercent = unit.health / unit.maxHealth;
        ctx.fillStyle = "#000000";
        ctx.fillRect(screenPos.x - 12, screenPos.y - 20, 24, 4);
        ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000";
        ctx.fillRect(screenPos.x - 12, screenPos.y - 20, 24 * healthPercent, 4);
      }
    });

    // Draw selection box
    if (selectionBox) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const x = Math.min(selectionBox.start.x, selectionBox.end.x);
      const y = Math.min(selectionBox.start.y, selectionBox.end.y);
      const w = Math.abs(selectionBox.end.x - selectionBox.start.x);
      const h = Math.abs(selectionBox.end.y - selectionBox.start.y);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    const animationFrame = () => {
      draw();
      requestAnimationFrame(animationFrame);
    };

    animationFrame();
  }, [units, resources, buildings, selectedUnits, camera, selectionBox]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld({ x, y });

    // Check if clicking on a unit
    const clickedUnit = units.find((unit) => {
      const dx = unit.position.x - worldPos.x;
      const dy = unit.position.y - worldPos.y;
      return Math.sqrt(dx * dx + dy * dy) < 20 && unit.owner === playerCivId;
    });

    if (clickedUnit) {
      if (e.shiftKey) {
        // Add to selection
        onUnitSelect([...selectedUnits, clickedUnit.id]);
      } else {
        // New selection
        onUnitSelect([clickedUnit.id]);
      }
      setIsDragging(false);
    } else {
      // Start selection box
      setIsSelecting(true);
      setSelectionBox({ start: { x, y }, end: { x, y } });
      if (!e.shiftKey) {
        onUnitSelect([]);
      }
    }

    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isSelecting && selectionBox) {
      setSelectionBox({ ...selectionBox, end: { x, y } });
    }

    // Camera pan with middle mouse or space + drag
    if (isDragging && dragStart) {
      const dx = dragStart.x - x;
      const dy = dragStart.y - y;
      setCamera({
        x: camera.x + dx,
        y: camera.y + dy
      });
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld({ x, y });

    if (isSelecting && selectionBox) {
      // Select units in box
      const boxStart = screenToWorld(selectionBox.start);
      const boxEnd = worldPos;
      const minX = Math.min(boxStart.x, boxEnd.x);
      const maxX = Math.max(boxStart.x, boxEnd.x);
      const minY = Math.min(boxStart.y, boxEnd.y);
      const maxY = Math.max(boxStart.y, boxEnd.y);

      const unitsInBox = units.filter((unit) => {
        return unit.owner === playerCivId &&
          unit.position.x >= minX &&
          unit.position.x <= maxX &&
          unit.position.y >= minY &&
          unit.position.y <= maxY;
      });

      if (e.shiftKey) {
        onUnitSelect([...selectedUnits, ...unitsInBox.map(u => u.id)]);
      } else {
        onUnitSelect(unitsInBox.map(u => u.id));
      }

      setIsSelecting(false);
      setSelectionBox(null);
    } else if (selectedUnits.length > 0 && !isDragging) {
      // Move selected units
      onUnitMove(selectedUnits, worldPos);
    }

    setIsDragging(false);
    setDragStart(null);
  };

  const handleRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld({ x, y });

    if (selectedUnits.length > 0) {
      // Check if clicking on resource
      const clickedResource = resources.find((resource) => {
        const dx = resource.position.x - worldPos.x;
        const dy = resource.position.y - worldPos.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });

      if (clickedResource) {
        // Gather resource
        selectedUnits.forEach((unitId) => {
          const unit = units.find(u => u.id === unitId);
          if (unit && unit.type === "villager") {
            onResourceGather(unitId, clickedResource.id);
          }
        });
      } else {
        // Move to position
        onUnitMove(selectedUnits, worldPos);
      }
    }
  };

  return (
    <div style={{ position: "relative", border: "2px solid #444", borderRadius: "8px", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setIsSelecting(false);
          setSelectionBox(null);
        }}
        onContextMenu={handleRightClick}
        style={{ cursor: "crosshair", display: "block" }}
      />
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(0, 0, 0, 0.7)",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#fff"
      }}>
        Click para seleccionar | Click derecho para mover/recolectar | Shift+Click para multi-selección
      </div>
    </div>
  );
}

