
import { createClient } from '@supabase/supabase-js';

// Default to empty strings to prevent runtime errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock Supabase client if credentials are missing
let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Running in demo mode with mock client.');
  
  // Create a mock client that won't throw runtime errors but won't work with the backend
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      order: () => Promise.resolve({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ error: null })
      })
    }
  };
} else {
  // Create the actual Supabase client if credentials are available
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
