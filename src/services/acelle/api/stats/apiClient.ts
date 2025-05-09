
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { buildDirectApiUrl } from "@/services/acelle/acelle-service";
import { extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

/**
 * Récupère les statistiques d'une campagne via l'API Acelle
 */
export const fetchCampaignStatisticsFromApi = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`Tentative de récupération des statistiques pour la campagne ${campaignUid}`);
    
    // URL pour l'API
    const apiUrl = buildDirectApiUrl(`campaigns/${campaignUid}`, account.api_endpoint, {
      api_token: account.api_token
    });
    
    // Effectuer la requête
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Extraire les données JSON
    const data = await response.json();
    
    // Utiliser notre fonction d'extraction universelle
    const statistics = extractStatisticsFromAnyFormat(data, true);
    
    console.log(`Statistiques extraites pour la campagne ${campaignUid}:`, statistics);
    
    return statistics;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Récupération des statistiques via l'API de rapports (méthode alternative)
 */
export const fetchCampaignStatisticsLegacy = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`Tentative de récupération des statistiques via l'API de rapports pour ${campaignUid}`);
    
    // Essayer d'abord avec l'endpoint 'reports'
    const reportUrl = buildDirectApiUrl(`reports/campaign/${campaignUid}`, account.api_endpoint, {
      api_token: account.api_token
    });
    
    try {
      const reportResponse = await fetch(reportUrl, {
        headers: {
          'Accept': 'application/json',
          'x-acelle-token': account.api_token,
          'x-acelle-endpoint': account.api_endpoint
        }
      });
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        console.log(`Données de rapport récupérées pour ${campaignUid}:`, reportData);
        
        // Utiliser notre fonction d'extraction universelle
        const statistics = extractStatisticsFromAnyFormat(reportData, true);
        
        return statistics;
      } else {
        console.error(`Échec de la tentative avec endpoint report: ${reportResponse.status}`);
      }
    } catch (reportError) {
      console.error(`Erreur avec l'endpoint report:`, reportError);
    }
    
    // Si échec, essayer avec l'endpoint 'tracking'
    const trackingUrl = buildDirectApiUrl(`campaigns/${campaignUid}/tracking_log`, account.api_endpoint, {
      api_token: account.api_token
    });
    
    try {
      const trackingResponse = await fetch(trackingUrl, {
        headers: {
          'Accept': 'application/json',
          'x-acelle-token': account.api_token,
          'x-acelle-endpoint': account.api_endpoint
        }
      });
      
      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        
        // Calculer les statistiques à partir des logs de tracking
        if (trackingData && trackingData.tracking_logs) {
          const logs = trackingData.tracking_logs;
          
          // Formatter les données de tracking en statistiques
          const trackedStats = {
            subscriber_count: logs.length,
            delivered_count: logs.filter((log: any) => log.status === 'delivered').length,
            open_count: logs.filter((log: any) => log.open_log).length,
            click_count: logs.filter((log: any) => log.click_log).length,
            bounce_count: logs.filter((log: any) => log.status === 'bounced').length
          };
          
          // Utiliser notre fonction d'extraction universelle
          const statistics = extractStatisticsFromAnyFormat(trackedStats, true);
          
          return statistics;
        }
      } else {
        console.error(`Échec de la tentative avec endpoint tracking: ${trackingResponse.status}`);
      }
    } catch (trackingError) {
      console.error(`Erreur avec l'endpoint tracking:`, trackingError);
    }
    
    // Toutes les tentatives ont échoué
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques legacy pour ${campaignUid}:`, error);
    return null;
  }
};
