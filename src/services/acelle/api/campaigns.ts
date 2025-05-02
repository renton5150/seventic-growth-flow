import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from '@/types/acelle.types';
import { buildProxyUrl, callAcelleApi } from '../acelle-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateMockCampaigns } from './mockData';

/**
 * Vérifie si l'API est accessible pour un compte spécifique
 */
export async function checkApiAccess(account: AcelleAccount, accessToken?: string): Promise<boolean> {
  try {
    console.log(`Vérification de l'accès à l'API pour le compte ${account.name}`);
    
    // Construire l'URL pour la requête API test (utilisez customers qui est un endpoint léger)
    const params = {
      api_token: account.apiToken,
      _t: Date.now().toString() // Paramètre anti-cache
    };
    
    try {
      // Utiliser la nouvelle fonction callAcelleApi
      await callAcelleApi('customers', params, accessToken);
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'accès à l'API:", error);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'accès à l'API:", error);
    return false;
  }
}

/**
 * Récupère les campagnes email depuis l'API Acelle
 */
export async function getAcelleCampaigns(
  account: AcelleAccount,
  page: number = 1,
  perPage: number = 25,
  accessToken?: string
): Promise<AcelleCampaign[]> {
  console.log(`Fetching campaigns for account ${account.name}, page ${page}, limit ${perPage}`);
  
  try {
    // Construire les paramètres pour la requête API
    const params = {
      api_token: account.apiToken,
      page: page.toString(),
      per_page: perPage.toString(),
      include_stats: 'true', // S'assurer que les statistiques sont incluses
      _t: Date.now().toString() // Paramètre anti-cache
    };
    
    console.log(`Attempting to fetch campaigns with authentication token: ${accessToken ? 'provided' : 'missing'}`);
    
    try {
      const data = await callAcelleApi('campaigns', params, accessToken);
      console.log("API response received, analyzing data structure");
      
      // S'adapter aux différentes structures de réponse possibles
      let campaignsData = [];
      
      if (Array.isArray(data)) {
        // Si la réponse est directement un tableau
        campaignsData = data;
        console.log(`Received array response with ${campaignsData.length} campaigns`);
      } else if (data.data && Array.isArray(data.data)) {
        // Si la réponse est un objet avec une propriété 'data' qui est un tableau
        campaignsData = data.data;
        console.log(`Received nested data response with ${campaignsData.length} campaigns`);
      } else if (typeof data === 'object') {
        // Si c'est un objet mais pas la structure attendue, essayer de l'extraire
        console.log("Received object response, looking for array data");
        
        const possibleArrays = Object.values(data).filter(value => Array.isArray(value));
        if (possibleArrays.length > 0) {
          // Prendre le premier tableau trouvé
          campaignsData = possibleArrays[0] as any[];
          console.log(`Extracted array from object with ${campaignsData.length} items`);
        } else {
          // Dernière tentative: si c'est un objet avec des campagnes numérotées
          const extractedCampaigns = Object.entries(data)
            .filter(([key, value]) => typeof value === 'object' && value !== null)
            .map(([_, value]) => value);
            
          if (extractedCampaigns.length > 0) {
            campaignsData = extractedCampaigns;
            console.log(`Extracted ${campaignsData.length} campaigns from object properties`);
          } else {
            console.error("Could not find campaigns data in response:", data);
            throw new Error("Could not find campaigns data in response");
          }
        }
      }
      
      if (campaignsData.length === 0) {
        console.log("No campaigns found in response");
        return [];
      }
      
      console.log(`Successfully processed ${campaignsData.length} campaigns`);
      
      // Log a sample campaign for debugging
      if (campaignsData.length > 0) {
        console.log("Sample campaign data:", JSON.stringify(campaignsData[0]).substring(0, 500));
      }
      
      // Mise à jour du cache pour chaque campagne
      for (const campaignItem of campaignsData) {
        try {
          // Extraire les données de statistiques pour le cache
          const uid = campaignItem.uid || campaignItem.id || campaignItem.campaign_uid || '';
          const statistics = campaignItem.statistics || {};
          
          // Créer une structure de données delivery_info cohérente
          const deliveryInfo = {
            total: parseInt(statistics.subscriber_count) || 0,
            delivered: parseInt(statistics.delivered_count) || 0,
            delivery_rate: parseFloat(statistics.delivered_rate) || 0,
            opened: parseInt(statistics.open_count) || 0,
            unique_open_rate: parseFloat(statistics.uniq_open_rate) || 0,
            clicked: parseInt(statistics.click_count) || 0,
            click_rate: parseFloat(statistics.click_rate) || 0,
            bounced: {
              soft: parseInt(statistics.soft_bounce_count) || 0,
              hard: parseInt(statistics.hard_bounce_count) || 0,
              total: parseInt(statistics.bounce_count) || 0
            },
            unsubscribed: parseInt(statistics.unsubscribe_count) || 0,
            complained: parseInt(statistics.abuse_complaint_count) || 0
          };
          
          // Mettre à jour le cache dans Supabase
          await supabase.from('email_campaigns_cache').upsert({
            campaign_uid: uid,
            account_id: account.id,
            name: campaignItem.name || 'Sans nom',
            subject: campaignItem.subject || 'Sans sujet',
            status: campaignItem.status || 'unknown',
            created_at: campaignItem.created_at || new Date().toISOString(),
            updated_at: campaignItem.updated_at || new Date().toISOString(),
            delivery_date: campaignItem.delivery_at || campaignItem.run_at || campaignItem.delivery_date || null,
            run_at: campaignItem.run_at || null,
            last_error: campaignItem.last_error || null,
            delivery_info: deliveryInfo,
            cache_updated_at: new Date().toISOString()
          }, {
            onConflict: 'campaign_uid'
          });
          
          // Log successful cache update
          console.log(`Successfully cached campaign ${uid} with statistics`);
        } catch (cacheError) {
          console.error(`Erreur lors de la mise à jour du cache pour la campagne ${campaignItem.uid || 'inconnue'}:`, cacheError);
        }
      }

      // Mettre à jour la date de dernière synchronisation pour le compte
      await supabase
        .from('acelle_accounts')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_error: null
        })
        .eq('id', account.id);
      
      // Transformer les données pour correspondre à notre format
      return campaignsData.map((item: any) => {
        // Vérifier si les propriétés existent avant d'y accéder
        const uid = item.uid || item.id || item.campaign_uid || '';
        const statistics = item.statistics || {};
        
        // Créer une campagne bien formatée
        const campaign: AcelleCampaign = {
          uid: uid,
          campaign_uid: uid,
          name: item.name || 'Sans nom',
          subject: item.subject || 'Sans sujet',
          status: item.status || 'unknown',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          delivery_date: item.delivery_at || item.run_at || item.delivery_date || null,
          run_at: item.run_at || null,
          last_error: item.last_error || null,
          statistics: statistics,
          delivery_info: {
            total: parseInt(statistics.subscriber_count) || 0,
            delivered: parseInt(statistics.delivered_count) || 0,
            delivery_rate: parseFloat(statistics.delivered_rate) || 0,
            opened: parseInt(statistics.open_count) || 0,
            unique_open_rate: parseFloat(statistics.uniq_open_rate) || 0,
            clicked: parseInt(statistics.click_count) || 0,
            click_rate: parseFloat(statistics.click_rate) || 0,
            bounced: {
              soft: parseInt(statistics.soft_bounce_count) || 0,
              hard: parseInt(statistics.hard_bounce_count) || 0,
              total: parseInt(statistics.bounce_count) || 0
            },
            unsubscribed: parseInt(statistics.unsubscribe_count) || 0,
            complained: parseInt(statistics.abuse_complaint_count) || 0
          }
        };
        
        return campaign;
      });
    } catch (error) {
      console.error("Erreur lors de la requête API:", error);
      
      // Essayer de récupérer depuis le cache en cas d'échec de l'API
      console.log(`Tentative de récupération des campagnes depuis le cache pour le compte ${account.id}`);
      const { data: cachedCampaigns, error: cacheError } = await supabase
        .from('email_campaigns_cache')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
        .limit(perPage)
        .range((page - 1) * perPage, page * perPage - 1);
      
      if (cacheError) {
        console.error("Erreur lors de la récupération des campagnes du cache:", cacheError);
        throw error; // Relancer l'erreur originale si le cache échoue aussi
      }
      
      if (cachedCampaigns && cachedCampaigns.length > 0) {
        console.log(`Récupéré ${cachedCampaigns.length} campagnes depuis le cache`);
        toast.info("Affichage des données en cache - la synchronisation a échoué", { duration: 5000 });
        
        // Utiliser la fonction extractCampaignsFromCache pour convertir en format AcelleCampaign
        return extractCampaignsFromCache(cachedCampaigns);
      }
      
      // Si aucune donnée dans le cache, relancer l'erreur
      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    throw error;
  }
}

