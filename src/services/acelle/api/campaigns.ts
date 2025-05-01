
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildProxyUrl, ACELLE_PROXY_CONFIG } from "@/services/acelle/acelle-service";

/**
 * Fonction améliorée pour vérifier l'accessibilité de l'API avec diagnostics complets
 */
export const checkApiAccess = async (account: AcelleAccount): Promise<boolean> => {
  try {
    console.log(`Test d'accessibilité API pour le compte: ${account.name}`);
    
    // Récupérer la session d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de jeton d'accès disponible");
      return false;
    }
    
    // Nettoyer l'URL de l'API
    const apiEndpoint = account.apiEndpoint?.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    if (!apiEndpoint) {
      console.error(`Point d'accès API invalide pour le compte: ${account.name}`);
      return false;
    }

    // Utiliser la fonction buildProxyUrl pour une construction d'URL cohérente
    const proxyUrl = buildProxyUrl('me', { 
      api_token: account.apiToken,
      cache_bust: Date.now().toString() // Paramètre anti-cache
    });
    
    console.log(`Vérification d'accès API avec l'URL: ${proxyUrl}`);
    
    // Utiliser AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Acelle-Endpoint": apiEndpoint,
          "X-Auth-Method": "token",
          "X-Debug-Level": "verbose",
          "X-Wake-Request": "true"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Vérification d'accès API échouée: ${response.status}`);
        
        // Journal détaillé de la réponse pour débogage
        try {
          const errorText = await response.text();
          console.error("Détails de l'erreur d'accès API:", errorText);
        } catch (e) {
          console.error("Impossible de lire la réponse d'erreur");
        }
        
        return false;
      }

      const result = await response.json();
      console.log("Résultat de la vérification d'accès API:", result);
      
      return result && (result.status === 'active' || !!result.id);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Erreur lors de la vérification d'accessibilité (erreur fetch):", error);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification d'accessibilité (erreur générale):", error);
    return false;
  }
};

/**
 * Fonction améliorée pour récupérer les détails d'une campagne avec une meilleure gestion des erreurs
 */
