import { ethers } from 'ethers';
import { AgentAction } from '@/lib/agent-interface';
import { getVertexIdFromOption, getEdgeIdFromOption } from '@/lib/option-mapper';

/**
 * Servicio para encodear datos de acciones según el formato del smart contract
 *
 * Según GameMoveService.sol, los datos se encodean así:
 * - BUILD_ROAD: abi.encode(uint8 edgeId)
 * - BUILD_SETTLEMENT: abi.encode(uint8 vertexId)
 * - BUILD_CITY: abi.encode(uint8 vertexId)
 * - TRADE: abi.encode(int8[] resourceDeltas)
 * - MOVE_ROBBER: abi.encode(uint8 hexId, address victim)
 */

export type MoveType =
  | 'BUILD_ROAD'
  | 'BUILD_SETTLEMENT'
  | 'BUILD_CITY'
  | 'TRADE'
  | 'MOVE_ROBBER'
  | 'ROLL_DICE'
  | 'END_TURN';

/**
 * Encodea datos para BUILD_ROAD
 * @param edgeId ID del edge (0-71)
 */
export function encodeBuildRoad(edgeId: number): string {
  if (edgeId < 0 || edgeId > 255) {
    throw new Error(`Invalid edgeId: ${edgeId}. Must be 0-255`);
  }

  // abi.encode(uint8)
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(['uint8'], [edgeId]);
}

/**
 * Encodea datos para BUILD_SETTLEMENT
 * @param vertexId ID del vértice (0-53)
 */
export function encodeBuildSettlement(vertexId: number): string {
  if (vertexId < 0 || vertexId > 255) {
    throw new Error(`Invalid vertexId: ${vertexId}. Must be 0-255`);
  }

  // abi.encode(uint8)
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(['uint8'], [vertexId]);
}

/**
 * Encodea datos para BUILD_CITY
 * @param vertexId ID del vértice donde está el settlement (0-53)
 */
export function encodeBuildCity(vertexId: number): string {
  if (vertexId < 0 || vertexId > 255) {
    throw new Error(`Invalid vertexId: ${vertexId}. Must be 0-255`);
  }

  // abi.encode(uint8)
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(['uint8'], [vertexId]);
}

/**
 * Encodea datos para TRADE
 * @param resourceDeltas Array de deltas de recursos (+ gain, - lose)
 *                       Orden: [wood, brick, sheep, wheat, ore]
 */
export function encodeTrade(resourceDeltas: number[]): string {
  if (resourceDeltas.length !== 5) {
    throw new Error('resourceDeltas must have exactly 5 elements');
  }

  // Validar que los valores estén en rango int8 (-128 a 127)
  resourceDeltas.forEach((delta, index) => {
    if (delta < -128 || delta > 127) {
      throw new Error(
        `resourceDeltas[${index}] = ${delta} is out of int8 range (-128 to 127)`
      );
    }
  });

  // abi.encode(int8[])
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(['int8[5]'], [resourceDeltas]);
}

/**
 * Encodea datos para MOVE_ROBBER
 * @param hexId ID del hexágono (0-18)
 * @param victim Dirección del jugador víctima
 */
export function encodeMoveRobber(hexId: number, victim: string): string {
  if (hexId < 0 || hexId > 255) {
    throw new Error(`Invalid hexId: ${hexId}. Must be 0-255`);
  }

  if (!ethers.isAddress(victim)) {
    throw new Error(`Invalid victim address: ${victim}`);
  }

  // abi.encode(uint8, address)
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(['uint8', 'address'], [hexId, victim]);
}

/**
 * Para acciones sin datos (ROLL_DICE, END_TURN)
 */
export function encodeEmptyData(): string {
  return '0x';
}

/**
 * Mapea un tipo de acción de la UI al tipo del smart contract
 */
export function mapActionTypeToMoveType(actionType: string): MoveType {
  const mapping: Record<string, MoveType> = {
    'build_road': 'BUILD_ROAD',
    'build_settlement': 'BUILD_SETTLEMENT',
    'build_city': 'BUILD_CITY',
    'trade_bank': 'TRADE',
    'roll': 'ROLL_DICE',
    'end_turn': 'END_TURN'
  };

  const moveType = mapping[actionType];
  if (!moveType) {
    throw new Error(`Unknown action type: ${actionType}`);
  }

  return moveType;
}

/**
 * Encodea una acción completa del agente
 */