/**
 * Récupère les détails d'une campagne spécifique
 */
export async function fetchCampaignDetails(
  account: AcelleAccount, 
  campaignUid: string,
  accessToken?: string
): Promise<AcelleCampaignDetail> {
  console.log(`Fetching details for campaign ${campaignUid} from account ${account.name}`);
  
  try {
    // Si l'UID commence par "mock-", c'est une campagne de démonstration
    if (campaignUid.startsWith('mock-')) {
      console.log("Mock campaign detected, returning demo data");
      throw new Error("Demo campaign - using mock data");
    }
    
    // Tenter de récupérer depuis l'API réelle
    const params = {
      api_token: account.apiToken,
      _t: Date.now().toString() // Paramètre anti-cache
    };
    
    try {
      console.log(`Fetching campaign details for ${campaignUid} with authentication token: ${accessToken ? 'provided' : 'missing'}`);
      const data = await callAcelleApi(`campaigns/${campaignUid}`, params, accessToken);
      console.log(`Campaign details retrieved successfully:`, data);
      return data as AcelleCampaignDetail;
    } catch (error) {
      console.error(`Error fetching details for campaign ${campaignUid}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching details for campaign ${campaignUid}:`, error);
    
    // Générer une campagne de démonstration comme fallback en cas d'erreur
    const mockNumber = parseInt(campaignUid.replace('mock-', ''), 10) || 1;
      
    // Créer une date d'envoi il y a x jours selon le numéro mock
    const runAt = new Date();
    runAt.setDate(runAt.getDate() - mockNumber);
    
    // Date de création quelques jours avant l'envoi
    const createdAt = new Date(runAt);
    createdAt.setDate(createdAt.getDate() - 3);
    
    // Créer des statistiques fictives avec des valeurs réalistes
    const totalSubscribers = 100 * mockNumber;
    const openRate = Math.min(80, 40 + mockNumber * 5) / 100;  
    const clickRate = Math.min(60, 20 + mockNumber * 5) / 100;
    const bounceRate = Math.max(1, 10 - mockNumber) / 100;
    const unsubscribeRate = Math.max(0.5, 5 - mockNumber) / 100;
    
    // Calculer les nombres absolus
    const deliveredCount = Math.floor(totalSubscribers * (1 - bounceRate));
    const openCount = Math.floor(deliveredCount * openRate);
    const clickCount = Math.floor(deliveredCount * clickRate);
    const unsubscribeCount = Math.floor(deliveredCount * unsubscribeRate);
    const bounceCount = totalSubscribers - deliveredCount;
    
    toast.error("Impossible de récupérer les détails de la campagne depuis l'API. Affichage de données de démonstration.");
    
    return {
      uid: campaignUid,
      campaign_uid: campaignUid,
      name: `Campagne de démonstration ${mockNumber}`,
      subject: `Sujet de la campagne ${mockNumber}`,
      status: mockNumber % 3 === 0 ? 'sending' : mockNumber % 4 === 0 ? 'queued' : 'sent',
      created_at: createdAt.toISOString(),
      updated_at: runAt.toISOString(),
      delivery_date: runAt.toISOString(),
      run_at: runAt.toISOString(),
      html: `<h1>Contenu de démonstration pour la campagne ${mockNumber}</h1>
             <p>Ceci est un exemple de contenu HTML pour une campagne email.</p>
             <p>Ces données sont générées automatiquement pour la démonstration.</p>`,
      plain: `Contenu de démonstration pour la campagne ${mockNumber}
              Ceci est un exemple de contenu texte pour une campagne email.
              Ces données sont générées automatiquement pour la démonstration.`,
      statistics: {
        subscriber_count: totalSubscribers,
        delivered_count: deliveredCount,
        delivered_rate: (1 - bounceRate) * 100,
        open_count: openCount,
        uniq_open_rate: openRate * 100,
        click_count: clickCount,
        click_rate: clickRate * 100,
        bounce_count: bounceCount,
        unsubscribe_count: unsubscribeCount
      },
      delivery_info: {
        total: totalSubscribers,
        delivered: deliveredCount,
        delivery_rate: (1 - bounceRate) * 100,
        opened: openCount,
        unique_open_rate: openRate * 100,
        clicked: clickCount,
        click_rate: clickRate * 100,
        bounced: {
          soft: Math.floor(bounceCount * 0.7),
          hard: Math.floor(bounceCount * 0.3),
          total: bounceCount
        },
        unsubscribed: unsubscribeCount
      },
      tracking: {
        open_tracking: true,
        click_tracking: true
      }
    };
  }
}

/**
 * Calcule et agrège les statistiques de livraison pour un ensemble de campagnes
 */
export function calculateDeliveryStats(campaigns: AcelleCampaign[]) {
  let totalEmails = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Debug log pour voir les données des campagnes
  console.log("calculateDeliveryStats - processing campaigns:", campaigns.length);
  
  campaigns.forEach(campaign => {
    // Prioritize delivery_info as it's our primary structure
    if (campaign.delivery_info) {
      console.log(`Campaign ${campaign.name} delivery info:`, campaign.delivery_info);
      
      // Use existing delivery_info structure
      totalEmails += campaign.delivery_info.total || 0;
      totalDelivered += campaign.delivery_info.delivered || 0;
      totalOpened += campaign.delivery_info.opened || 0;
      totalClicked += campaign.delivery_info.clicked || 0;
      
      // Handle bounces from the bounced subobject
      const softBounce = campaign.delivery_info.bounced?.soft || 0;
      const hardBounce = campaign.delivery_info.bounced?.hard || 0;
      totalBounced += softBounce + hardBounce;
    } 
    // Fall back to statistics if available
    else if (campaign.statistics) {
      console.log(`Campaign ${campaign.name} statistics:`, campaign.statistics);
      
      totalEmails += campaign.statistics.subscriber_count || 0;
      totalDelivered += campaign.statistics.delivered_count || 0;
      totalOpened += campaign.statistics.open_count || 0;
      totalClicked += campaign.statistics.click_count || 0;
      totalBounced += campaign.statistics.bounce_count || 0;
    }
  });
  
  console.log("Final calculated stats:", {
    totalSent: totalEmails, 
    totalDelivered, 
    totalOpened, 
    totalClicked, 
    totalBounced
  });
  
  return {
    totalEmails,
    totalDelivered,
    totalOpened,
    totalClicked,
    totalBounced,
    deliveryRate: totalEmails > 0 ? (totalDelivered / totalEmails) * 100 : 0,
    openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
    clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0
  };
}

/**
 * Extrait les campagnes du cache
 */
export function extractCampaignsFromCache(data: any[]): AcelleCampaign[] {
  if (!Array.isArray(data)) {
    console.error("Le cache n'est pas un tableau:", data);
    return [];
  }
  
  return data.map(item => {
    // Convertir les dates en format de chaîne pour la cohérence
    const campaign: AcelleCampaign = {
      uid: item.campaign_uid,
      campaign_uid: item.campaign_uid,
      name: item.name || "Sans nom",
      subject: item.subject || "Sans sujet",
      status: item.status || "unknown",
      created_at: item.created_at,
      updated_at: item.updated_at,
      delivery_date: item.delivery_date,
      run_at: item.run_at,
      last_error: item.last_error,
      delivery_info: item.delivery_info || {}
    };
    
    // S'assurer que les statistiques sont disponibles
    if (item.delivery_info) {
      campaign.statistics = {
        subscriber_count: item.delivery_info.total || 0,
        delivered_count: item.delivery_info.delivered || 0,
        delivered_rate: item.delivery_info.delivery_rate || 0,
        open_count: item.delivery_info.opened || 0,
        uniq_open_rate: item.delivery_info.unique_open_rate || 0,
        click_count: item.delivery_info.clicked || 0,
        click_rate: item.delivery_info.click_rate || 0,
        bounce_count: item.delivery_info.bounced?.total || 0,
        soft_bounce_count: item.delivery_info.bounced?.soft || 0,
        hard_bounce_count: item.delivery_info.bounced?.hard || 0,
        unsubscribe_count: item.delivery_info.unsubscribed || 0,
        abuse_complaint_count: item.delivery_info.complained || 0
      };
    } else {
      campaign.statistics = {
        subscriber_count: 0,
        delivered_count: 0,
        delivered_rate: 0,
        open_count: 0,
        uniq_open_rate: 0,
        click_count: 0,
        click_rate: 0,
        bounce_count: 0,
        soft_bounce_count: 0,
        hard_bounce_count: 0,
        unsubscribe_count: 0,
        abuse_complaint_count: 0
      };
    }
    
    return campaign;
  });
}

/**
 * Force la synchronisation des campagnes pour un compte donné
 */
export async function forceSyncCampaigns(account: AcelleAccount, accessToken?: string): Promise<{
  success: boolean;
  message: string;
  syncedCount?: number;
}> {
  console.log(`Forçage de la synchronisation des campagnes pour le compte ${account.name}`);
  
  if (!accessToken) {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token;
    console.log(`Token d'authentification ${accessToken ? 'récupéré' : 'non disponible'}`);
  }
  
  try {
    // Approche directe: récupérer toutes les campagnes et les mettre en cache
    console.log("Synchronisation directe: récupération de toutes les campagnes");
    
    let allCampaigns: AcelleCampaign[] = [];
    let page = 1;
    const perPage = 50; // Récupérer plus de campagnes par page
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Récupération des campagnes page ${page}, ${perPage} par page`);
      try {
        const campaigns = await getAcelleCampaigns(account, page, perPage, accessToken);
        
        if (campaigns && campaigns.length > 0) {
          console.log(`Récupéré ${campaigns.length} campagnes pour la page ${page}`);
          allCampaigns = [...allCampaigns, ...campaigns];
          page++;
          
          // Si nous récupérons moins que le nombre demandé, c'est qu'il n'y a plus de pages
          hasMore = campaigns.length === perPage;
        } else {
          console.log("Plus de campagnes à récupérer");
          hasMore = false;
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de la page ${page}:`, error);
        // Si première page, échec total; sinon, continuer avec ce qu'on a
        if (page === 1) {
          throw error;
        } else {
          hasMore = false;
        }
      }
    }
    
    // Mise à jour du timestamp de dernière synchronisation dans la base
    await supabase
      .from('acelle_accounts')
      .update({ 
        last_sync_date: new Date().toISOString(),
        last_sync_error: null
      })
      .eq('id', account.id);
      
    console.log(`Synchronisation terminée avec ${allCampaigns.length} campagnes récupérées`);
      
    return {
      success: true,
      message: `Synchronisation réussie, ${allCampaigns.length} campagnes mises à jour`,
      syncedCount: allCampaigns.length
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Enregistrer l'erreur dans la base de données
    await supabase
      .from('acelle_accounts')
      .update({ 
        last_sync_error: errorMessage,
        last_sync_date: new Date().toISOString()
      })
      .eq('id', account.id);
      
    // Essayer d'appeler la fonction edge comme fallback
    try {
      console.log("Tentative de synchronisation via l'edge function");
      const response = await supabase.functions.invoke("sync-email-campaigns", {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        body: {
          forceSync: true,
          accounts: [account.id],
          debug: true
        }
      });
      
      if (response.error) {
        console.error("Erreur lors de la synchronisation via l'edge function:", response.error);
        return {
          success: false,
          message: `Échec de la synchronisation: ${errorMessage}. Tentative via edge function également échouée.`
        };
      }
      
      console.log("Réponse de l'edge function:", response.data);
      
      const syncResults = response.data?.results || [];
      const accountResult = syncResults.find((r: any) => r.accountId === account.id);
      
      if (accountResult?.success) {
        return {
          success: true,
          message: `Synchronisation réussie via edge function, ${accountResult.count || 'plusieurs'} campagnes mises à jour`,
          syncedCount: accountResult.count
        };
      } else {
        return {
          success: false,
          message: `Échec de la synchronisation: ${accountResult?.error || errorMessage}`
        };
      }
    } catch (edgeFunctionError) {
      console.error("Erreur lors de l'appel à l'edge function:", edgeFunctionError);
      return {
        success: false,
        message: `Échec de la synchronisation: ${errorMessage}. Edge function inaccessible.`
      };
    }
  }
}

