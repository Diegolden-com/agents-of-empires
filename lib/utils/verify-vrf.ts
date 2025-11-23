import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

const GAME_CONTROLLER_ADDRESS = '0xCE21A1Ee76726Bb487684330BB216E5f233A47fb';
const VRF_CONSUMER_ADDRESS = '0x5D6c49C6Fad9bC1D2320cd9579D31c60ae00647E';

const VRF_ABI = parseAbi([
  'function gameController() view returns (address)',
  'function s_subscriptionId() view returns (uint256)',
  'function callbackGasLimit() view returns (uint32)',
  'function requestConfirmations() view returns (uint16)',
  'function numWords() view returns (uint32)',
]);

const GAME_CONTROLLER_ABI = parseAbi([
  'function vrf() view returns (address)',
  'function owner() view returns (address)',
  'function creWorkflow() view returns (address)',
]);

export async function verifyVRFSetup() {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  console.log('🔍 Verifying VRF Setup...');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar GameController
    console.log('\n📋 GameController:', GAME_CONTROLLER_ADDRESS);

    const vrfAddress = await publicClient.readContract({
      address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
      abi: GAME_CONTROLLER_ABI,
      functionName: 'vrf',
    });

    const owner = await publicClient.readContract({
      address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
      abi: GAME_CONTROLLER_ABI,
      functionName: 'owner',
    });

    const creWorkflow = await publicClient.readContract({
      address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
      abi: GAME_CONTROLLER_ABI,
      functionName: 'creWorkflow',
    });

    console.log('  ✓ VRF Consumer address:', vrfAddress);
    console.log('  ✓ Owner:', owner);
    console.log('  ✓ CRE Workflow:', creWorkflow);

    // 2. Verificar VRFConsumer
    console.log('\n📋 VRFConsumer:', VRF_CONSUMER_ADDRESS);

    const gameController = await publicClient.readContract({
      address: VRF_CONSUMER_ADDRESS as `0x${string}`,
      abi: VRF_ABI,
      functionName: 'gameController',
    });

    const subscriptionId = await publicClient.readContract({
      address: VRF_CONSUMER_ADDRESS as `0x${string}`,
      abi: VRF_ABI,
      functionName: 's_subscriptionId',
    });

    const callbackGasLimit = await publicClient.readContract({
      address: VRF_CONSUMER_ADDRESS as `0x${string}`,
      abi: VRF_ABI,
      functionName: 'callbackGasLimit',
    });

    const requestConfirmations = await publicClient.readContract({
      address: VRF_CONSUMER_ADDRESS as `0x${string}`,
      abi: VRF_ABI,
      functionName: 'requestConfirmations',
    });

    const numWords = await publicClient.readContract({
      address: VRF_CONSUMER_ADDRESS as `0x${string}`,
      abi: VRF_ABI,
      functionName: 'numWords',
    });

    console.log('  ✓ GameController address:', gameController);
    console.log('  ✓ Subscription ID:', subscriptionId.toString());
    console.log('  ✓ Callback Gas Limit:', callbackGasLimit.toString());
    console.log('  ✓ Request Confirmations:', requestConfirmations.toString());
    console.log('  ✓ Num Words:', numWords.toString());

    // 3. Verificar consistencia
    console.log('\n🔍 Verificación de consistencia:');

    const vrfMatches = vrfAddress.toLowerCase() === VRF_CONSUMER_ADDRESS.toLowerCase();
    const gcMatches = gameController.toLowerCase() === GAME_CONTROLLER_ADDRESS.toLowerCase();

    console.log(`  ${vrfMatches ? '✅' : '❌'} GameController.vrf == VRFConsumer address`);
    console.log(`  ${gcMatches ? '✅' : '❌'} VRFConsumer.gameController == GameController address`);
    console.log(`  ${subscriptionId > 0n ? '✅' : '❌'} Subscription ID configurado`);

    if (!vrfMatches || !gcMatches || subscriptionId === 0n) {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS:');
      if (!vrfMatches) {
        console.log('  - GameController no apunta al VRF correcto');
        console.log(`    Esperado: ${VRF_CONSUMER_ADDRESS}`);
        console.log(`    Actual: ${vrfAddress}`);
      }
      if (!gcMatches) {
        console.log('  - VRF no apunta al GameController correcto');
        console.log(`    Esperado: ${GAME_CONTROLLER_ADDRESS}`);
        console.log(`    Actual: ${gameController}`);
      }
      if (subscriptionId === 0n) {
        console.log('  - No hay subscription ID configurado en el VRF');
      }
      return false;
    }

    console.log('\n✅ Configuración VRF correcta!');
    console.log('=' .repeat(60));
    return true;
  } catch (error: any) {
    console.error('\n❌ Error verificando setup:', error.message);
    console.log('=' .repeat(60));
    return false;
  }
}

// Para usar en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).verifyVRFSetup = verifyVRFSetup;
}
