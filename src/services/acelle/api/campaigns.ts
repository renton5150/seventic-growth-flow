import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail, CachedCampaign } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildProxyUrl } from "@/services/acelle/acelle-service";

/**
 * Fonction améliorée pour extraire les campagnes depuis le cache avec compatibilité typée
 */
const extractCampaignsFromCache = (cachedCampaigns: CachedCampaign[]): AcelleCampaign[] => {
  if (!cachedCampaigns || cachedCampaigns.length === 0) {
    return [];
  }
  
  console.log(`Converting ${cachedCampaigns.length} cached campaigns to AcelleCampaign format`);
  
  return cachedCampaigns.map(campaign => {
    // Convertir intelligemment delivery_info
    let deliveryInfo = {
      total: 0,
      delivery_rate: 0,
      unique_open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
      unsubscribe_rate: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: {
        soft: 0,
        hard: 0,
        total: 0
      },
      unsubscribed: 0,
      complained: 0
    };

    if (campaign.delivery_info) {
      // Traitement similaire à useCampaignFetch.ts
      if (typeof campaign.delivery_info === 'string') {
        try {
          const parsedInfo = JSON.parse(campaign.delivery_info);
          if (parsedInfo && typeof parsedInfo === 'object') {
            deliveryInfo = { ...deliveryInfo, ...parsedInfo };
            if (parsedInfo.bounced && typeof parsedInfo.bounced === 'object') {
              deliveryInfo.bounced = {
                ...deliveryInfo.bounced,
                ...parsedInfo.bounced
              };
            }
          }
        } catch (e) {
          console.warn("Error parsing delivery_info JSON:", e);
        }
      } else if (typeof campaign.delivery_info === 'object') {
        deliveryInfo = {
          ...deliveryInfo,
          ...campaign.delivery_info
        };
        
        if (campaign.delivery_info.bounced && typeof campaign.delivery_info.bounced === 'object') {
          deliveryInfo.bounced = {
            ...deliveryInfo.bounced,
            ...campaign.delivery_info.bounced
          };
        }
      }
    }

    // Créer les statistiques à partir des données de delivery_info
    const statistics = {
      subscriber_count: deliveryInfo.total || 0,
      delivered_count: deliveryInfo.delivered || 0,
      delivered_rate: deliveryInfo.delivery_rate || 0,
      open_count: deliveryInfo.opened || 0,
      uniq_open_rate: deliveryInfo.unique_open_rate || 0,
      click_count: deliveryInfo.clicked || 0,
      click_rate: deliveryInfo.click_rate || 0,
      bounce_count: deliveryInfo.bounced?.total || 0,
      soft_bounce_count: deliveryInfo.bounced?.soft || 0,
      hard_bounce_count: deliveryInfo.bounced?.hard || 0,
      unsubscribe_count: deliveryInfo.unsubscribed || 0,
      abuse_complaint_count: deliveryInfo.complained || 0
    };

    // Créer un objet AcelleCampaign complet et correctement typé
    return {
      uid: campaign.campaign_uid,
      campaign_uid: campaign.campaign_uid,
      name: campaign.name || 'Sans nom',
      subject: campaign.subject || 'Sans sujet',
      status: campaign.status || 'unknown',
      created_at: campaign.created_at || new Date().toISOString(),
      updated_at: campaign.updated_at || new Date().toISOString(),
      delivery_date: campaign.delivery_date || '',
      run_at: campaign.run_at || '',
      last_error: campaign.last_error || '',
      delivery_info: deliveryInfo,
      statistics: statistics,
      meta: {},
      track: {},
      report: {}
    } as AcelleCampaign;
  });
};

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
          "X-Auth-Method": "token"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Vérification d'accès API échouée: ${response.status}`);
        return false;
      }

      const result = await response.json();
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
          "X-Acelle-Endpoint": apiEndpoint,
          "X-Auth-Method": "token"
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
      
      // Récupérer des statistiques additionnelles si nécessaire
      if (!campaignDetails.statistics || Object.keys(campaignDetails.statistics).length === 0) {
        try {
          // Tenter d'utiliser un endpoint spécifique pour les statistiques
          const statsProxyUrl = buildProxyUrl(`campaigns/${campaignUid}/overview`, {
            api_token: account.apiToken,
            cache_bust: Date.now().toString()
          });
          
          console.log(`Récupération des statistiques complémentaires avec l'URL: ${statsProxyUrl}`);
          
          const statsResponse = await fetch(statsProxyUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${accessToken}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-Acelle-Endpoint": apiEndpoint,
              "X-Auth-Method": "token"
            }
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log(`Statistiques complémentaires récupérées:`, statsData);
            
            // Fusionner les données statistiques dans l'objet principal
            campaignDetails.statistics = statsData;
          }
        } catch (statsError) {
          console.warn(`Erreur lors de la récupération des statistiques complémentaires:`, statsError);
        }
      }
      
      // S'assurer que les structures requises existent pour éviter les erreurs JS
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
 * Fonction optimisée pour récupérer les campagnes sans échecs en cas d'API inaccessible
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
      
      // Essayer de récupérer des données du cache si disponible
      try {
        const { data: cachedCampaigns } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          console.log(`Récupéré ${cachedCampaigns.length} campagnes depuis le cache pour le compte ${account.name}`);
          
          // Utiliser notre fonction de conversion
          return extractCampaignsFromCache(cachedCampaigns);
        }
      } catch (cacheError) {
        console.error(`Erreur lors de la récupération des campagnes depuis le cache:`, cacheError);
      }
      
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
          "X-Acelle-Endpoint": apiEndpoint,
          "X-Auth-Method": "token"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Échec de récupération des campagnes: ${response.status}`);
        
        if (response.status === 401 || response.status === 403) {
          toast.error("Erreur d'authentification avec l'API Acelle");
        } else if (response.status === 500) {
          toast.error("Erreur interne du serveur Acelle");
        } else {
          toast.error(`Erreur lors de la récupération des campagnes: ${response.status}`);
        }
        
        // Essayer de récupérer des données du cache si disponible
        try {
          const { data: cachedCampaigns } = await supabase
            .from('email_campaigns_cache')
            .select('*')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false })
            .limit(limit);
            
          if (cachedCampaigns && cachedCampaigns.length > 0) {
            console.log(`Récupéré ${cachedCampaigns.length} campagnes depuis le cache pour le compte ${account.name}`);
            
            // Utiliser notre fonction de conversion
            return extractCampaignsFromCache(cachedCampaigns);
          }
        } catch (cacheError) {
          console.error(`Erreur lors de la récupération des campagnes depuis le cache:`, cacheError);
        }
        
        return [];
      }
      
      // Utiliser Response.clone() avant de consommer le corps
      const responseClone = response.clone();
      
      try {
        const campaigns = await response.json();
        console.log(`Récupéré ${campaigns.length} campagnes pour le compte ${account.name}`);
        
        // Préparation des campagnes enrichies
        const enrichedCampaigns = campaigns.map(campaign => {
          // Assurer la présence des structures de base
          return {
            ...campaign,
            meta: campaign.meta || {},
            statistics: campaign.statistics || {},
            delivery_info: campaign.delivery_info || {
              bounced: { soft: 0, hard: 0, total: 0 }
            },
            // S'assurer que campaign_uid existe aussi comme uid si nécessaire
            uid: campaign.uid || campaign.campaign_uid,
            campaign_uid: campaign.campaign_uid || campaign.uid,
            track: {}, // Initialiser track comme objet vide
            report: {} // Initialiser report comme objet vide
          } as AcelleCampaign;
        });
        
        // Mettre à jour la date de dernière synchronisation
        updateLastSyncDate(account.id);
        
        return enrichedCampaigns;
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
      
      // Essayer de récupérer des données du cache si disponible
      try {
        const { data: cachedCampaigns } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          console.log(`Récupéré ${cachedCampaigns.length} campagnes depuis le cache pour le compte ${account.name}`);
          
          // Utiliser notre fonction de conversion
          return extractCampaignsFromCache(cachedCampaigns);
        }
      } catch (cacheError) {
        console.error(`Erreur lors de la récupération des campagnes depuis le cache:`, cacheError);
      }
      
      return [];
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des campagnes pour le compte ${account.name}:`, error);
    toast.error(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    return [];
  }
};

