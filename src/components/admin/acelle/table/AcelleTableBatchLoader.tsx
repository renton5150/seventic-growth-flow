
import React, { useEffect } from 'react';
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from '@/types/acelle.types';
import { batchFetchCampaignStats } from '@/services/acelle/api/optimizedStats';
import { useCampaignStatsCache } from '@/hooks/acelle/useCampaignStatsCache';

interface AcelleTableBatchLoaderProps {
  campaigns: AcelleCampaign[];
  account: AcelleAccount | null;
  demoMode?: boolean;
  onBatchLoadComplete?: (stats: Map<string, AcelleCampaignStatistics>) => void;
}

/**
 * Composant utilitaire pour charger les statistiques par lots
 * Ce composant ne rend rien à l'écran mais gère le chargement en arrière-plan
 */
export const AcelleTableBatchLoader: React.FC<AcelleTableBatchLoaderProps> = ({
  campaigns,
  account,
  demoMode = false,
  onBatchLoadComplete
}) => {
  const { cacheStats } = useCampaignStatsCache();
  
  useEffect(() => {
    let mounted = true;
    
    // Identifier les campagnes qui ont besoin de statistiques
    const campaignsNeedingStats = campaigns.filter(campaign => {
      // Si la campagne n'a pas d'identifiant valide
      if (!campaign.uid && !campaign.campaign_uid) return false;
      
      // Si la campagne a déjà des statistiques complètes
      if (campaign.statistics && Object.keys(campaign.statistics).length > 0) return false;
      
      return true;
    });
    
    // Si aucune campagne ne nécessite de statistiques, ne rien faire
    if (campaignsNeedingStats.length === 0) {
      console.log('[BatchLoader] Toutes les campagnes ont déjà des statistiques. Aucun chargement nécessaire.');
      if (onBatchLoadComplete) {
        // CORRECTION: Même s'il n'y a rien à charger, notifier le parent pour mettre à jour l'UI
        onBatchLoadComplete(new Map());
      }
      return;
    }
    
    console.log(`[BatchLoader] Chargement par lots pour ${campaignsNeedingStats.length} campagnes`);
    
    const loadStatsBatch = async () => {
      try {
        // Récupérer les statistiques par lots
        const statsMap = await batchFetchCampaignStats(
          campaignsNeedingStats,
          account,
          { demoMode }
        );
        
        // Ne pas continuer si le composant a été démonté
        if (!mounted) return;
        
        // Mettre les statistiques en cache
        statsMap.forEach((stats, uid) => {
          if (stats) {
            console.log(`[BatchLoader] Mise en cache des stats pour ${uid}`, stats);
            cacheStats(uid, stats);
            
            // CORRECTION: Mettre à jour les statistiques directement sur l'objet campagne
            const campaign = campaigns.find(c => c.uid === uid || c.campaign_uid === uid);
            if (campaign) {
              campaign.statistics = stats;
            }
          }
        });
        
        // Notifier le parent que le chargement par lots est terminé
        if (onBatchLoadComplete) {
          onBatchLoadComplete(statsMap);
        }
        
        console.log(`[BatchLoader] Chargement par lots terminé pour ${statsMap.size} campagnes`);
      } catch (error) {
        console.error('[BatchLoader] Erreur lors du chargement par lots:', error);
        
        // CORRECTION: Même en cas d'erreur, notifier le parent pour mettre à jour l'UI
        if (onBatchLoadComplete && mounted) {
          onBatchLoadComplete(new Map());
        }
      }
    };
    
    // Utiliser un léger délai pour ne pas bloquer le rendu initial
    const timeoutId = setTimeout(loadStatsBatch, 300);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [campaigns, account, demoMode, cacheStats, onBatchLoadComplete]);
  
  // Ce composant ne rend rien visuellement
  return null;
};
