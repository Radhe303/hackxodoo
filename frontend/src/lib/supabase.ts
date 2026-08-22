import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = '';
export const SUPABASE_KEY = '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