export const fetchCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  try {
    // Nettoyer l'URL de l'API
    const apiEndpoint = account.apiEndpoint?.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    if (!apiEndpoint || !account.apiToken) {
      console.error(`Configuration API invalide pour le compte: ${account.name}`);
      return null;
    }
    
    // Récupérer la session d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de jeton d'authentification disponible pour la requête API");
      return null;
    }
    
    console.log(`Récupération des détails pour la campagne ${campaignUid} du compte ${account.name}`);
    
    // D'abord vérifier l'accessibilité de l'API
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API non accessible, impossible de récupérer les détails de la campagne");
      toast.error("L'API Acelle n'est pas accessible actuellement");
      return null;
    }
    
    // Utiliser le proxy CORS avec une URL correctement encodée et anti-cache
    const proxyUrl = buildProxyUrl(`campaigns/${campaignUid}`, { 
      api_token: account.apiToken,
      include_stats: "true", // Important pour récupérer les statistiques
      cache_bust: Date.now().toString() // Paramètre anti-cache
    });
    
    console.log(`Récupération des détails de campagne avec l'URL: ${proxyUrl}`);
    
    // Utiliser AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes de timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Debug-Level": "verbose",
          "X-Acelle-Endpoint": apiEndpoint,
          "X-Auth-Method": "token",
          "X-Wake-Request": "true"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || `Erreur ${response.status}`;
        } catch (e) {
          errorText = await response.text();
        }
        console.error(`Échec de récupération des détails pour la campagne ${campaignUid}: ${response.status}`, errorText);
        toast.error(`Erreur lors du chargement des détails: ${errorText}`);
        return null;
      }

      const campaignDetails = await response.json();
      console.log(`Détails récupérés avec succès pour la campagne ${campaignUid}`, campaignDetails);
      
      // S'assurer que les structures requises existent
      if (!campaignDetails.statistics) {
        campaignDetails.statistics = {};
      }
      
      if (!campaignDetails.delivery_info) {
        campaignDetails.delivery_info = {};
      }
      
      if (campaignDetails.delivery_info && !campaignDetails.delivery_info.bounced) {
        campaignDetails.delivery_info.bounced = { soft: 0, hard: 0, total: 0 };
      }
      
      return campaignDetails;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.error(`Timeout lors de la récupération des détails pour la campagne ${campaignUid}`);
        toast.error("Délai d'attente dépassé lors du chargement des détails");
      } else {
        console.error(`Erreur lors de la récupération des détails pour la campagne ${campaignUid}:`, error);
        toast.error(`Erreur lors du chargement des détails: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
      return null;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails pour la campagne ${campaignUid}:`, error);
    toast.error(`Erreur lors du chargement des détails: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    return null;
  }
};

/**
 * Fonction améliorée pour récupérer les campagnes avec une extraction de statistiques optimisée
 */
export const getAcelleCampaigns = async (account: AcelleAccount, page: number = 1, limit: number = 10): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Récupération des campagnes pour le compte ${account.name}, page ${page}, limite ${limit}`);
    
    // Vérifier si le point d'accès API est au bon format
    if (!account.apiEndpoint || !account.apiToken) {
      console.error(`Point d'accès API ou jeton invalide pour le compte: ${account.name}`);
      return [];
    }

    // Nettoyer l'URL de l'API
    const apiEndpoint = account.apiEndpoint.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
    
    console.log(`Requête vers le point d'accès: ${apiEndpoint}`);
    
    // Récupérer la session d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de jeton d'authentification disponible pour les requêtes API de campagnes");
      return [];
    }
    
    // D'abord vérifier l'accessibilité de l'API
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API non accessible, impossible de récupérer les campagnes");
      toast.error("L'API Acelle n'est pas accessible actuellement");
      return [];
    }
    
    // Utiliser un anti-cache pour éviter les résultats périmés
    const cacheBuster = Date.now().toString();
    
    // Utiliser notre fonction utilitaire buildProxyUrl avec les paramètres de campagne
    const proxyUrl = buildProxyUrl('campaigns', {
      api_token: account.apiToken,
      page: page.toString(),
      per_page: limit.toString(),
      include_stats: 'true', // Crucial pour obtenir les statistiques
      cache_bust: cacheBuster
    });
    
    console.log(`Récupération des campagnes avec l'URL: ${proxyUrl}`);
    
    // Utiliser AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes de timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Debug-Level": "verbose",
          "X-Acelle-Endpoint": apiEndpoint,
          "X-Auth-Method": "token",
          "X-Wake-Request": "true"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Échec de récupération des campagnes: ${response.status}`);
        
        // Journal détaillé de la réponse pour débogage
        try {
          const errorText = await response.text();
          console.error("Détails de l'erreur de récupération des campagnes:", errorText);
        } catch (e) {
          console.error("Impossible de lire la réponse d'erreur");
        }
        
        if (response.status === 401 || response.status === 403) {
          toast.error("Erreur d'authentification avec l'API Acelle");
        } else if (response.status === 500) {
          toast.error("Erreur interne du serveur Acelle");
        } else {
          toast.error(`Erreur lors de la récupération des campagnes: ${response.status}`);
        }
        
        return [];
      }
      
      // Utiliser Response.clone() avant de consommer le corps
      const responseClone = response.clone();
      
      try {
        const campaigns = await response.json();
        console.log(`Récupéré ${campaigns.length} campagnes pour le compte ${account.name}`);
        console.log("Exemple de données de campagne:", campaigns.length > 0 ? JSON.stringify(campaigns[0]).substring(0, 500) + '...' : "Pas de campagnes");
        
        // Traiter les campagnes pour s'assurer que tous les champs requis sont présents
        const processedCampaigns = campaigns.map((campaign: any) => {
          // Log détaillé pour analyser la structure des données
          console.debug(`Traitement de la campagne ${campaign.name} (${campaign.uid}):`, 
            JSON.stringify({
              has_stats: !!campaign.statistics,
              has_delivery: !!campaign.delivery_info,
              status: campaign.status,
              date: campaign.delivery_date || campaign.run_at
            })
          );
          
          // Initialiser les statistiques et delivery_info avec des valeurs par défaut
          if (!campaign.statistics) {
            campaign.statistics = {};
          }
          
          if (!campaign.delivery_info) {
            campaign.delivery_info = {};
          }
          
          if (!campaign.delivery_info.bounced) {
            campaign.delivery_info.bounced = { soft: 0, hard: 0, total: 0 };
          }

          return campaign;
        });
        
        // Mettre à jour la date de dernière synchronisation
        updateLastSyncDate(account.id);
        
        return processedCampaigns;
      } catch (parseError) {
        console.error("Erreur lors de l'analyse de la réponse JSON:", parseError);
        
        // Tenter de récupérer le texte brut de la réponse clonée
        try {
          const rawText = await responseClone.text();
          console.error("Réponse brute:", rawText.substring(0, 1000));
        } catch (textError) {
          console.error("Impossible de lire le texte brut de la réponse:", textError);
        }
        
        toast.error("Format de réponse invalide depuis l'API Acelle");
        return [];
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.error(`Timeout lors de la récupération des campagnes pour le compte ${account.name}`);
        toast.error("Délai d'attente dépassé lors de la récupération des campagnes");
      } else {
        console.error(`Erreur lors de la récupération des campagnes pour le compte ${account.name}:`, error);
        toast.error(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
      return [];
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des campagnes pour le compte ${account.name}:`, error);
    toast.error(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    return [];
  }
};

