import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para generar wallets únicas para cada agente de IA
 * Cada agente necesita su propia wallet para firmar transacciones con EIP-191
 */

const AGENTS = [
  'conquistador',
  'merchant',
  'architect',
  'gambler'
];

interface AgentWallet {
  id: string;
  name: string;
  address: string;
  privateKey: string;
}

function generateAgentWallets(): AgentWallet[] {
  const wallets: AgentWallet[] = [];

  console.log('🔐 Generando wallets para agentes de IA...\n');
  console.log('='.repeat(80));

  AGENTS.forEach((agentId, index) => {
    // Generar una nueva wallet aleatoria para cada agente
    const wallet = ethers.Wallet.createRandom();

    const agentWallet: AgentWallet = {
      id: agentId,
      name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
      address: wallet.address,
      privateKey: wallet.privateKey
    };

    wallets.push(agentWallet);

    console.log(`\n[${index + 1}] ${agentWallet.name} (${agentId})`);
    console.log(`   Address:     ${agentWallet.address}`);
    console.log(`   Private Key: ${agentWallet.privateKey}`);
  });

  console.log('\n' + '='.repeat(80));
  return wallets;
}

function generateEnvFile(wallets: AgentWallet[]): string {
  let envContent = `# Agent Wallets - Generado automáticamente
# ⚠️  IMPORTANTE: Nunca commitees este archivo!
# Estas son las wallets que usan los agentes de IA para firmar transacciones

`;

  wallets.forEach((wallet) => {
    const envVarName = `AGENT_${wallet.id.toUpperCase()}_PRIVATE_KEY`;
    envContent += `${envVarName}=${wallet.privateKey}\n`;
  });

  envContent += `
# Ejemplo de uso en código:
# const wallet = new ethers.Wallet(process.env.AGENT_CONQUISTADOR_PRIVATE_KEY!)
`;

  return envContent;
}

function generateWalletsJSON(wallets: AgentWallet[]): string {
  const walletsData = wallets.reduce((acc, wallet) => {
    acc[wallet.id] = {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
    return acc;
  }, {} as Record<string, { address: string; privateKey: string }>);

  return JSON.stringify(walletsData, null, 2);
}

function generateTypeScriptConfig(wallets: AgentWallet[]): string {
  let tsContent = `/**
 * Configuración de wallets de agentes
 * Este archivo mapea cada agente a su wallet address
 *
 * ⚠️  Las private keys NUNCA deben estar aquí, solo en .env
 */

export const AGENT_ADDRESSES = {
`;

  wallets.forEach((wallet) => {
    tsContent += `  ${wallet.id}: '${wallet.address}',\n`;
  });

  tsContent += `} as const;

export type AgentId = keyof typeof AGENT_ADDRESSES;

export function getAgentAddress(agentId: AgentId): string {
  return AGENT_ADDRESSES[agentId];
}

export function isValidAgentAddress(address: string): boolean {
  return Object.values(AGENT_ADDRESSES).includes(address as any);
}
`;

  return tsContent;
}

async function main() {
  console.clear();
  console.log('🎮 AOA ETH GLOBAL - Agent Wallet Generator\n');

  // Generar las wallets
  const wallets = generateAgentWallets();

  // Crear directorio de salida si no existe
  const outputDir = path.join(process.cwd(), '.wallets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Guardar como archivo .env
  const envContent = generateEnvFile(wallets);
  const envPath = path.join(outputDir, 'agent-wallets.env');
  fs.writeFileSync(envPath, envContent);
  console.log(`\n✅ Archivo .env generado: ${envPath}`);

  // Guardar como JSON (para backup)
  const jsonContent = generateWalletsJSON(wallets);
  const jsonPath = path.join(outputDir, 'agent-wallets.json');
  fs.writeFileSync(jsonPath, jsonContent);
  console.log(`✅ Archivo JSON generado: ${jsonPath}`);

  // Generar archivo TypeScript con addresses públicas
  const tsContent = generateTypeScriptConfig(wallets);
  const tsPath = path.join(process.cwd(), 'lib', 'agent-addresses.ts');
  fs.writeFileSync(tsPath, tsContent);
  console.log(`✅ Archivo TypeScript generado: ${tsPath}`);

  // Actualizar .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignoreContent = '';

  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  }

  if (!gitignoreContent.includes('.wallets/')) {
    gitignoreContent += '\n# Agent Wallets (NEVER COMMIT)\n.wallets/\n';
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log(`✅ .gitignore actualizado`);
  }

  // Instrucciones finales
  console.log('\n' + '='.repeat(80));
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('='.repeat(80));
  console.log('\n1. Copia las variables de entorno a tu archivo .env:');
  console.log(`   cat ${envPath} >> .env`);
  console.log('\n2. O manualmente copia el contenido de:');
  console.log(`   ${envPath}`);
  console.log('\n3. IMPORTANTE: Las wallets generadas están en:');
  console.log(`   ${outputDir}`);
  console.log('\n4. NUNCA commitees el directorio .wallets/ (ya está en .gitignore)');
  console.log('\n5. Las direcciones públicas están disponibles en:');
  console.log(`   lib/agent-addresses.ts`);
  console.log('\n' + '='.repeat(80));

  // Mostrar resumen
  console.log('\n📊 RESUMEN:');
  console.log('='.repeat(80));
  wallets.forEach((wallet, index) => {
    console.log(`${index + 1}. ${wallet.name.padEnd(15)} → ${wallet.address}`);
  });
  console.log('='.repeat(80));
  console.log('\n✨ ¡Wallets generadas exitosamente!\n');
}

main().catch(console.error);
