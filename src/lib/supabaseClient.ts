import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create a single instance of the Supabase client
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Helper functions for role checking
export const isAdmin = (user: any) => user?.user_metadata?.role === 'admin';
export const isClient = (user: any) => user?.user_metadata?.role === 'client';
export const isApproved = (user: any) => user?.user_metadata?.approved !== false;

// Type guard for user roles
export const getUserRole = (user: any): 'admin' | 'client' | null => {
  return user?.user_metadata?.role || null;
}; 