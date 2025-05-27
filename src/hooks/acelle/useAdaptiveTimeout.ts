
import { useState, useCallback, useRef } from 'react';
import { AcelleAccount } from '@/types/acelle.types';
import { 
  API_TIMEOUT_MS, 
  API_TIMEOUT_SLOW_MS,
  SLOW_API_CONFIG,
  getAdaptiveTimeout 
} from '@/utils/acelle/config';

interface PerformanceMetrics {
  accountId: string;
  accountName: string;
  responseTimes: number[];
  averageResponseTime: number;
  isSlowApi: boolean;
  recommendedTimeout: number;
  lastMeasurement: Date | null;
  consecutiveSlowRequests: number;
  isVerySlowApi: boolean;
}

export const useAdaptiveTimeout = () => {
  const [performanceData, setPerformanceData] = useState<Map<string, PerformanceMetrics>>(new Map());
  const measurementRef = useRef<Map<string, number>>(new Map());

  // Démarrer une mesure de performance
  const startMeasurement = useCallback((account: AcelleAccount, operation: string) => {
    const key = `${account.id}-${operation}`;
    measurementRef.current.set(key, Date.now());
    console.log(`[AdaptiveTimeout] 🚀 Début mesure pour ${account.name} - ${operation}`);
  }, []);

  // Terminer une mesure et mettre à jour les métriques
  const endMeasurement = useCallback((account: AcelleAccount, operation: string) => {
    const key = `${account.id}-${operation}`;
    const startTime = measurementRef.current.get(key);
    
    if (!startTime) return null;
    
    const duration = Date.now() - startTime;
    measurementRef.current.delete(key);
    
    setPerformanceData(prev => {
      const updated = new Map(prev);
      const existing = updated.get(account.id);
      
      const responseTimes = existing 
        ? [...existing.responseTimes, duration].slice(-SLOW_API_CONFIG.RESPONSE_TIME_HISTORY_SIZE)
        : [duration];
      
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const isSlowApi = averageResponseTime > SLOW_API_CONFIG.DETECTION_THRESHOLD_MS;
      const isVerySlowApi = averageResponseTime > 45000; // 45 secondes
      
      // Compter les requêtes lentes consécutives
      const consecutiveSlowRequests = existing?.consecutiveSlowRequests || 0;
      const newConsecutiveSlowRequests = duration > SLOW_API_CONFIG.DETECTION_THRESHOLD_MS 
        ? consecutiveSlowRequests + 1 
        : 0;
      
      // Calculer le timeout recommandé de manière plus intelligente
      let recommendedTimeout = getAdaptiveTimeout(account.name);
      
      if (isVerySlowApi || newConsecutiveSlowRequests >= 3) {
        // API très lente ou plusieurs échecs consécutifs
        recommendedTimeout = Math.min(recommendedTimeout * SLOW_API_CONFIG.VERY_SLOW_TIMEOUT_MULTIPLIER, 180000); // Max 3 minutes
      } else if (isSlowApi) {
        recommendedTimeout = Math.min(recommendedTimeout * SLOW_API_CONFIG.SLOW_TIMEOUT_MULTIPLIER, API_TIMEOUT_SLOW_MS);
      }
      
      const metrics: PerformanceMetrics = {
        accountId: account.id,
        accountName: account.name,
        responseTimes,
        averageResponseTime,
        isSlowApi,
        isVerySlowApi,
        recommendedTimeout,
        lastMeasurement: new Date(),
        consecutiveSlowRequests: newConsecutiveSlowRequests
      };
      
      updated.set(account.id, metrics);
      
      // Log détaillé pour le debugging
      const statusIcon = isVerySlowApi ? '🐌' : isSlowApi ? '⚠️' : '✅';
      console.log(`[AdaptiveTimeout] ${statusIcon} Mesure terminée pour ${account.name}:`, {
        duration: `${duration}ms`,
        average: `${averageResponseTime.toFixed(0)}ms`,
        isSlowApi,
        isVerySlowApi,
        consecutiveSlowRequests: newConsecutiveSlowRequests,
        recommendedTimeout: `${recommendedTimeout}ms`
      });
      
      return updated;
    });
    
    return duration;
  }, []);

  // Obtenir le timeout recommandé pour un compte avec escalade intelligente
  const getTimeoutForAccount = useCallback((account: AcelleAccount): number => {
    const metrics = performanceData.get(account.id);
    if (!metrics) {
      return getAdaptiveTimeout(account.name);
    }
    
    // Si l'API a été très lente récemment, utiliser un timeout plus long
    if (metrics.consecutiveSlowRequests >= 2) {
      return Math.min(metrics.recommendedTimeout * 1.5, 180000);
    }
    
    return metrics.recommendedTimeout;
  }, [performanceData]);

  // Obtenir les métriques pour un compte
  const getMetricsForAccount = useCallback((account: AcelleAccount): PerformanceMetrics | null => {
    return performanceData.get(account.id) || null;
  }, [performanceData]);

  // Obtenir toutes les métriques
  const getAllMetrics = useCallback((): PerformanceMetrics[] => {
    return Array.from(performanceData.values());
  }, [performanceData]);

  // Réinitialiser les métriques d'un compte (utile après correction côté serveur)
  const resetAccountMetrics = useCallback((account: AcelleAccount) => {
    setPerformanceData(prev => {
      const updated = new Map(prev);
      updated.delete(account.id);
      console.log(`[AdaptiveTimeout] 🔄 Métriques réinitialisées pour ${account.name}`);
      return updated;
    });
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    getTimeoutForAccount,
    getMetricsForAccount,
    getAllMetrics,
    resetAccountMetrics,
    performanceData: Array.from(performanceData.values())
  };
};
