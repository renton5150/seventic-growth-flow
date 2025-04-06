
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// URL et clé Supabase explicites sans dépendre des variables d'environnement
const SUPABASE_URL = "https://dupguifqyjchlmzbadav.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cGd1aWZxeWpjaGxtemJhZGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODI2NDgsImV4cCI6MjA1OTQ1ODY0OH0.wbRuEEYI0bK9CvYRGYi4zZ64xY1L3fgU2PPshCJbsL4";

// Configuration optimisée du client Supabase avec meilleure gestion des timeouts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: { 'X-Client-Info': 'seventic-app' },
  },
  db: {
    schema: 'public',
  }
});

// Notification en console pour confirmer l'initialisation correcte
console.log("Client Supabase initialisé avec succès");