// Helper function amélioré pour récupérer des nombres avec plusieurs chemins de repli
const safeGetNumber = (paths: any[][], obj: any): number => {
  for (const path of paths) {
    try {
      let value = obj;
      for (const key of path) {
        if (value === undefined || value === null || typeof value !== 'object') {
          break;
        }
        value = value[key];
      }
      
      if (value !== undefined && value !== null) {
        const num = Number(value);
        if (!isNaN(num)) return num;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  return 0;
};

export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Log pour le débogage
  console.log(`Calcul des statistiques pour ${campaigns.length} campagnes`);
  
  campaigns.forEach(campaign => {
    // Log détaillé de la structure pour débogage
    console.debug(`Structure de la campagne pour statistiques:`, {
      name: campaign.name,
      has_statistics: !!campaign.statistics,
      has_delivery_info: !!campaign.delivery_info,
      statistics_keys: campaign.statistics ? Object.keys(campaign.statistics) : [],
      delivery_info_keys: campaign.delivery_info ? Object.keys(campaign.delivery_info) : []
    });
    
    // Get total sent with fallbacks
    const sent = safeGetNumber([
      ['delivery_info', 'total'], 
      ['statistics', 'subscriber_count'],
      ['meta', 'subscribers_count'],
      ['recipient_count']
    ], campaign);
    totalSent += sent;
    
    // Get delivered with fallbacks
    const delivered = safeGetNumber([
      ['delivery_info', 'delivered'], 
      ['statistics', 'delivered_count'],
      ['delivered_count']
    ], campaign);
    totalDelivered += delivered;
    
    // Get opened with fallbacks
    const opened = safeGetNumber([
      ['delivery_info', 'opened'], 
      ['statistics', 'open_count'],
      ['opened_count']
    ], campaign);
    totalOpened += opened;
    
    // Get clicked with fallbacks
    const clicked = safeGetNumber([
      ['delivery_info', 'clicked'], 
      ['statistics', 'click_count'],
      ['clicked_count']
    ], campaign);
    totalClicked += clicked;
    
    // Get bounces with fallbacks
    const bounced = safeGetNumber([
      ['delivery_info', 'bounced', 'total'], 
      ['statistics', 'bounce_count'],
      ['bounce_count']
    ], campaign);
    totalBounced += bounced;
    
    // Log des valeurs extraites pour chaque campagne
    console.debug(`Stats extraites pour campagne ${campaign.name}:`, {
      sent, delivered, opened, clicked, bounced
    });
  });
  
  // Log des totaux finaux
  console.log(`Statistiques calculées:`, {
    totalSent, totalDelivered, totalOpened, totalClicked, totalBounced
  });
  
  return [
    { name: "Envoyés", value: totalSent },
    { name: "Livrés", value: totalDelivered },
    { name: "Ouverts", value: totalOpened },
    { name: "Cliqués", value: totalClicked },
    { name: "Bounces", value: totalBounced }
  ];
};
