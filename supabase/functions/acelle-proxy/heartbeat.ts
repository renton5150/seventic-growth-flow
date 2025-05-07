
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Gestionnaire de heartbeat pour les fonctions Edge
 * 
 * Cette classe permet de suivre l'activité des fonctions Edge
 * et d'éviter leur mise en veille par des heartbeats réguliers.
 */
export class HeartbeatManager {
  private lastActivity: number;
  private supabase: any;
  private heartbeatInterval: number;
  private functionName: string;
  private intervalId: number | null = null;
  
  constructor(
    supabaseUrl: string,
    serviceRoleKey: string,
    functionName: string,
    heartbeatInterval: number = 30000 // 30 secondes par défaut
  ) {
    this.lastActivity = Date.now();
    this.heartbeatInterval = heartbeatInterval;
    this.functionName = functionName;
    
    this.supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );
    
    // Démarrer le heartbeat
    this.startHeartbeat();
  }
  
  /**
   * Met à jour le timestamp de dernière activité
   */
  public updateLastActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Récupère le timestamp de dernière activité
   */
  public getLastActivity(): number {
    return this.lastActivity;
  }
  
  /**
   * Démarre le heartbeat périodique
   */
  private startHeartbeat(): void {
    // Envoyer immédiatement un heartbeat
    this.sendHeartbeat();
    
    // Configurer l'intervalle pour les heartbeats réguliers
    this.intervalId = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }
  
  /**
   * Envoie un heartbeat pour maintenir la fonction active
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const now = new Date().toISOString();
      console.log(`Heartbeat at ${now} - Service active`);
      
      // Enregistrer optionnellement le heartbeat dans une table Supabase
      try {
        await this.supabase
          .from('edge_function_heartbeats')
          .upsert({
            function_name: this.functionName,
            last_heartbeat: now,
            uptime_ms: Date.now() - this.lastActivity
          }, {
            onConflict: 'function_name'
          });
      } catch (dbError) {
        // Ignorer les erreurs de base de données pour ne pas bloquer la fonction
        // La table peut ne pas exister, et ce n'est pas critique
      }
    } catch (error) {
      console.error("Error in heartbeat:", error);
    }
  }
  
  /**
   * Arrête le heartbeat
   */
  public stopHeartbeat(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
