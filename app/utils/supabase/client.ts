
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!\n\nCheck your Supabase project\'s API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api');
  }
  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
};

