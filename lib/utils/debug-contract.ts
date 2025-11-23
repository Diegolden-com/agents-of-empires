import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { GAME_CONTROLLER_ABI, GAME_CONTROLLER_ADDRESS } from '@/lib/contracts/GameController.abi';

export async function debugContract() {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  console.log('🔍 Debugging contract at:', GAME_CONTROLLER_ADDRESS);
  console.log('🌐 Network:', baseSepolia.name, '(Chain ID:', baseSepolia.id, ')');

  try {
    // 1. Verificar que el contrato existe
    const code = await publicClient.getBytecode({
      address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
    });

    if (!code || code === '0x') {
      console.error('❌ No contract found at this address!');
      return false;
    }

    console.log('✅ Contract exists');

    // 2. Leer MIN_DEPOSIT
    const minDeposit = await publicClient.readContract({
      address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
      abi: GAME_CONTROLLER_ABI,
      functionName: 'MIN_DEPOSIT',
    });

    console.log('💰 MIN_DEPOSIT:', minDeposit.toString(), 'wei');
    console.log('💰 MIN_DEPOSIT:', (Number(minDeposit) / 1e18).toFixed(6), 'ETH');

    // 3. Leer gameCounter
    const gameCounter = await publicClient.readContract({
      address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
      abi: GAME_CONTROLLER_ABI,
      functionName: 'gameCounter',
    });

    console.log('🎲 Current gameCounter:', gameCounter.toString());

    return true;
  } catch (error: any) {
    console.error('❌ Error debugging contract:', error.message);
    return false;
  }
}
