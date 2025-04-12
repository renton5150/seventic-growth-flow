
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration explicite pour une connexion fiable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dupguifqyjchlmzbadav.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cGd1aWZxeWpjaGxtemJhZGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODI2NDgsImV4cCI6MjA1OTQ1ODY0OH0.wbRuEEYI0bK9CvYRGYi4zZ64xY1L3fgU2PPshCJbsL4";

// Client Supabase avec configuration améliorée pour la stabilité et la performance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    headers: { 'x-app-version': '1.0.0' },
  },
  realtime: {
    params: {
      eventsPerSecond: 2 // Réduit pour éviter les limitations de taux
    }
  },
  db: {
    schema: 'public'
  }
});

// Vérifier et afficher l'état de la connexion
console.log("Supabase client initialisé avec l'URL:", supabaseUrl);
console.log("Mode de fonctionnement:", supabaseUrl && supabaseAnonKey ? "Production" : "Démonstration");

// Test de connexion simple pour vérifier la disponibilité du serveur
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const startTime = Date.now();
    // Utilisons une approche sans timeout explicite car ce n'est pas supporté directement
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
      
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`Test de connexion Supabase: ${error ? 'Échec' : 'Succès'} en ${duration}ms`);
    
    if (error) {
      console.error("Erreur de connexion à Supabase:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception lors du test de connexion à Supabase:", err);
    return false;
  }
};

// Exporter les variables pour une utilisation dans d'autres fichiers
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
