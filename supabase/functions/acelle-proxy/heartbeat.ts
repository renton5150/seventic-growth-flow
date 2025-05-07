
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { debugLog, LOG_LEVELS } from './logger.ts';

/**
 * Configuration du système de heartbeat pour les edge functions
 */
export class HeartbeatManager {
  private supabase;
  private lastActivity: number;
  private heartbeatInterval: number;
  private functionName: string;
  
  /**
   * Initialise le gestionnaire de heartbeat
   * 
   * @param supabaseUrl - URL de l'instance Supabase
   * @param serviceKey - Clé de service pour l'authentification
   * @param functionName - Nom de la fonction à surveiller
   * @param heartbeatInterval - Intervalle entre les heartbeats (ms)
   */
  constructor(
    supabaseUrl: string,
    serviceKey: string,
    functionName: string = 'acelle-proxy',
    heartbeatInterval: number = 30000
  ) {
    this.supabase = createClient(supabaseUrl, serviceKey);
    this.lastActivity = Date.now();
    this.heartbeatInterval = heartbeatInterval;
    this.functionName = functionName;
    
    // Démarrer les heartbeats
    this.startHeartbeatInterval();
    
    // Démarrer la surveillance du service
    this.startServiceCheck();
  }
  
  /**
   * Démarre l'intervalle de heartbeat
   */
  private startHeartbeatInterval() {
    setInterval(async () => {
      // Only log if the function has been idle for a while
      if (Date.now() - this.lastActivity > this.heartbeatInterval) {
        debugLog(`Heartbeat at ${new Date().toISOString()} - Service active`, {}, LOG_LEVELS.INFO);
        
        // Record heartbeat in database to track function status
        try {
          await this.supabase.from('edge_function_stats').upsert({
            function_name: this.functionName,
            last_heartbeat: new Date().toISOString(),
            status: 'active'
          }, { onConflict: 'function_name' });
        } catch (error) {
          debugLog("Failed to record heartbeat:", error, LOG_LEVELS.ERROR);
        }
      }
      
      this.updateLastActivity();
    }, this.heartbeatInterval);
  }
  
  /**
   * Démarre la surveillance du service
   */
  private startServiceCheck() {
    setInterval(async () => {
      try {
        // Check last activity to see if function is unresponsive
        const inactiveTime = Date.now() - this.lastActivity;
        if (inactiveTime > this.heartbeatInterval * 3) {
          debugLog(`Service appears inactive for ${Math.floor(inactiveTime/1000)}s, attempting restart`, {}, LOG_LEVELS.WARN);
          
          // Update status to restarting
          await this.supabase.from('edge_function_stats').upsert({
            function_name: this.functionName,
            last_heartbeat: new Date().toISOString(),
            status: 'restarting'
          }, { onConflict: 'function_name' });
          
          // Update last activity to prevent multiple restart attempts
          this.updateLastActivity();
        }
      } catch (error) {
        debugLog("Error during service check:", error, LOG_LEVELS.ERROR);
      }
    }, this.heartbeatInterval * 2);
  }
  
  /**
   * Met à jour le timestamp de dernière activité
   */
  public updateLastActivity() {
    this.lastActivity = Date.now();
  }
  
  /**
   * Récupère le timestamp de dernière activité
   */
  public getLastActivity(): number {
    return this.lastActivity;
  }
}
