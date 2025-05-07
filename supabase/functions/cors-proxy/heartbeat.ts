
/**
 * Gestionnaire de heartbeat amélioré pour maintenir les edge functions actives
 * Implémente une stratégie de heartbeat robuste pour éviter les shutdowns
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export class HeartbeatManager {
  private lastActivity: number = Date.now();
  private serviceStartTime: number = Date.now();
  private heartbeatInterval: any = null;
  private supabase: any = null;
  private serviceName: string;
  private serviceId: string;
  private intervalMs: number;
  private isShuttingDown: boolean = false;
  private shutdownHandlerRegistered: boolean = false;
  
  constructor(
    supabaseUrl: string,
    serviceRoleKey: string,
    serviceName: string,
    intervalMs: number = 20000 // 20 secondes par défaut
  ) {
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("HeartbeatManager: URL ou clé Supabase manquante");
      return;
    }
    
    try {
      this.supabase = createClient(supabaseUrl, serviceRoleKey);
    } catch (e) {
      console.error("HeartbeatManager: Erreur lors de l'initialisation du client Supabase", e);
    }
    
    this.serviceName = serviceName;
    this.serviceId = `${serviceName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.intervalMs = intervalMs;
    
    this.startHeartbeat();
    this.registerShutdownHandler();
  }
  
  // Démarre le service de heartbeat
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Premier heartbeat immédiat
    this.sendHeartbeat();
    
    // Configurer l'intervalle régulier
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.intervalMs);
    
    console.log(`Service de heartbeat démarré (intervalle: ${this.intervalMs}ms)`);
  }
  
  // Envoie un signal de heartbeat pour indiquer que le service est actif
  private async sendHeartbeat(): Promise<void> {
    if (this.isShuttingDown) return;
    
    const now = new Date();
    console.log(`Heartbeat at ${now.toISOString()} - Service active`);
    
    // Essayer d'enregistrer le heartbeat dans Supabase si disponible
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('edge_function_heartbeats')
          .upsert({
            service_id: this.serviceId,
            service_name: this.serviceName,
            last_heartbeat: new Date().toISOString(),
            uptime_seconds: Math.floor((Date.now() - this.serviceStartTime) / 1000),
            heartbeat_interval_ms: this.intervalMs
          }, {
            onConflict: 'service_id'
          });
          
        if (error) {
          // Si la table n'existe pas, on l'ignore silencieusement
          if (!error.message.includes('does not exist')) {
            console.warn("Erreur lors de l'envoi du heartbeat à Supabase:", error);
          }
        }
      } catch (e) {
        // Ignorer les erreurs de heartbeat
      }
    }
    
    this.lastActivity = Date.now();
  }
  
  // Gère la fermeture propre du service
  private registerShutdownHandler(): void {
    if (this.shutdownHandlerRegistered) return;
    
    // Gérer la fermeture de l'edge function
    // @ts-ignore
    addEventListener('beforeunload', (event) => {
      console.log(`shutdown`);
      this.isShuttingDown = true;
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      
      // Enregistrer l'arrêt dans Supabase si disponible
      if (this.supabase) {
        try {
          // Pas besoin d'attendre la fin de cette promesse
          this.supabase
            .from('edge_function_heartbeats')
            .update({
              status: 'shutdown',
              shutdown_time: new Date().toISOString(),
              uptime_seconds: Math.floor((Date.now() - this.serviceStartTime) / 1000)
            })
            .eq('service_id', this.serviceId);
        } catch (e) {
          // Ignorer les erreurs lors de la fermeture
        }
      }
    });
    
    this.shutdownHandlerRegistered = true;
  }
  
  // Méthode publique pour mettre à jour l'heure de dernière activité
  public updateLastActivity(): void {
    this.lastActivity = Date.now();
  }
  
  // Méthode publique pour obtenir l'heure de dernière activité
  public getLastActivity(): number {
    return this.lastActivity;
  }
  
  // Méthode publique pour obtenir la durée de fonctionnement
  public getUptime(): number {
    return Date.now() - this.serviceStartTime;
  }
}
