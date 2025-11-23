/**
 * Configuración de wallets de agentes
 * Este archivo mapea cada agente a su wallet address
 *
 * ⚠️  Las private keys NUNCA deben estar aquí, solo en .env
 */

export const AGENT_ADDRESSES = {
  conquistador: '0x083c0Ac5f77B67677B0C1f59a75db9c741629E75',
  merchant: '0x6362Ed6AA51891772087B50288292d90f8500FaE',
  architect: '0x191603467340eA75B8418B5fc7ACDEea3B74DAD6',
  gambler: '0x8D8b67f6D7A2F1c2AF1e27124058c81b0BfA1FA7',
} as const;

export type AgentId = keyof typeof AGENT_ADDRESSES;

export function getAgentAddress(agentId: AgentId): string {
  return AGENT_ADDRESSES[agentId];
}

export function isValidAgentAddress(address: string): boolean {
  return Object.values(AGENT_ADDRESSES).includes(address as any);
}
