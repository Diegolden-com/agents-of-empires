import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/utils/supabase/database.types';

/**
 * Script para limpiar movimientos con firmas inválidas
 */
async function cleanInvalidMoves() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env');
    }

    console.log('🧹 Cleaning invalid moves from database...\n');

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // 1. Obtener todos los movimientos pendientes y procesando
    const { data: moves, error: fetchError } = await supabase
      .from('game_moves')
      .select('*')
      .in('status', ['pending', 'processing', 'failed']);

    if (fetchError) {
      throw new Error(`Error fetching moves: ${fetchError.message}`);
    }

    if (!moves || moves.length === 0) {
      console.log('✅ No moves to clean.');
      return;
    }

    console.log(`Found ${moves.length} moves to check\n`);

    // 2. Filtrar movimientos con firmas inválidas
    const invalidMoves = moves.filter(move => {
      // Firmas deben tener 132 caracteres (0x + 130 hex chars para 65 bytes)
      return move.signature.length !== 132;
    });

    if (invalidMoves.length === 0) {
      console.log('✅ All signatures are valid!');
      return;
    }

    console.log(`❌ Found ${invalidMoves.length} moves with invalid signatures:\n`);

    invalidMoves.forEach((move, index) => {
      console.log(`${index + 1}. Move ID: ${move.id}`);
      console.log(`   Game: ${move.game_id}`);
      console.log(`   Type: ${move.move_type}`);
      console.log(`   Status: ${move.status}`);
      console.log(`   Signature length: ${move.signature.length} (expected 132)`);
      console.log(`   Created: ${move.created_at}\n`);
    });

    // 3. Preguntar confirmación (en este caso, procedemos automáticamente)
    console.log(`\n🗑️  Deleting ${invalidMoves.length} invalid moves...\n`);

    const invalidMoveIds = invalidMoves.map(m => m.id);

    const { error: deleteError } = await supabase
      .from('game_moves')
      .delete()
      .in('id', invalidMoveIds);

    if (deleteError) {
      throw new Error(`Error deleting moves: ${deleteError.message}`);
    }

    console.log(`✅ Successfully deleted ${invalidMoves.length} invalid moves!`);
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure EVVM_ID=0 is in your .env file');
    console.log('   2. Restart your game/agent to generate new moves with correct signatures');
    console.log('   3. New signatures will include evvmID in the format: "0,recordMove,gameId,moveType,dataHash,nonce"');

  } catch (error: any) {
    console.error('❌ Error cleaning moves:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanInvalidMoves()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanInvalidMoves };
