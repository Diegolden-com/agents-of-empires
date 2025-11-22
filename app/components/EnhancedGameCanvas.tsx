"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import type { Unit, Resource, Building, Position, ResourceType, UnitType } from "../types/game";

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

interface EnhancedGameCanvasProps {
  units: Unit[];
  resources: Resource[];
  buildings: Building[];
  selectedUnits: string[];
  onUnitSelect: (unitIds: string[]) => void;
  onUnitMove: (unitIds: string[], position: Position) => void;
  onResourceGather: (unitId: string, resourceId: string) => void;
  playerCivId: string;
}

type TerrainType = "grass" | "dirt" | "water" | "mountain" | "sand";

interface TerrainTile {
  type: TerrainType;
  x: number;
  y: number;
}

export default function EnhancedGameCanvas({
  units,
  resources,
  buildings,
  selectedUnits,
  onUnitSelect,
  onUnitMove,
  onResourceGather,
  playerCivId
}: EnhancedGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const selectionGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const gameLayerRef = useRef<PIXI.Container | null>(null);
  const cameraContainerRef = useRef<PIXI.Container | null>(null);
  const [camera, setCamera] = useState<Position>({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Position | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Position | null>(null);
  const terrainMapRef = useRef<TerrainTile[][]>([]);

  // Refs to always have latest values in event handlers
  const unitsRef = useRef(units);
  const resourcesRef = useRef(resources);
  const selectedUnitsRef = useRef(selectedUnits);
  const cameraRef = useRef(camera);

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    selectedUnitsRef.current = selectedUnits;
  }, [selectedUnits]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Generate terrain map
  const generateTerrain = (): TerrainTile[][] => {
    const terrain: TerrainTile[][] = [];
    const noise = (x: number, y: number) => {
      return Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.random() * 0.3;
    };

    for (let y = 0; y < MAP_HEIGHT; y++) {
      terrain[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const n = noise(x, y);
        let type: TerrainType = "grass";
        
        if (n < -0.3) {
          type = "water";
        } else if (n < -0.1) {
          type = "sand";
        } else if (n < 0.2) {
          type = "grass";
        } else if (n < 0.5) {
          type = "dirt";
        } else {
          type = "mountain";
        }

        terrain[y][x] = { type, x, y };
      }
    }

    return terrain;
  };

  // Create terrain texture using traditional API
  const createTerrainTexture = (app: PIXI.Application, type: TerrainType): PIXI.Texture => {
    const graphics = new PIXI.Graphics();
    const size = TILE_SIZE;

    switch (type) {
      case "grass":
        // Base grass color with gradient effect
        graphics.beginFill(0x4a7c3f);
        graphics.drawRect(0, 0, size, size);

        // Add darker grass patches for depth
        graphics.beginFill(0x3d6633, 0.4);
        for (let i = 0; i < 4; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 3 + Math.random() * 2);
        }

        // Add lighter grass highlights
        graphics.beginFill(0x5a8c4f, 0.6);
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 2 + Math.random() * 1.5);
        }

        // Add grass blades (small lines)
        graphics.lineStyle(0.5, 0x6fa855, 0.5);
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const length = 1 + Math.random() * 2;
          graphics.moveTo(x, y);
          graphics.lineTo(x + (Math.random() - 0.5), y - length);
        }

        // Add tiny flowers/details
        graphics.beginFill(0x8fbc8f, 0.3);
        for (let i = 0; i < 3; i++) {
          graphics.drawCircle(Math.random() * size, Math.random() * size, 0.5);
        }
        break;

      case "dirt":
        // Base dirt color with gradient
        graphics.beginFill(0x8b6f47);
        graphics.drawRect(0, 0, size, size);

        // Add darker dirt patches
        graphics.beginFill(0x6b4f27, 0.5);
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 3 + Math.random() * 3);
        }

        // Add lighter dirt spots
        graphics.beginFill(0x9b7f57, 0.4);
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 2 + Math.random() * 2);
        }

        // Add small pebbles/stones
        graphics.beginFill(0x7a5f37, 0.7);
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 0.5 + Math.random() * 1);
        }

        // Add dirt texture lines
        graphics.lineStyle(0.3, 0x5a3f17, 0.3);
        for (let i = 0; i < 6; i++) {
          const x1 = Math.random() * size;
          const y1 = Math.random() * size;
          const length = 2 + Math.random() * 4;
          graphics.moveTo(x1, y1);
          graphics.lineTo(x1 + length, y1 + (Math.random() - 0.5) * 2);
        }
        break;
      case "water":
        // Base water with depth gradient
        graphics.beginFill(0x2e5c8a);
        graphics.drawRect(0, 0, size, size);

        // Darker water areas for depth
        graphics.beginFill(0x1e4c6a, 0.5);
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 4 + Math.random() * 4);
        }

        // Light reflections
        graphics.beginFill(0x4e7c9a, 0.4);
        for (let i = 0; i < 4; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 2 + Math.random() * 2);
        }

        // Animated water ripples (wavy lines)
        graphics.lineStyle(0.5, 0x5e8caa, 0.4);
        for (let i = 0; i < 4; i++) {
          const startX = Math.random() * size;
          const startY = Math.random() * size;
          graphics.moveTo(startX, startY);
          graphics.quadraticCurveTo(
            startX + 4, startY + (Math.random() - 0.5) * 3,
            startX + 8, startY
          );
        }
        break;

      case "sand":
        // Base sand color
        graphics.beginFill(0xd4c5a9);
        graphics.drawRect(0, 0, size, size);

        // Darker sand patches
        graphics.beginFill(0xc4b599, 0.4);
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 3 + Math.random() * 3);
        }

        // Lighter sand highlights
        graphics.beginFill(0xe4d5b9, 0.5);
        for (let i = 0; i < 7; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 1.5 + Math.random() * 2);
        }

        // Sand grains (tiny dots)
        graphics.beginFill(0xf4e5c9, 0.3);
        for (let i = 0; i < 15; i++) {
          graphics.drawCircle(Math.random() * size, Math.random() * size, 0.5);
        }

        // Small rocks
        graphics.beginFill(0xa49585, 0.6);
        for (let i = 0; i < 3; i++) {
          graphics.drawCircle(Math.random() * size, Math.random() * size, 0.8 + Math.random() * 0.7);
        }
        break;

      case "mountain":
        // Base rocky ground
        graphics.beginFill(0x6b5d4f);
        graphics.drawRect(0, 0, size, size);

        // Add rocky texture
        graphics.beginFill(0x5b4d3f, 0.6);
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 2 + Math.random() * 2.5);
        }

        // Mountain peak/rocks
        graphics.beginFill(0x4b3d2f);
        const peakX = size * (0.3 + Math.random() * 0.4);
        const peakY = size * (0.2 + Math.random() * 0.2);
        graphics.drawPolygon([
          peakX, peakY,
          peakX + 6, peakY + 3,
          peakX + 8, peakY + 8,
          peakX - 2, peakY + 8,
          peakX - 4, peakY + 3
        ]);

        // Light areas (highlights)
        graphics.beginFill(0x7b6d5f, 0.5);
        for (let i = 0; i < 4; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          graphics.drawCircle(x, y, 1.5 + Math.random() * 1.5);
        }

        // Cracks/details
        graphics.lineStyle(0.4, 0x3b2d1f, 0.5);
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const length = 2 + Math.random() * 4;
          graphics.moveTo(x, y);
          graphics.lineTo(x + length * (Math.random() - 0.5), y + length);
        }
        break;
    }
    graphics.endFill();

    const texture = app.renderer.generateTexture(graphics);
    graphics.destroy(); // Destroy graphics after generating texture
    return texture;
  };

  // Create unit sprite
  const createUnitSprite = (app: PIXI.Application, unit: Unit): PIXI.Container => {
    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    const isSelected = selectedUnits.includes(unit.id);
    const color = unit.owner === playerCivId ? 0xf59e0b : 0x22d3ee;

    // Shadow
    graphics.beginFill(0x000000, 0.3);
    graphics.drawEllipse(0, 12, 10, 4);
    graphics.endFill();

    if (unit.type === "villager") {
      // Body
      graphics.beginFill(color);
      graphics.drawCircle(0, 0, 8);
      graphics.endFill();

      // Head
      graphics.beginFill(0xffdbac);
      graphics.drawCircle(0, -6, 5);
      graphics.endFill();

      // Tool
      graphics.lineStyle(2, 0x8b4513);
      graphics.moveTo(6, -2);
      graphics.lineTo(10, -6);
      graphics.endFill();

      // Clothes detail
      graphics.beginFill(color, 0.7);
      graphics.drawRect(-6, 2, 12, 6);
      graphics.endFill();
    } else {
      // Soldier body
      graphics.beginFill(color);
      graphics.drawRoundedRect(-6, -4, 12, 10, 2);
      graphics.endFill();

      // Head
      graphics.beginFill(0xffdbac);
      graphics.drawCircle(0, -8, 5);
      graphics.endFill();

      // Helmet
      graphics.lineStyle(2, color);
      graphics.beginFill(color, 0.5);
      graphics.arc(0, -8, 6, Math.PI, 0);
      graphics.endFill();

      // Weapon (sword)
      graphics.lineStyle(2, 0xc0c0c0);
      graphics.beginFill(0xc0c0c0);
      graphics.drawPolygon([6, -6, 10, -10, 8, -12, 6, -10]);
      graphics.endFill();
    }

    // Selection ring
    if (isSelected) {
      graphics.lineStyle(3, 0xffff00, 0.8);
      graphics.drawCircle(0, 0, 18);
      graphics.endFill();
    }

    // Health bar
    if (unit.health < unit.maxHealth) {
      const healthPercent = unit.health / unit.maxHealth;
      graphics.beginFill(0x000000, 0.7);
      graphics.drawRect(-12, -20, 24, 4);
      graphics.endFill();
      graphics.beginFill(healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000);
      graphics.drawRect(-12, -20, 24 * healthPercent, 4);
      graphics.endFill();
    }

    const texture = app.renderer.generateTexture(graphics);
    graphics.destroy(); // Destroy graphics after generating texture
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    return container;
  };

  // Create resource sprite
  const createResourceSprite = (app: PIXI.Application, resource: Resource): PIXI.Container => {
    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();

    switch (resource.type) {
      case "wood":
        // Tree trunk
        graphics.beginFill(0x8b4513);
        graphics.drawRoundedRect(-3, 2, 6, 10, 1);
        graphics.endFill();

        // Leaves
        graphics.beginFill(0x228b22);
        graphics.drawCircle(0, -2, 10);
        graphics.endFill();
        graphics.beginFill(0x2d9b2d);
        graphics.drawCircle(-3, -4, 6);
        graphics.drawCircle(3, -4, 6);
        graphics.drawCircle(0, -6, 7);
        graphics.endFill();
        break;

      case "gold":
        // Rock base
        graphics.beginFill(0x696969);
        graphics.drawCircle(0, 0, 12);
        graphics.endFill();
        graphics.beginFill(0x5a5a5a);
        graphics.drawCircle(-3, 2, 4);
        graphics.drawCircle(3, -2, 3);
        graphics.endFill();

        // Gold veins
        graphics.lineStyle(2, 0xffd700, 0.8);
        graphics.moveTo(-6, -4);
        graphics.lineTo(-2, 0);
        graphics.lineTo(2, -2);
        graphics.lineTo(6, 2);
        graphics.endFill();

        // Gold sparkles
        graphics.beginFill(0xffd700);
        graphics.drawCircle(-4, -4, 3);
        graphics.drawCircle(4, 2, 2);
        graphics.drawCircle(0, 3, 2);
        graphics.endFill();
        break;

      case "food":
        // Bush base
        graphics.beginFill(0x2d5016);
        graphics.drawCircle(0, 0, 8);
        graphics.endFill();

        // Berries
        graphics.beginFill(0x8b0000);
        graphics.drawCircle(-3, -2, 2.5);
        graphics.drawCircle(3, 0, 2.5);
        graphics.drawCircle(0, 2, 2.5);
        graphics.drawCircle(-2, 1, 2);
        graphics.drawCircle(2, -1, 2);
        graphics.endFill();

        // Leaves
        graphics.beginFill(0x3d6026);
        graphics.drawCircle(-4, -3, 3);
        graphics.drawCircle(4, -2, 3);
        graphics.drawCircle(-3, 3, 3);
        graphics.drawCircle(3, 3, 3);
        graphics.endFill();
        break;
    }

    // Shadow
    graphics.beginFill(0x000000, 0.2);
    graphics.drawEllipse(0, 8, 16, 4);
    graphics.endFill();

    const texture = app.renderer.generateTexture(graphics);
    graphics.destroy(); // Destroy graphics after generating texture
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    return container;
  };

  // Create building sprite
  const createBuildingSprite = (app: PIXI.Application, building: Building): PIXI.Container => {
    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    const color = building.owner === playerCivId ? 0xf59e0b : 0x22d3ee;

    // Shadow
    graphics.beginFill(0x000000, 0.4);
    graphics.drawEllipse(0, 15, 30, 8);
    graphics.endFill();

    // Base
    graphics.beginFill(color);
    graphics.drawRoundedRect(-15, -10, 30, 20, 3);
    graphics.endFill();

    // Roof
    graphics.beginFill(0x8b4513);
    graphics.drawPolygon([-15, -10, 0, -20, 15, -10]);
    graphics.endFill();

    // Roof tiles detail
    graphics.lineStyle(1, 0x654321);
    for (let i = -12; i <= 12; i += 6) {
      graphics.moveTo(i, -10);
      graphics.lineTo(i + 3, -15);
    }
    graphics.endFill();

    // Windows
    graphics.beginFill(0xffd700, 0.6);
    graphics.drawRect(-8, -5, 4, 4);
    graphics.drawRect(4, -5, 4, 4);
    graphics.endFill();

    // Door
    graphics.beginFill(0x654321);
    graphics.drawRoundedRect(-4, 2, 8, 8, 1);
    graphics.endFill();
    graphics.lineStyle(2, 0x543210);
    graphics.drawRoundedRect(-4, 2, 8, 8, 1);
    graphics.endFill();

    // Health bar
    const healthPercent = building.health / building.maxHealth;
    graphics.beginFill(0x000000, 0.7);
    graphics.drawRect(-12, -25, 24, 5);
    graphics.endFill();
    graphics.beginFill(healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000);
    graphics.drawRect(-12, -25, 24 * healthPercent, 5);
    graphics.endFill();
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.drawRect(-12, -25, 24, 5);
    graphics.endFill();

    const texture = app.renderer.generateTexture(graphics);
    graphics.destroy(); // Destroy graphics after generating texture
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    return container;
  };

  // Initialize PixiJS (only once)
  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double initialization
    if (appRef.current) return;

    // Get container dimensions - wait for container to be sized
    const getContainerSize = () => {
      if (!containerRef.current) return { width: 800, height: 600 };
      const rect = containerRef.current.getBoundingClientRect();
      // Use computed styles to get actual size
      const computedStyle = window.getComputedStyle(containerRef.current);
      const width = rect.width || parseFloat(computedStyle.width) || 800;
      const height = rect.height || parseFloat(computedStyle.height) || 600;
      return {
        width: Math.max(400, Math.floor(width)),
        height: Math.max(300, Math.floor(height))
      };
    };

    // Wait a bit for container to be properly sized
    const initialSize = getContainerSize();

    const app = new PIXI.Application<HTMLCanvasElement>({
      width: initialSize.width,
      height: initialSize.height,
      backgroundColor: 0x87ceeb,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let handleResize: (() => void) | null = null;

    app.init().then(() => {
      if (!mounted || !containerRef.current || !app.canvas) {
        app.destroy(true);
        return;
      }

      // Clear any existing canvas
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      const canvas = app.canvas as HTMLCanvasElement;
      
      // Force canvas to match container exactly
      const updateCanvasSize = () => {
        if (!containerRef.current) return;
        const size = getContainerSize();
        app.renderer.resize(size.width, size.height);
        canvas.style.width = `${size.width}px`;
        canvas.style.height = `${size.height}px`;
        canvas.style.display = "block";
        canvas.style.margin = "0";
        canvas.style.padding = "0";
      };
      
      updateCanvasSize();
      containerRef.current.appendChild(canvas);
      appRef.current = app;
      
      // Set resizeTo to automatically resize
      app.resizeTo = containerRef.current;

      // Generate terrain
      const terrain = generateTerrain();
      terrainMapRef.current = terrain;

      // Create terrain textures cache
      const terrainTextures = new Map<TerrainType, PIXI.Texture>();
      const terrainTypes: TerrainType[] = ["grass", "dirt", "water", "sand", "mountain"];
      terrainTypes.forEach(type => {
        terrainTextures.set(type, createTerrainTexture(app, type));
      });

      // Create terrain layer
      const terrainLayer = new PIXI.Container();

      terrain.forEach((row, y) => {
        row.forEach((tile, x) => {
          const texture = terrainTextures.get(tile.type)!;
          const sprite = new PIXI.Sprite(texture);
          sprite.x = x * TILE_SIZE;
          sprite.y = y * TILE_SIZE;
          terrainLayer.addChild(sprite);
        });
      });

      // Create game objects layer
      const gameLayer = new PIXI.Container();
      gameLayerRef.current = gameLayer;

      // Create selection graphics
      const selectionGraphics = new PIXI.Graphics();
      selectionGraphicsRef.current = selectionGraphics;
      gameLayer.addChild(selectionGraphics);

      // Camera container
      const cameraContainer = new PIXI.Container();
      cameraContainer.addChild(terrainLayer);
      cameraContainer.addChild(gameLayer);
      cameraContainerRef.current = cameraContainer;
      app.stage.addChild(cameraContainer);

      // Mouse events
      let isDragging = false;
      let dragStart: Position | null = null;

      const handleMouseDown = (e: MouseEvent) => {
        if (!app.canvas) return;
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cam = cameraRef.current;
        const worldPos = { x: x + cam.x, y: y + cam.y };

        // Check if clicking on unit
        const clickedUnit = unitsRef.current.find((unit) => {
          const dx = unit.position.x - worldPos.x;
          const dy = unit.position.y - worldPos.y;
          return Math.sqrt(dx * dx + dy * dy) < 20 && unit.owner === playerCivId;
        });

        if (clickedUnit) {
          if (e.shiftKey) {
            onUnitSelect([...selectedUnitsRef.current, clickedUnit.id]);
          } else {
            onUnitSelect([clickedUnit.id]);
          }
        } else {
          setIsSelecting(true);
          setSelectionStart({ x, y });
          setSelectionEnd({ x, y });
          if (!e.shiftKey) {
            onUnitSelect([]);
          }
        }

        dragStart = { x, y };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!app.canvas) return;
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update selection box
        const selecting = selectionStart !== null;
        if (selecting) {
          setSelectionEnd({ x, y });
        }

        if (isDragging && dragStart) {
          const dx = dragStart.x - x;
          const dy = dragStart.y - y;
          setCamera(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
          }));
          dragStart = { x, y };
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!app.canvas) return;
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cam = cameraRef.current;
        const worldPos = { x: x + cam.x, y: y + cam.y };

        const currentSelectionStart = selectionStart;
        const currentSelectionEnd = selectionEnd;

        if (currentSelectionStart && currentSelectionEnd) {
          const boxStart = { x: currentSelectionStart.x + cam.x, y: currentSelectionStart.y + cam.y };
          const boxEnd = worldPos;
          const minX = Math.min(boxStart.x, boxEnd.x);
          const maxX = Math.max(boxStart.x, boxEnd.x);
          const minY = Math.min(boxStart.y, boxEnd.y);
          const maxY = Math.max(boxStart.y, boxEnd.y);

          const unitsInBox = unitsRef.current.filter((unit) => {
            return unit.owner === playerCivId &&
              unit.position.x >= minX &&
              unit.position.x <= maxX &&
              unit.position.y >= minY &&
              unit.position.y <= maxY;
          });

          if (unitsInBox.length > 0) {
            if (e.shiftKey) {
              onUnitSelect([...selectedUnitsRef.current, ...unitsInBox.map(u => u.id)]);
            } else {
              onUnitSelect(unitsInBox.map(u => u.id));
            }
          }
        } else if (selectedUnitsRef.current.length > 0 && !isDragging) {
          onUnitMove(selectedUnitsRef.current, worldPos);
        }

        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        isDragging = false;
        dragStart = null;
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        if (!app.canvas) return;
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cam = cameraRef.current;
        const worldPos = { x: x + cam.x, y: y + cam.y };

        if (selectedUnitsRef.current.length > 0) {
          const clickedResource = resourcesRef.current.find((resource) => {
            const dx = resource.position.x - worldPos.x;
            const dy = resource.position.y - worldPos.y;
            return Math.sqrt(dx * dx + dy * dy) < 20;
          });

          if (clickedResource) {
            selectedUnitsRef.current.forEach((unitId) => {
              const unit = unitsRef.current.find(u => u.id === unitId);
              if (unit && unit.type === "villager") {
                onResourceGather(unitId, clickedResource.id);
              }
            });
          } else {
            onUnitMove(selectedUnitsRef.current, worldPos);
          }
        }
      };

      const canvasElement = app.canvas as HTMLCanvasElement;
      canvasElement.addEventListener("mousedown", handleMouseDown);
      canvasElement.addEventListener("mousemove", handleMouseMove);
      canvasElement.addEventListener("mouseup", handleMouseUp);
      canvasElement.addEventListener("contextmenu", handleContextMenu);

      // Handle window resize
      const resizeHandler = () => {
        if (appRef.current && containerRef.current && appRef.current.canvas) {
          const size = getContainerSize();
          // Force resize to match container exactly
          appRef.current.renderer.resize(size.width, size.height);
          // Update canvas style to match exactly
          const canvasEl = appRef.current.canvas as HTMLCanvasElement;
          canvasEl.style.width = `${size.width}px`;
          canvasEl.style.height = `${size.height}px`;
          canvasEl.style.display = "block";
          canvasEl.style.margin = "0";
          canvasEl.style.padding = "0";
        }
      };
      handleResize = resizeHandler;
      
      // Initial resize after delays to ensure container is properly sized
      setTimeout(() => {
        resizeHandler();
      }, 50);
      setTimeout(() => {
        resizeHandler();
      }, 200);

      window.addEventListener("resize", resizeHandler);

      // Use ResizeObserver for better resize handling
      if (containerRef.current && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          resizeHandler();
        });
        resizeObserver.observe(containerRef.current);
      }
    });

    return () => {
      mounted = false;
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
        resizeObserver.disconnect();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, textureSource: true });
        appRef.current = null;
      }
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      selectionGraphicsRef.current = null;
      gameLayerRef.current = null;
      cameraContainerRef.current = null;
    };
  }, []);

  // Update camera position
  useEffect(() => {
    if (cameraContainerRef.current) {
      cameraContainerRef.current.x = -camera.x;
      cameraContainerRef.current.y = -camera.y;
    }
  }, [camera]);

  // Update game objects when data changes
  useEffect(() => {
    const app = appRef.current;
    const gameLayer = gameLayerRef.current;
    const selectionGraphics = selectionGraphicsRef.current;

    if (!app || !gameLayer) return;

    // Clear and redraw game objects (but keep selectionGraphics)
    if (selectionGraphics && !selectionGraphics.destroyed) {
      const childrenToRemove = gameLayer.children.filter(child => child !== selectionGraphics);
      childrenToRemove.forEach(child => {
        child.destroy({ children: true, texture: true }); // Destroy child and its textures
        gameLayer.removeChild(child);
      });
    } else {
      gameLayer.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true }); // Destroy each removed child
      });
    }

    // Draw resources
    resources.forEach((resource) => {
      const sprite = createResourceSprite(app, resource);
      sprite.x = resource.position.x;
      sprite.y = resource.position.y;
      gameLayer.addChild(sprite);
    });

    // Draw buildings
    buildings.forEach((building) => {
      const sprite = createBuildingSprite(app, building);
      sprite.x = building.position.x;
      sprite.y = building.position.y;
      gameLayer.addChild(sprite);
    });

    // Draw units
    units.forEach((unit) => {
      const sprite = createUnitSprite(app, unit);
      sprite.x = unit.position.x;
      sprite.y = unit.position.y;

      // Draw movement line
      if (unit.targetPosition && unit.isMoving) {
        const line = new PIXI.Graphics();
        line.lineStyle(2, unit.type === "soldier" ? 0xff4444 : 0x00ff00, 0.6);
        line.moveTo(unit.position.x, unit.position.y);
        line.lineTo(unit.targetPosition.x, unit.targetPosition.y);
        gameLayer.addChild(line);

        // Target marker
        const marker = new PIXI.Graphics();
        marker.beginFill(unit.type === "soldier" ? 0xff4444 : 0x00ff00, 0.7);
        marker.drawCircle(unit.targetPosition.x, unit.targetPosition.y, 6);
        marker.endFill();
        gameLayer.addChild(marker);
      }

      gameLayer.addChild(sprite);
    });

    // Draw selection box
    if (selectionGraphics && !selectionGraphics.destroyed && selectionGraphics.parent) {
      try {
        if (isSelecting && selectionStart && selectionEnd) {
          selectionGraphics.clear();
          selectionGraphics.lineStyle(2, 0xffff00, 0.8);
          const x = Math.min(selectionStart.x, selectionEnd.x);
          const y = Math.min(selectionStart.y, selectionEnd.y);
          const w = Math.abs(selectionEnd.x - selectionStart.x);
          const h = Math.abs(selectionEnd.y - selectionStart.y);
          selectionGraphics.drawRect(x, y, w, h);
        } else {
          selectionGraphics.clear();
        }
      } catch (error) {
        console.warn("Error drawing selection box:", error);
      }
    }
  }, [units, resources, buildings, selectedUnits, isSelecting, selectionStart, selectionEnd]);

  return (
    <div style={{ 
      position: "relative", 
      border: "2px solid #444", 
      borderRadius: "8px", 
      overflow: "hidden",
      width: "100%",
      height: "100%",
      minHeight: "500px",
      aspectRatio: "4/3"
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: "100%", 
          height: "100%",
          display: "block",
          position: "relative",
          margin: "0",
          padding: "0",
          boxSizing: "border-box"
        }} 
      />
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(0, 0, 0, 0.7)",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#fff",
        zIndex: 10,
        pointerEvents: "none"
      }}>
        Click para seleccionar | Click derecho para mover/recolectar | Shift+Click para multi-selección
      </div>
    </div>
  );
}
