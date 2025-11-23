import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const ABI = [
    "function recordMove(uint256 gameId, address agent, string moveType, bytes data, uint256 nonce, bytes signature, uint256 priorityFee_EVVM, uint256 nonce_EVVM, bool priorityFlag_EVVM, bytes signature_EVVM) external"
];

export async function POST() {
    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // Initialize blockchain provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.FISHER_PRIVATE_KEY!, provider);

        const contract = new ethers.Contract(
            process.env.GAME_MOVE_SERVICE_ADDRESS!,
            ABI,
            wallet
        );

        console.log("Checking for pending moves...");

        // Fetch one pending move
        const { data: moves, error } = await supabase
            .from('game_moves')
            .select('*')
            .eq('status', 'pending')
            .limit(1);

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
                processed: false
            });
        }

        const move = moves[0];
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

                return NextResponse.json({
                    success: true,
                    message: 'Move processed successfully',
                    moveId: move.id,
                    txHash: tx.hash,
                    processed: true
                });
            } else {
                throw new Error("Transaction reverted");
            }

        } catch (err: any) {
            console.error("Error processing move:", err);
            await supabase
                .from('game_moves')
                .update({
                    status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', move.id);

            return NextResponse.json(
                {
                    error: 'Failed to process move',
                    details: err.message,
                    moveId: move.id,
                    processed: false
                },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Fisher API error:", error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
