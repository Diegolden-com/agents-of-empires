import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { GAME_CONTROLLER_ABI, GAME_CONTROLLER_ADDRESS } from '@/lib/contracts/GameController.abi';

export function useGameController() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWalletClient = useCallback(async () => {
    if (!wallets || wallets.length === 0) {
      throw new Error('No wallet connected');
    }

    const wallet = wallets[0];
    await wallet.switchChain(84532); // Base Sepolia testnet

    const ethereumProvider = await wallet.getEthereumProvider();

    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: custom(ethereumProvider),
    }).extend(publicActions);

    return { walletClient, address: wallet.address as `0x${string}` };
  }, [wallets]);

  const startGame = useCallback(async (bettorChoice: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!authenticated) {
        await login();
        return null;
      }

      const { walletClient, address } = await getWalletClient();

      console.log('🔍 Reading contract data...');

      // Leer MIN_DEPOSIT del contrato
      const minDeposit = await walletClient.readContract({
        address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
        abi: GAME_CONTROLLER_ABI,
        functionName: 'MIN_DEPOSIT',
      });

      // Verificar balance del usuario
      const balance = await walletClient.getBalance({ address });

      console.log('💰 Wallet info:', {
        address,
        balance: balance.toString(),
        balanceInEth: (Number(balance) / 1e18).toFixed(6),
        minDeposit: minDeposit.toString(),
        minDepositInEth: (Number(minDeposit) / 1e18).toFixed(6),
      });

      if (balance < minDeposit) {
        throw new Error(`Insufficient balance. You need at least ${(Number(minDeposit) / 1e18).toFixed(6)} ETH`);
      }

      console.log('🎮 Starting game with:', {
        bettorChoice,
        contractAddress: GAME_CONTROLLER_ADDRESS,
        minDeposit: minDeposit.toString(),
      });

      // Validar bettorChoice
      if (bettorChoice < 0 || bettorChoice > 3) {
        throw new Error(`Invalid bettorChoice: ${bettorChoice}. Must be between 0 and 3`);
      }

      // Primero simular la llamada para detectar errores antes de enviar la tx
      console.log('🔍 Simulating transaction...');
      try {
        await walletClient.simulateContract({
          address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
          abi: GAME_CONTROLLER_ABI,
          functionName: 'startGame',
          args: [bettorChoice, false], // bettorChoice, useNativePayment
          value: minDeposit as bigint,
          account: address,
        });
        console.log('✅ Simulation successful - transaction should succeed');
      } catch (simError: any) {
        console.error('❌ Simulation failed:', simError);

        // Extraer razón del revert si está disponible
        let revertReason = 'Unknown reason';
        if (simError.cause?.reason) {
          revertReason = simError.cause.reason;
        } else if (simError.message?.includes('NOT_ENOUGH_ETH')) {
          revertReason = 'Not enough ETH sent';
        } else if (simError.message?.includes('INVALID_BETTOR_CHOICE')) {
          revertReason = 'Invalid bettor choice';
        } else if (simError.shortMessage) {
          revertReason = simError.shortMessage;
        }

        throw new Error(`Transaction simulation failed: ${revertReason}`);
      }

      // Llamar a startGame con el depósito mínimo
      const hash = await walletClient.writeContract({
        address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
        abi: GAME_CONTROLLER_ABI,
        functionName: 'startGame',
        args: [bettorChoice, false], // bettorChoice, useNativePayment
        value: minDeposit as bigint,
        account: address,
        gas: 500000n, // Agregar gas explícito
      });

      console.log('📝 Transaction sent:', hash);
      console.log('⏳ Waiting for confirmation...');

      // Esperar confirmación
      const receipt = await walletClient.waitForTransactionReceipt({ hash });

      console.log('✅ Transaction confirmed:', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      // Verificar si la transacción fue exitosa
      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted. Check contract requirements.');
      }

      // Leer gameCounter para obtener el gameId
      const gameCounter = await walletClient.readContract({
        address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
        abi: GAME_CONTROLLER_ABI,
        functionName: 'gameCounter',
      });

      const gameId = Number(gameCounter);
      console.log('🎲 Game ID from counter:', gameId);

      return {
        gameId,
        txHash: receipt.transactionHash,
        requestId: null,
      };
    } catch (err: any) {
      console.error('❌ Error starting game:', err);

      // Extraer mensaje de error más descriptivo
      let errorMessage = 'Failed to start game';

      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in your wallet';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (err.shortMessage) {
        errorMessage = err.shortMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Si hay detalles de revert, mostrarlos
      if (err.cause?.reason) {
        errorMessage += `: ${err.cause.reason}`;
      }

      console.error('📋 Error details:', {
        message: errorMessage,
        cause: err.cause,
        details: err.details,
      });

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, login, getWalletClient]);

  const getGameStatus = useCallback(async (gameId: number) => {
    try {
      const { walletClient } = await getWalletClient();

      const status = await walletClient.readContract({
        address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
        abi: GAME_CONTROLLER_ABI,
        functionName: 'getGameStatus',
        args: [BigInt(gameId)],
      });

      // GameStatus enum: 0 = PENDING_RANDOMNESS, 1 = ACTIVE, 2 = FINISHED, 3 = CANCELLED
      const statusMap = ['pending_vrf', 'active', 'finished', 'cancelled'];
      return statusMap[Number(status)];
    } catch (err: any) {
      console.error('❌ Error getting game status:', err);
      throw err;
    }
  }, [getWalletClient]);

  const getGame = useCallback(async (gameId: number) => {
    try {
      const { walletClient } = await getWalletClient();

      const game = await walletClient.readContract({
        address: GAME_CONTROLLER_ADDRESS as `0x${string}`,
        abi: GAME_CONTROLLER_ABI,
        functionName: 'getGame',
        args: [BigInt(gameId)],
      });

      return game;
    } catch (err: any) {
      console.error('❌ Error getting game:', err);
      throw err;
    }
  }, [getWalletClient]);

  return {
    ready,
    authenticated,
    login,
    startGame,
    getGameStatus,
    getGame,
    isLoading,
    error,
    wallets,
  };
}