export function encodeAgentAction(
  action: AgentAction,
  playerId?: string
): {
  moveType: MoveType;
  encodedData: string;
} {
  const moveType = mapActionTypeToMoveType(action.type);

  let encodedData: string;

  switch (action.type) {
    case 'build_road': {
      let edgeId: number;

      // Support both option number (1-5) and direct edgeId
      if (typeof action.data === 'number') {
        // Option format: just a number
        if (!playerId) {
          throw new Error('playerId required when using option format');
        }
        const resolvedId = getEdgeIdFromOption(playerId, action.data);
        if (resolvedId === null) {
          throw new Error(`Failed to resolve edge option ${action.data} for player ${playerId}`);
        }
        edgeId = resolvedId;
      } else if (action.data?.option !== undefined) {
        // Option format: { option: number }
        if (!playerId) {
          throw new Error('playerId required when using option format');
        }
        const resolvedId = getEdgeIdFromOption(playerId, action.data.option);
        if (resolvedId === null) {
          throw new Error(`Failed to resolve edge option ${action.data.option} for player ${playerId}`);
        }
        edgeId = resolvedId;
      } else if (action.data?.edgeId !== undefined) {
        // Direct edgeId format: { edgeId: number }
        edgeId = action.data.edgeId;
      } else {
        throw new Error('edgeId or option required for build_road');
      }

      encodedData = encodeBuildRoad(edgeId);
      break;
    }

    case 'build_settlement': {
      let vertexId: number;

      // Support both option number (1-5) and direct vertexId
      if (typeof action.data === 'number') {
        // Option format: just a number
        if (!playerId) {
          throw new Error('playerId required when using option format');
        }
        const resolvedId = getVertexIdFromOption(playerId, action.data);
        if (resolvedId === null) {
          throw new Error(`Failed to resolve vertex option ${action.data} for player ${playerId}`);
        }
        vertexId = resolvedId;
      } else if (action.data?.option !== undefined) {
        // Option format: { option: number }
        if (!playerId) {
          throw new Error('playerId required when using option format');
        }
        const resolvedId = getVertexIdFromOption(playerId, action.data.option);
        if (resolvedId === null) {
          throw new Error(`Failed to resolve vertex option ${action.data.option} for player ${playerId}`);
        }
        vertexId = resolvedId;
      } else if (action.data?.vertexId !== undefined) {
        // Direct vertexId format: { vertexId: number }
        vertexId = action.data.vertexId;
      } else {
        throw new Error('vertexId or option required for build_settlement');
      }

      encodedData = encodeBuildSettlement(vertexId);
      break;
    }

    case 'build_city': {
      let vertexId: number;

      // Support both option number (1-5) and direct vertexId
      if (typeof action.data === 'number') {
        // Option format: just a number
        if (!playerId) {
          throw new Error('playerId required when using option format');
        }
        const resolvedId = getVertexIdFromOption(playerId, action.data);
        if (resolvedId === null) {
          throw new Error(`Failed to resolve vertex option ${action.data} for player ${playerId}`);
        }
        vertexId = resolvedId;
      } else if (action.data?.option !== undefined) {
        // Option format: { option: number }
        if (!playerId) {
          throw new Error('playerId required when using option format');
        }
        const resolvedId = getVertexIdFromOption(playerId, action.data.option);
        if (resolvedId === null) {
          throw new Error(`Failed to resolve vertex option ${action.data.option} for player ${playerId}`);
        }
        vertexId = resolvedId;
      } else if (action.data?.vertexId !== undefined) {
        // Direct vertexId format: { vertexId: number }
        vertexId = action.data.vertexId;
      } else {
        throw new Error('vertexId or option required for build_city');
      }

      encodedData = encodeBuildCity(vertexId);
      break;
    }

    case 'trade_bank':
      // Convertir el formato de trade_bank a resourceDeltas
      if (!action.data?.give || !action.data?.receive) {
        throw new Error('give and receive required for trade_bank');
      }
      encodedData = convertTradeToDeltas(action.data);
      break;

    case 'roll':
    case 'end_turn':
      encodedData = encodeEmptyData();
      break;

    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }

  return { moveType, encodedData };
}

/**
 * Convierte el formato de trade del UI al formato de deltas
 */
function convertTradeToDeltas(tradeData: {
  give: Record<string, number>;
  receive: string;
}): string {
  // Orden: [wood, brick, sheep, wheat, ore]
  const resourceOrder = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
  const deltas = [0, 0, 0, 0, 0];

  // Procesar "give" (valores negativos)
  Object.entries(tradeData.give).forEach(([resource, amount]) => {
    const index = resourceOrder.indexOf(resource);
    if (index === -1) {
      throw new Error(`Unknown resource: ${resource}`);
    }
    deltas[index] = -amount;
  });

  // Procesar "receive" (valor positivo)
  const receiveIndex = resourceOrder.indexOf(tradeData.receive);
  if (receiveIndex === -1) {
    throw new Error(`Unknown resource: ${tradeData.receive}`);
  }
  deltas[receiveIndex] = 1;

  return encodeTrade(deltas);
}

/**
 * Decodea datos para debugging
 */
export function decodeData(moveType: MoveType, data: string): any {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  try {
    switch (moveType) {
      case 'BUILD_ROAD':
      case 'BUILD_SETTLEMENT':
      case 'BUILD_CITY':
        return abiCoder.decode(['uint8'], data)[0];

      case 'TRADE':
        return abiCoder.decode(['int8[5]'], data)[0];

      case 'MOVE_ROBBER':
        const [hexId, victim] = abiCoder.decode(['uint8', 'address'], data);
        return { hexId, victim };

      case 'ROLL_DICE':
      case 'END_TURN':
        return null;

      default:
        throw new Error(`Unknown move type: ${moveType}`);
    }
  } catch (error) {
    console.error('Error decoding data:', error);
    return null;
  }
}