/**
 * Récupère l'état du cache pour un compte
 */
export async function getCacheStatus(accountId: string): Promise<{
  campaignsCount: number;
  lastSyncDate: string | null;
  lastSyncError: string | null;
}> {
  try {
    // Récupérer les informations de compte
    const { data: account, error: accountError } = await supabase
      .from('acelle_accounts')
      .select('last_sync_date, last_sync_error')
      .eq('id', accountId)
      .single();
      
    if (accountError) {
      console.error("Erreur lors de la récupération des informations du compte:", accountError);
      return {
        campaignsCount: 0,
        lastSyncDate: null,
        lastSyncError: "Erreur lors de la récupération des informations du compte"
      };
    }
    
    // Compter les campagnes en cache
    const { count, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
      
    if (countError) {
      console.error("Erreur lors du comptage des campagnes en cache:", countError);
      return {
        campaignsCount: 0,
        lastSyncDate: account.last_sync_date,
        lastSyncError: account.last_sync_error || "Erreur lors du comptage des campagnes en cache"
      };
    }
    
    return {
      campaignsCount: count || 0,
      lastSyncDate: account.last_sync_date,
      lastSyncError: account.last_sync_error
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'état du cache:", error);
    return {
      campaignsCount: 0,
      lastSyncDate: null,
      lastSyncError: "Exception lors de la récupération de l'état du cache"
    };
  }
}
