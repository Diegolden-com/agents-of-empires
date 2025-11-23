import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.FISHER_PRIVATE_KEY!, provider);

const ABI = [
    "function recordMove(uint256 gameId, address agent, string moveType, bytes data, uint256 nonce, bytes signature, uint256 priorityFee_EVVM, uint256 nonce_EVVM, bool priorityFlag_EVVM, bytes signature_EVVM) external"
];

const contract = new ethers.Contract(
    process.env.GAME_MOVE_SERVICE_ADDRESS!,
    ABI,
    wallet
);

async function processQueue() {
    console.log("Checking for pending moves...");

    const { data: moves, error } = await supabase
        .from('game_moves')
        .select('*')
        .eq('status', 'pending')
        .limit(1);

    if (error) {
        console.error("Error fetching moves:", error);
        return;
    }

    if (!moves || moves.length === 0) {
        return;
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
        // Note: signature_evvm might be empty string if not used, but contract expects bytes.
        // If it's empty string in DB, we might need to handle it.
        // Assuming DB stores hex string "0x..." or empty.
        // If empty, pass "0x".

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
        } else {
            throw new Error("Transaction reverted");
        }

    } catch (err: any) {
        console.error("Error processing move:", err);
        await supabase
            .from('game_moves')
            .update({
                status: 'failed',
                // error: err.message, // If we had an error column
                updated_at: new Date().toISOString()
            })
            .eq('id', move.id);
    }
}

async function main() {
    console.log("Fisher started.");
    while (true) {
        await processQueue();
        // Sleep for 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

main().catch(console.error);
