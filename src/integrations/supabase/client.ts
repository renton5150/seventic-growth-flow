
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration Supabase explicite et cohérente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dupguifqyjchlmzbadav.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cGd1aWZxeWpjaGxtemJhZGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODI2NDgsImV4cCI6MjA1OTQ1ODY0OH0.wbRuEEYI0bK9CvYRGYi4zZ64xY1L3fgU2PPshCJbsL4";

// Client Supabase avec configuration explicite et timeout augmenté
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        credentials: 'same-origin' as RequestCredentials
      };
      
      return fetch(url, fetchOptions)
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error(`Erreur Supabase pour ${url}:`, error);
          throw error;
        });
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 5
    }
  }
});

// Vérifier et afficher l'état de la connexion
console.log("Supabase client initialisé avec l'URL:", supabaseUrl);
console.log("Mode de fonctionnement:", supabaseUrl && supabaseAnonKey ? "Production" : "Démonstration");

// Exporter les variables pour une utilisation dans d'autres fichiers
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
