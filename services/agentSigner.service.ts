import { ethers } from 'ethers';
import { GameMoveInsert } from '@/interface/GameMoves';
import { getNextNonce } from './nonceManager.service';

/**
 * Servicio para firmar transacciones de agentes usando EIP-191
 * EIP-191: Signed Data Standard
 * https://eips.ethereum.org/EIPS/eip-191
 */

// Tipos de movimientos según el smart contract
export type MoveType =
  | 'BUILD_ROAD'
  | 'BUILD_SETTLEMENT'
  | 'BUILD_CITY'
  | 'TRADE'
  | 'MOVE_ROBBER'
  | 'ROLL_DICE'
  | 'END_TURN';

export interface MoveData {
  gameId: number;
  agent: string;
  moveType: MoveType;
  data: string; // Hex string del payload encodado
  nonce: number;
}

export interface SignedMove extends MoveData {
  signature: string;
  messageHash: string;
}

/**
 * Obtiene la wallet de un agente desde las variables de entorno
 */
export function getAgentWallet(agentId: string): ethers.Wallet {
  const envVarName = `AGENT_${agentId.toUpperCase()}_PRIVATE_KEY`;
  const privateKey = process.env[envVarName];

  if (!privateKey) {
    throw new Error(
      `Private key not found for agent ${agentId}. ` +
      `Make sure ${envVarName} is set in .env`
    );
  }

  return new ethers.Wallet(privateKey);
}

/**
 * Construye el mensaje a firmar según el formato del smart contract con EVVM
 * Formato: "evvmID,recordMove,gameId,moveType,dataHash,nonce"
 *
 * Ejemplo: "1,recordMove,1,BUILD_ROAD,0x1234...,0"
 */
export function buildMessageToSign(moveData: MoveData, evvmID: string): string {
  // Hash del data (keccak256)
  const dataHash = ethers.keccak256(moveData.data);

  // Construir el mensaje concatenando los campos según SignatureRecover.sol
  // Formato: "{evvmID},{functionName},{inputs}"
  // donde inputs = "{gameId},{moveType},{dataHash},{nonce}"
  const message = [
    evvmID,
    'recordMove',
    moveData.gameId.toString(),
    moveData.moveType,
    dataHash,
    moveData.nonce.toString()
  ].join(',');

  return message;
}

/**
 * Firma un mensaje usando EIP-191 (Personal Sign)
 *
 * EIP-191 añade el prefijo "\x19Ethereum Signed Message:\n" + len(message)
 * Esto previene que un mensaje firmado para un propósito sea usado en otro
 */
export async function signMessageEIP191(
  wallet: ethers.Wallet,
  message: string
): Promise<{ signature: string; messageHash: string }> {
  // ethers.js ya implementa EIP-191 en signMessage
  let signature = await wallet.signMessage(message);

  // Validar que la firma tenga exactamente 65 bytes (130 caracteres hex + 0x)
  // Formato: 0x + r (32 bytes) + s (32 bytes) + v (1 byte)
  if (signature.length !== 132) {
    throw new Error(
      `Invalid signature length: ${signature.length}. Expected 132 characters (0x + 130 hex chars for 65 bytes). ` +
      `Signature: ${signature}`
    );
  }

  // Asegurar que el byte v sea 27 o 28 (no 0 o 1)
  // ethers.js ya debería hacer esto, pero lo verificamos por seguridad
  const v = parseInt(signature.slice(-2), 16);
  if (v < 27) {
    // Si v es 0 or 1, convertir a 27 or 28
    const normalizedV = v + 27;
    signature = signature.slice(0, -2) + normalizedV.toString(16).padStart(2, '0');
    console.log(`⚠️ Normalized signature v from ${v} to ${normalizedV}`);
  }

  // Calcular el hash del mensaje con el prefijo EIP-191
  const messageHash = ethers.hashMessage(message);

  return { signature, messageHash };
}

/**
 * Verifica una firma EIP-191
 */
export function verifySignatureEIP191(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Firma un movimiento completo
 */
export async function signAgentMove(
  agentId: string,
  moveData: MoveData,
  evvmID: string
): Promise<SignedMove> {
  // Obtener la wallet del agente
  const wallet = getAgentWallet(agentId);

  // Verificar que el agente corresponda a la wallet
  if (wallet.address.toLowerCase() !== moveData.agent.toLowerCase()) {
    throw new Error(
      `Agent address mismatch. Expected ${wallet.address}, got ${moveData.agent}`
    );
  }

  // Construir el mensaje incluyendo evvmID
  const message = buildMessageToSign(moveData, evvmID);

  // Firmar con EIP-191
  const { signature, messageHash } = await signMessageEIP191(wallet, message);

  // Verificar la firma
  const isValid = verifySignatureEIP191(message, signature, wallet.address);
  if (!isValid) {
    throw new Error('Signature verification failed');
  }

  console.log(`✅ Move signed for agent ${agentId}:`);
  console.log(`   Agent: ${wallet.address}`);
  console.log(`   evvmID: ${evvmID}`);
  console.log(`   Message: ${message}`);
  console.log(`   Signature: ${signature}`);
  console.log(`   Hash: ${messageHash}`);

  return {
    ...moveData,
    signature,
    messageHash
  };
}

/**
 * Genera un nonce único e incremental para un agente
 * IMPORTANTE: El nonce es incremental por agente y no se puede repetir
 */
export function generateNonce(agentAddress: string): number {
  return getNextNonce(agentAddress);
}

/**
 * Crea el payload completo para insertar en Supabase
 * Incluye las firmas EVVM (por ahora con valores dummy)
 */
export function createGameMoveInsert(
  signedMove: SignedMove,
  evvmParams?: {
    priorityFee?: number;
    nonce?: number;
    priorityFlag?: boolean;
    signature?: string;
  }
): GameMoveInsert {
  return {
    game_id: signedMove.gameId,
    agent: signedMove.agent,
    move_type: signedMove.moveType,
    data: signedMove.data,
    nonce: signedMove.nonce,
    signature: signedMove.signature,
    priority_fee_evvm: evvmParams?.priorityFee ?? 0,
    nonce_evvm: evvmParams?.nonce ?? 0,
    priority_flag_evvm: evvmParams?.priorityFlag ?? false,
    signature_evvm: evvmParams?.signature ?? '0x',
    status: 'pending'
  };
}

/**
 * Función helper para obtener la dirección de un agente sin exponer la private key
 */
export function getAgentAddress(agentId: string): string {
  const wallet = getAgentWallet(agentId);
  return wallet.address;
}

/**
 * Obtiene todas las direcciones de agentes
 */
export function getAllAgentAddresses(): Record<string, string> {
  const agents = ['conquistador', 'merchant', 'architect', 'gambler'];
  const addresses: Record<string, string> = {};

  for (const agentId of agents) {
    try {
      addresses[agentId] = getAgentAddress(agentId);
    } catch (error) {
      console.warn(`Could not get address for ${agentId}:`, error);
    }
  }

  return addresses;
}
