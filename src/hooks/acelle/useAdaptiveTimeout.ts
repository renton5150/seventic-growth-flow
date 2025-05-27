
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
}

export const useAdaptiveTimeout = () => {
  const [performanceData, setPerformanceData] = useState<Map<string, PerformanceMetrics>>(new Map());
  const measurementRef = useRef<Map<string, number>>(new Map());

  // Démarrer une mesure de performance
  const startMeasurement = useCallback((account: AcelleAccount, operation: string) => {
    const key = `${account.id}-${operation}`;
    measurementRef.current.set(key, Date.now());
    console.log(`[AdaptiveTimeout] Début mesure pour ${account.name} - ${operation}`);
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
      
      // Calculer le timeout recommandé
      let recommendedTimeout = getAdaptiveTimeout(account.name);
      if (isSlowApi) {
        const multiplier = averageResponseTime > 30000 
          ? SLOW_API_CONFIG.VERY_SLOW_TIMEOUT_MULTIPLIER 
          : SLOW_API_CONFIG.SLOW_TIMEOUT_MULTIPLIER;
        recommendedTimeout = Math.min(recommendedTimeout * multiplier, API_TIMEOUT_SLOW_MS);
      }
      
      const metrics: PerformanceMetrics = {
        accountId: account.id,
        accountName: account.name,
        responseTimes,
        averageResponseTime,
        isSlowApi,
        recommendedTimeout,
        lastMeasurement: new Date()
      };
      
      updated.set(account.id, metrics);
      
      console.log(`[AdaptiveTimeout] Mesure terminée pour ${account.name}:`, {
        duration: `${duration}ms`,
        average: `${averageResponseTime.toFixed(0)}ms`,
        isSlowApi,
        recommendedTimeout: `${recommendedTimeout}ms`
      });
      
      return updated;
    });
    
    return duration;
  }, []);

  // Obtenir le timeout recommandé pour un compte
  const getTimeoutForAccount = useCallback((account: AcelleAccount): number => {
    const metrics = performanceData.get(account.id);
    return metrics?.recommendedTimeout || getAdaptiveTimeout(account.name);
  }, [performanceData]);

  // Obtenir les métriques pour un compte
  const getMetricsForAccount = useCallback((account: AcelleAccount): PerformanceMetrics | null => {
    return performanceData.get(account.id) || null;
  }, [performanceData]);

  // Obtenir toutes les métriques
  const getAllMetrics = useCallback((): PerformanceMetrics[] => {
    return Array.from(performanceData.values());
  }, [performanceData]);

  return {
    startMeasurement,
    endMeasurement,
    getTimeoutForAccount,
    getMetricsForAccount,
    getAllMetrics,
    performanceData: Array.from(performanceData.values())
  };
};
