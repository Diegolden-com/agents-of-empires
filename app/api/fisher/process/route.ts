import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import type { Database } from '@/app/utils/supabase/database.types';

const ABI = [
    "function recordMove(uint256 gameId, address agent, string moveType, bytes data, uint256 nonce, bytes signature, uint256 priorityFee_EVVM, uint256 nonce_EVVM, bool priorityFlag_EVVM, bytes signature_EVVM) external"
];

// Default batch size for processing moves
const DEFAULT_BATCH_SIZE = 10;

export async function POST(request: Request) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const gameIdParam = searchParams.get('game_id');
        const batchSizeParam = searchParams.get('batch_size');

        const gameId = gameIdParam ? parseInt(gameIdParam, 10) : null;
        const batchSize = batchSizeParam ? parseInt(batchSizeParam, 10) : DEFAULT_BATCH_SIZE;

        // Initialize Supabase client
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Initialize blockchain provider and wallet
        // Disable ENS resolution by not providing network info that includes ENS
        const provider = new ethers.JsonRpcProvider(
            process.env.RPC_URL,
            {
                chainId: 84532,
                name: 'base-sepolia',
                //ensAddress: null // Explicitly disable ENS
            },
            { staticNetwork: true } // Prevent network detection
        );

        console.log("Provider initialized for chain:", await provider.getNetwork());

        const wallet = new ethers.Wallet(process.env.FISHER_PRIVATE_KEY!, provider);
        console.log("Wallet address:", wallet.address);

        // Validate contract address before creating contract instance
        const contractAddress = process.env.GAME_MOVE_SERVICE_ADDRESS!;
        if (!ethers.isAddress(contractAddress)) {
            throw new Error(`Invalid contract address: ${contractAddress}. Must be a valid Ethereum address.`);
        }

        // Normalize the contract address to checksum format
        const normalizedContractAddress = ethers.getAddress(contractAddress);

        const contract = new ethers.Contract(
            normalizedContractAddress,
            ABI,
            wallet
        );
        console.log("Contract initialized at:", normalizedContractAddress);

        console.log("Checking for pending moves...", gameId ? `for game ${gameId}` : 'across all games');

        // Build query with optional game_id filter
        let query = supabase
            .from('game_moves')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(batchSize);

        // Add game_id filter if provided
        if (gameId !== null) {
            query = query.eq('game_id', gameId);
        }

        const { data: moves, error } = await query;

        if (error) {
            console.error("Error fetching moves:", error);
            return NextResponse.json(
                { error: 'Failed to fetch moves', details: error.message },
                { status: 500 }
            );
        }

        if (!moves || moves.length === 0) {
            return NextResponse.json({
                message: 'No pending moves to process',
                gameId: gameId,
                processed: 0,
                results: []
            });
        }

        console.log(`Processing ${moves.length} move(s) in batch`);

        // Process moves sequentially to maintain nonce order
        const results: Array<{
            moveId: string;
            gameId: number;
            success: boolean;
            txHash?: string;
            error?: string;
        }> = [];

        for (const move of moves) {
            console.log(`Processing move ${move.id} for game ${move.game_id}`);

            // Mark as processing
            await supabase
                .from('game_moves')
                .update({ status: 'processing', updated_at: new Date().toISOString() })
                .eq('id', move.id);

            try {
                // Validate that agent is a valid Ethereum address (not ENS name)
                if (!ethers.isAddress(move.agent)) {
                    throw new Error(`Invalid agent address: ${move.agent}. ENS names are not supported.`);
                }

                // Ensure all parameters are properly typed to prevent ENS resolution
                const gameId = BigInt(move.game_id);
                const agent = ethers.getAddress(move.agent); // Normalizes the address
                const moveType = String(move.move_type);
                const data = move.data;
                const nonce = BigInt(move.nonce);
                const signature = move.signature;
                const priorityFeeEvvm = BigInt(move.priority_fee_evvm);
                const nonceEvvm = BigInt(move.nonce_evvm);
                const priorityFlagEvvm = Boolean(move.priority_flag_evvm);
                const signatureEvvm = move.signature_evvm || "0x";

                console.log(`Submitting move with params:`, {
                    gameId: gameId.toString(),
                    agent,
                    moveType,
                    data,
                    nonce: nonce.toString(),
                    signature,
                    priorityFeeEvvm: priorityFeeEvvm.toString(),
                    nonceEvvm: nonceEvvm.toString(),
                    priorityFlagEvvm,
                    signatureEvvm
                });

                // Submit to blockchain using getFunction to avoid ENS resolution
                const recordMoveFunction = contract.getFunction("recordMove");
                const tx = await recordMoveFunction(
                    gameId,
                    agent,
                    moveType,
                    data,
                    nonce,
                    signature,
                    priorityFeeEvvm,
                    nonceEvvm,
                    priorityFlagEvvm,
                    signatureEvvm
                );

                console.log(`Transaction submitted: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    console.log(`Transaction confirmed: ${tx.hash}`);
                    await supabase
                        .from('game_moves')
                        .update({
                            status: 'completed',
                            tx_hash: tx.hash,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', move.id);

                    results.push({
                        moveId: move.id,
                        gameId: move.game_id,
                        success: true,
                        txHash: tx.hash
                    });
                } else {
                    throw new Error("Transaction reverted");
                }

            } catch (err: any) {
                console.error(`Error processing move ${move.id}:`, err);
                await supabase
                    .from('game_moves')
                    .update({
                        status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', move.id);

                results.push({
                    moveId: move.id,
                    gameId: move.game_id,
                    success: false,
                    error: err.message
                });
            }
        }

        // Calculate statistics
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: successCount > 0,
            message: `Batch processing completed: ${successCount} succeeded, ${failedCount} failed`,
            gameId: gameId,
            processed: results.length,
            successCount,
            failedCount,
            results
        });

    } catch (error: any) {
        console.error("Fisher API error:", error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
