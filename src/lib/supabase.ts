import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twlcviwrlcyhkgjnzerz.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZIIB8aSOZ-hlToeh206ymQ_PxLt3qmc';
const useSupabase = true;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export { supabase, useSupabase };
