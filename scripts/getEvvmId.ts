import { ethers } from 'ethers';

/**
 * Script para obtener el EVVM ID del contrato
 */
async function getEvvmId() {
  try {
    // Leer variables de entorno
    const rpcUrl = process.env.RPC_URL;
    let gameMoveServiceAddress = process.env.GAME_MOVE_SERVICE_ADDRESS;

    // Si no está configurada o es el placeholder, usar la dirección del README
    if (!gameMoveServiceAddress || gameMoveServiceAddress.includes('your_game_move')) {
      gameMoveServiceAddress = '0x3a20bd538A2F31C845Deb240Ed347210c4835493';
      console.log('ℹ️  Using GameMoveService address from README');
    }

    if (!rpcUrl) {
      throw new Error('Missing RPC_URL in .env');
    }

    // Validar que es una dirección válida
    if (!ethers.isAddress(gameMoveServiceAddress)) {
      throw new Error(`Invalid contract address: ${gameMoveServiceAddress}`);
    }

    console.log('🔍 Getting EVVM ID...');
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Contract: ${gameMoveServiceAddress}`);

    // Conectar al provider (deshabilitando ENS)
    const provider = new ethers.JsonRpcProvider(
      rpcUrl,
      {
        chainId: 84532,
        name: 'base-sepolia'
      },
      { staticNetwork: true }
    );

    // Usar la dirección del EVVM del README
    const evvmAddress = '0x07a95C4a774DE93ff3fd8862EE2c8daCad5003A9';
    console.log(`   EVVM Address: ${evvmAddress}`);

    // ABI mínimo para obtener el EVVM ID
    const evvmABI = [
      "function getEvvmID() view returns (uint256)"
    ];

    const evvm = new ethers.Contract(
      evvmAddress,
      evvmABI,
      provider
    );

    // Obtener el EVVM ID
    const evvmID = await evvm.getEvvmID();
    console.log(`\n✅ EVVM ID: ${evvmID.toString()}`);
    console.log(`\nAdd this to your .env file:`);
    console.log(`EVVM_ID=${evvmID.toString()}`);

    return evvmID.toString();

  } catch (error: any) {
    console.error('❌ Error getting EVVM ID:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  getEvvmId()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { getEvvmId };
