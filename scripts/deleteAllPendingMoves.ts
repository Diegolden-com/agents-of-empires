import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/utils/supabase/database.types';

/**
 * Script para borrar TODOS los movimientos pendientes
 * Esto es necesario porque las firmas existentes fueron generadas sin evvmID
 */
async function deleteAllPendingMoves() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env');
    }

    console.log('🗑️  Deleting all pending/processing/failed moves...\n');

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // 1. Contar cuántos movimientos hay
    const { count, error: countError } = await supabase
      .from('game_moves')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing', 'failed']);

    if (countError) {
      throw new Error(`Error counting moves: ${countError.message}`);
    }

    console.log(`Found ${count} moves to delete\n`);

    if (count === 0) {
      console.log('✅ No moves to delete');
      return;
    }

    // 2. Borrar todos los movimientos
    const { error: deleteError } = await supabase
      .from('game_moves')
      .delete()
      .in('status', ['pending', 'processing', 'failed']);

    if (deleteError) {
      throw new Error(`Error deleting moves: ${deleteError.message}`);
    }

    console.log(`✅ Successfully deleted ${count} moves!\n`);
    console.log('📝 Next steps:');
    console.log('   1. Verify EVVM_ID=0 is in your .env file');
    console.log('   2. Restart your game to generate new moves');
    console.log('   3. New signatures will be created with the correct format:');
    console.log('      "0,recordMove,{gameId},{moveType},{dataHash},{nonce}"');
    console.log('   4. Run the fisher process to submit the new moves to the blockchain');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  deleteAllPendingMoves()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deleteAllPendingMoves };
