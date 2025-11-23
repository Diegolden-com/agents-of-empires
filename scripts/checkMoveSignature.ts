import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/utils/supabase/database.types';

/**
 * Script para verificar una firma específica
 */
async function checkMoveSignature(moveId?: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    let query = supabase
      .from('game_moves')
      .select('*');

    if (moveId) {
      query = query.eq('id', moveId);
    } else {
      query = query.eq('status', 'pending').limit(5);
    }

    const { data: moves, error } = await query;

    if (error) {
      throw new Error(`Error fetching moves: ${error.message}`);
    }

    if (!moves || moves.length === 0) {
      console.log('No moves found');
      return;
    }

    console.log(`\n📋 Checking ${moves.length} move(s):\n`);

    moves.forEach((move, index) => {
      console.log(`${index + 1}. Move ID: ${move.id}`);
      console.log(`   Game: ${move.game_id}`);
      console.log(`   Agent: ${move.agent}`);
      console.log(`   Type: ${move.move_type}`);
      console.log(`   Status: ${move.status}`);
      console.log(`   Nonce: ${move.nonce}`);
      console.log(`   Signature: ${move.signature}`);
      console.log(`   Signature length: ${move.signature.length} chars`);

      // Calculate expected bytes
      const hexChars = move.signature.startsWith('0x')
        ? move.signature.length - 2
        : move.signature.length;
      const bytes = hexChars / 2;
      console.log(`   Signature bytes: ${bytes} (expected 65)`);

      if (bytes !== 65) {
        console.log(`   ❌ INVALID: Signature must be 65 bytes (130 hex chars + 0x = 132 total)`);
      } else {
        console.log(`   ✅ Valid signature length`);
      }
      console.log();
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const moveId = process.argv[2]; // Opcional: pasar ID del move como argumento
  checkMoveSignature(moveId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { checkMoveSignature };
