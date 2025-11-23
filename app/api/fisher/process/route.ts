import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import type { Database } from '@/app/utils/supabase/database.types';

const ABI = [
    "function recordMove(uint256 gameId, address agent, string moveType, bytes data, uint256 nonce, bytes signature, uint256 priorityFee_EVVM, uint256 nonce_EVVM, bool priorityFlag_EVVM, bytes signature_EVVM) external"
];

// Default batch size for processing moves
const DEFAULT_BATCH_SIZE = 10;

type GameMove = Database['public']['Tables']['game_moves']['Row'];

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
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.FISHER_PRIVATE_KEY!, provider);

        const contract = new ethers.Contract(
            process.env.GAME_MOVE_SERVICE_ADDRESS!,
            ABI,
            wallet
        );

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
                // Submit to blockchain
                const tx = await contract.recordMove(
                    move.game_id,
                    move.agent,
                    move.move_type,
                    move.data,
                    move.nonce,
                    move.signature,
                    move.priority_fee_evvm,
                    move.nonce_evvm,
                    move.priority_flag_evvm,
                    move.signature_evvm || "0x"
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
