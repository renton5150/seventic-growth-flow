
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from "sonner";

// Configuration explicite pour une connexion fiable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dupguifqyjchlmzbadav.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cGd1aWZxeWpjaGxtemJhZGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODI2NDgsImV4cCI6MjA1OTQ1ODY0OH0.wbRuEEYI0bK9CvYRGYi4zZ64xY1L3fgU2PPshCJbsL4";

// Mode démonstration si les clés sont manquantes
const isDemoMode = !supabaseUrl || !supabaseAnonKey;

// Client Supabase avec configuration explicite optimisée
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    fetch: (url, options) => {
      // Créer un contrôleur d'abandon pour gérer les timeouts
      const controller = new AbortController();
      const { signal } = controller;
      
      // Définir un timeout de 10 secondes
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn("Requête Supabase interrompue après 10 secondes");
      }, 10000);
      
      return fetch(url, { 
        ...options, 
        signal,
        // Éviter les problèmes CORS
        mode: 'cors',
        credentials: 'same-origin'
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 1 // Réduit pour éviter les limitations de débit
    }
  }
});

// Vérifier l'état de la connexion
const testConnection = async () => {
  try {
    const start = Date.now();
    const { error } = await supabase.from("profiles").select("count").limit(1);
    const elapsed = Date.now() - start;
    
    if (error) {
      console.error("Erreur de connexion à Supabase:", error);
      return false;
    }
    
    console.log(`Connexion à Supabase réussie en ${elapsed}ms`);
    return true;
  } catch (err) {
    console.error("Exception lors du test de connexion Supabase:", err);
    return false;
  }
};

// Tester la connexion au démarrage (mais pas en mode production)
if (process.env.NODE_ENV !== 'production') {
  testConnection().then(isConnected => {
    if (!isConnected && !isDemoMode) {
      console.error("Problème de connexion à Supabase détecté au démarrage");
    }
  });
}

// Exporter les variables pour une utilisation dans d'autres fichiers
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
export const IS_DEMO_MODE = isDemoMode;

// Fonction d'assistance pour tester la connexion avec tentatives multiples
export const checkSupabaseConnection = async (
  maxRetries = 3,
  baseDelay = 1000
): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`Test de connexion Supabase: tentative ${attempts + 1}/${maxRetries}`);
      
      // Utiliser un nouveau contrôleur d'abandon pour chaque tentative
      const controller = new AbortController();
      const { signal } = controller;
      
      // Définir un délai d'expiration (plus court pour les tentatives)
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);
      
      const start = Date.now();
      const { data, error } = await supabase.from("profiles")
        .select("count")
        .limit(1)
        .abortSignal(signal);
      
      clearTimeout(timeoutId);
      
      const elapsed = Date.now() - start;
      console.log(`Temps de réponse du serveur Supabase: ${elapsed}ms`);
      
      if (error) {
        console.error(`Test de connexion Supabase: Échec en ${elapsed}ms`, error);
        attempts++;
        
        // Attente exponentielle entre les tentatives
        if (attempts < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempts);
          console.log(`Nouvelle tentative dans ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      } else {
        console.log(`Test de connexion Supabase: Succès en ${elapsed}ms`);
        return true;
      }
    } catch (err) {
      console.error(`Test de connexion Supabase: Exception à la tentative ${attempts + 1}`, err);
      attempts++;
      
      if (attempts < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempts);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  console.log(`Nombre maximum de tentatives atteint (${maxRetries})`);
  return false;
};
