import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  // 1. Try process.env (for build time config)
  let supabaseUrl = process.env.SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_KEY;

  // 2. Try localStorage (for runtime config via Settings)
  if (!supabaseUrl) {
    supabaseUrl = localStorage.getItem('supabase_url') || '';
  }
  if (!supabaseKey) {
    supabaseKey = localStorage.getItem('supabase_key') || '';
  }

  if (supabaseUrl && supabaseKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
      return supabaseInstance;
    } catch (error) {
      console.error("Invalid Supabase URL or Key provided.", error);
      return null;
    }
  }

  return null;
};

export const isSupabaseConfigured = (): boolean => {
  const client = getSupabaseClient();
  return !!client;
};
