
/**
 * Gestionnaire de heartbeat pour les fonctions edge Supabase
 * 
 * Cette classe permet de maintenir un état actif des fonctions edge
 * en envoyant régulièrement des signaux de vie et en surveillant l'activité.
 */
import { CONFIG } from './config.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export class HeartbeatManager {
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private serviceName: string;
  private interval: number;
  private supabase: any;
  private lastActivity: number;
  private timer: number | null = null;
  
  /**
   * Initialise un gestionnaire de heartbeat
   * 
   * @param supabaseUrl - URL de l'instance Supabase
   * @param serviceRoleKey - Clé de service Supabase
   * @param serviceName - Nom du service pour l'identification
   * @param interval - Intervalle entre les heartbeats en ms
   */
  constructor(
    supabaseUrl: string, 
    serviceRoleKey: string, 
    serviceName: string,
    interval: number = 30000
  ) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
    this.serviceName = serviceName;
    this.interval = interval;
    this.lastActivity = Date.now();
    
    // Initialiser le client Supabase
    this.supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Démarrer le heartbeat
    this.start();
  }
  
  /**
   * Démarre le processus de heartbeat
   */
  start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Enregistrer immédiatement un premier heartbeat
    this.sendHeartbeat();
    
    // Configurer l'intervalle pour les heartbeats réguliers
    this.timer = setInterval(() => this.sendHeartbeat(), this.interval);
  }
  
  /**
   * Envoie un signal de heartbeat
   */
  async sendHeartbeat(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`Heartbeat at ${timestamp} - Service active`);
      
      // On pourrait enregistrer le heartbeat dans la base de données
      // si nécessaire pour la surveillance externe
    } catch (error) {
      console.error(`Error sending heartbeat:`, error);
    }
  }
  
  /**
   * Met à jour le timestamp de dernière activité
   */
  updateLastActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Récupère le timestamp de dernière activité
   */
  getLastActivity(): number {
    return this.lastActivity;
  }
  
  /**
   * Arrête le processus de heartbeat
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
