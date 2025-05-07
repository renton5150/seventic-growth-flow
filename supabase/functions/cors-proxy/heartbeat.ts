
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Gestionnaire de heartbeat pour les Edge Functions
 * 
 * Permet de surveiller l'activité des fonctions et d'empêcher leur mise en veille
 * en utilisant une table dédiée dans Supabase
 */
export class HeartbeatManager {
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private functionId: string;
  private heartbeatInterval: number;
  private lastActivity: number;
  private intervalId: number | null = null;
  
  constructor(
    supabaseUrl: string, 
    serviceRoleKey: string,
    functionId: string,
    heartbeatIntervalMs: number = 20000
  ) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
    this.functionId = functionId;
    this.heartbeatInterval = heartbeatIntervalMs;
    this.lastActivity = Date.now();
    
    // Démarrer le service de heartbeat
    this.startHeartbeatService();
    
    console.log(`Service de heartbeat démarré (intervalle: ${heartbeatIntervalMs}ms)`);
  }
  
  /**
   * Démarre le service de battement de cœur
   */
  private startHeartbeatService(): void {
    // Envoyer un heartbeat immédiatement
    this.sendHeartbeat();
    
    // Configurer l'envoi périodique
    this.intervalId = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval) as unknown as number;
  }
  
  /**
   * Envoie un signal de heartbeat à la base de données
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const now = new Date();
      console.log(`Heartbeat at ${now.toISOString()} - Service active`);
      
      // Si nous avons une URL valide et une clé de service, enregistrer le heartbeat dans la base
      if (this.supabaseUrl && this.serviceRoleKey) {
        try {
          const supabase = createClient(this.supabaseUrl, this.serviceRoleKey);
          
          // Upsert dans la table de statut des services
          const { error } = await supabase
            .from('service_status')
            .upsert({
              function_id: this.functionId,
              last_heartbeat: new Date().toISOString(),
              status: 'active',
              metadata: {
                uptime_seconds: Math.floor(this.getUptime() / 1000),
                memory_used: 0, // À implémenter si possible
              }
            }, {
              onConflict: 'function_id'
            });
          
          if (error) {
            console.warn(`Erreur lors de l'enregistrement du heartbeat: ${error.message}`);
          }
        } catch (e) {
          // Ignorer les erreurs de heartbeat pour éviter des problèmes avec la fonction principale
          console.warn(`Exception lors de l'envoi du heartbeat: ${e}`);
        }
      }
    } catch (e) {
      console.warn(`Erreur globale du heartbeat: ${e}`);
    }
  }
  
  /**
   * Arrête le service de battement de cœur
   */
  public stopHeartbeatService(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Service de heartbeat arrêté');
    }
  }
  
  /**
   * Met à jour l'heure de dernière activité
   */
  public updateLastActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Récupère l'heure de dernière activité
   */
  public getLastActivity(): number {
    return this.lastActivity;
  }
  
  /**
   * Récupère la durée d'activité en millisecondes
   */
  public getUptime(): number {
    return Date.now() - this.lastActivity;
  }
}
