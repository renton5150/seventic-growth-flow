
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchCampaignStats } from "@/utils/acelle/campaignStatusUtils";
import { getCachedStats, updateCachedStats, hasValidStatistics } from "./statsCache";
import { mapApiStatsToModel } from "./statsMapper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SmartStatsOptions {
  forceRefresh?: boolean;
  timeout?: number;
  quietMode?: boolean;
}

/**
 * Récupère les statistiques d'une campagne de manière intelligente
 * - Utilise le cache si disponible et frais
 * - Sinon, récupère depuis l'API et met à jour le cache
 */
export const getSmartCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: SmartStatsOptions = {}
): Promise<AcelleCampaignStatistics | null> => {
  const { forceRefresh = false, quietMode = false } = options;
  const campaignUid = campaign.uid || campaign.campaign_uid;
  
  if (!campaignUid || !account?.id) {
    console.error("Identifiants de campagne ou de compte manquants");
    return null;
  }
  
  try {
    // 1. Vérifier d'abord le cache (sauf si forceRefresh est true)
    if (!forceRefresh) {
      const { statistics, isFresh } = await getCachedStats(campaignUid, account.id);
      
      // Utiliser les statistiques en cache si elles sont fraîches et valides
      if (statistics && (isFresh || !options.forceRefresh) && hasValidStatistics(statistics)) {
        console.log(`Utilisation des statistiques en cache pour ${campaign.name || campaignUid}`);
        return statistics;
      }
    }
    
    // 2. Récupérer depuis l'API si le cache n'est pas frais ou forceRefresh est true
    console.log(`Récupération des statistiques depuis l'API pour ${campaign.name || campaignUid}`);
    
    // Récupérer un token d'authentification pour les appels API
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      if (!quietMode) toast.error("Authentification requise pour récupérer les statistiques");
      console.error("Token d'authentification manquant");
      return null;
    }
    
    // Récupérer les statistiques depuis l'API
    const apiStats = await fetchCampaignStats(
      campaignUid,
      account.apiEndpoint,
      account.apiToken
    );
    
    if (!apiStats) {
      console.log(`Pas de statistiques API pour ${campaign.name || campaignUid}`);
      
      // Si des statistiques existantes sont disponibles dans l'objet campaign, les utiliser
      if (campaign.statistics && hasValidStatistics(campaign.statistics)) {
        console.log(`Utilisation des statistiques existantes pour ${campaign.name || campaignUid}`);
        
        // Mise à jour du cache avec les statistiques existantes
        await updateCachedStats(campaignUid, account.id, campaign.statistics);
        return campaign.statistics;
      }
      
      return null;
    }
    
    // Convertir les statistiques API en format AcelleCampaignStatistics
    const mappedStats: AcelleCampaignStatistics = mapApiStatsToModel(apiStats, campaignUid);
    
    // Mise à jour du cache uniquement si les statistiques sont valides
    if (hasValidStatistics(mappedStats)) {
      console.log(`Mise à jour du cache pour ${campaign.name || campaignUid}`);
      await updateCachedStats(campaignUid, account.id, mappedStats);
    }
    
    return mappedStats;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaign.name || campaignUid}:`, error);
    
    // En cas d'erreur, essayer d'utiliser les statistiques existantes ou celles en cache même si expirées
    if (campaign.statistics && hasValidStatistics(campaign.statistics)) {
      return campaign.statistics;
    }
    
    const { statistics } = await getCachedStats(campaignUid, account.id);
    if (statistics && hasValidStatistics(statistics)) {
      return statistics;
    }
    
    return null;
  }
};