/**
 * Fonction pour calculer des statistiques globales à partir des campagnes
 */
export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Log pour le débogage
  console.log(`Calcul des statistiques pour ${campaigns.length} campagnes`);
  
  campaigns.forEach(campaign => {
    // Fonction sécurisée pour extraire des valeurs
    const getStatValue = (key: string): number => {
      try {
        // 1. Essayer d'abord dans statistics
        if (campaign.statistics && typeof campaign.statistics === 'object') {
          if (key in campaign.statistics && campaign.statistics[key] !== undefined) {
            const value = Number(campaign.statistics[key]);
            if (!isNaN(value)) return value;
          }
        }
        
        // 2. Essayer ensuite dans delivery_info
        if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
          if (key in campaign.delivery_info && campaign.delivery_info[key] !== undefined) {
            const value = Number(campaign.delivery_info[key]);
            if (!isNaN(value)) return value;
          }
          
          // Cas spécial pour bounced qui est un objet
          if (key === 'bounce_count' && campaign.delivery_info.bounced) {
            const value = Number(campaign.delivery_info.bounced.total);
            if (!isNaN(value)) return value;
          }
        }
        
        // 3. Essayer dans la racine de campaign
        if (key in campaign && campaign[key] !== undefined) {
          const value = Number(campaign[key]);
          if (!isNaN(value)) return value;
        }
        
        // 4. Essayer dans meta
        if (campaign.meta && typeof campaign.meta === 'object') {
          // Directement dans meta
          if (key in campaign.meta && campaign.meta[key] !== undefined) {
            const value = Number(campaign.meta[key]);
            if (!isNaN(value)) return value;
          }
          
          // Dans meta.statistics
          if (campaign.meta.statistics && key in campaign.meta.statistics) {
            const value = Number(campaign.meta.statistics[key]);
            if (!isNaN(value)) return value;
          }
          
          // Dans meta.delivery_info
          if (campaign.meta.delivery_info && key in campaign.meta.delivery_info) {
            const value = Number(campaign.meta.delivery_info[key]);
            if (!isNaN(value)) return value;
          }
        }
        
        // Suppression des vérifications track et report puisqu'on a mis à jour le type

        // Essayer les mappings alternatifs de clés
        const keyMappings: Record<string, string[]> = {
          'subscriber_count': ['total', 'recipient_count', 'subscribers_count', 'total_subscribers'],
          'delivered_count': ['delivered'],
          'open_count': ['opened'],
          'bounce_count': ['bounced.total', 'total_bounces'],
          'click_count': ['clicked']
        };
        
        if (key in keyMappings) {
          for (const altKey of keyMappings[key]) {
            // Gestion des clés imbriquées comme 'bounced.total'
            if (altKey.includes('.')) {
              const [parent, child] = altKey.split('.');
              if (campaign.delivery_info && campaign.delivery_info[parent]) {
                const value = Number(campaign.delivery_info[parent][child]);
                if (!isNaN(value)) return value;
              }
              continue;
            }
            
            // Pour les clés simples
            if (campaign.statistics && altKey in campaign.statistics) {
              const value = Number(campaign.statistics[altKey]);
              if (!isNaN(value)) return value;
            }
            
            if (campaign.delivery_info && altKey in campaign.delivery_info) {
              const value = Number(campaign.delivery_info[altKey]);
              if (!isNaN(value)) return value;
            }
            
            if (altKey in campaign) {
              const value = Number(campaign[altKey]);
              if (!isNaN(value)) return value;
            }
          }
        }
        
        return 0;
      } catch (error) {
        console.warn(`Erreur lors de l'extraction de la statistique '${key}':`, error);
        return 0;
      }
    };
    
    // Extraire les valeurs statistiques
    const sent = getStatValue('subscriber_count');
    const delivered = getStatValue('delivered_count');
    const opened = getStatValue('open_count');
    const clicked = getStatValue('click_count');
    const bounced = getStatValue('bounce_count');
    
    totalSent += sent;
    totalDelivered += delivered;
    totalOpened += opened;
    totalClicked += clicked;
    totalBounced += bounced;
  });
  
  return [
    { name: "Envoyés", value: totalSent },
    { name: "Livrés", value: totalDelivered },
    { name: "Ouverts", value: totalOpened },
    { name: "Cliqués", value: totalClicked },
    { name: "Bounces", value: totalBounced }
  ];
};

// Exporter la fonction pour qu'elle soit accessible depuis acelleService
export { extractCampaignsFromCache };
