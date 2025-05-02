import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from '@/types/acelle.types';
import { buildProxyUrl } from '../acelle-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateMockCampaigns } from './mockData';

/**
 * Vérifie si l'API est accessible pour un compte spécifique
 */
export async function checkApiAccess(account: AcelleAccount): Promise<boolean> {
  try {
    console.log(`Vérification de l'accès à l'API pour le compte ${account.name}`);
    
    // Construire l'URL pour la requête API test (utilisez customers qui est un endpoint léger)
    const params = {
      api_token: account.apiToken,
      _t: Date.now().toString() // Paramètre anti-cache
    };
    
    const apiUrl = buildProxyUrl('customers', params);
    
    // Appel à l'API Acelle avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes timeout
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Si on obtient un code 200, l'API est accessible
      return response.status === 200;
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
  perPage: number = 25
): Promise<AcelleCampaign[]> {
  console.log(`Fetching campaigns for account ${account.name}, page ${page}, limit ${perPage}`);
  
  try {
    // Construire l'URL pour la requête API
    const params = {
      api_token: account.apiToken,
      page: page.toString(),
      per_page: perPage.toString(),
      _t: Date.now().toString() // Paramètre anti-cache
    };
    
    const apiUrl = buildProxyUrl('campaigns', params);
    console.log(`Attempting to fetch campaigns from: ${apiUrl}`);
    
    // Tentative d'appel API avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes timeout
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully retrieved ${data.data?.length || 0} campaigns`);
      
      // Transformer les données pour correspondre à notre format
      return data.data.map((item: any) => ({
        uid: item.uid,
        campaign_uid: item.uid,
        name: item.name,
        subject: item.subject,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        delivery_date: item.delivery_at || item.run_at,
        run_at: item.run_at,
        last_error: item.last_error,
        statistics: item.statistics || {},
        delivery_info: {
          total: parseInt(item.statistics?.subscriber_count) || 0,
          delivered: parseInt(item.statistics?.delivered_count) || 0,
          delivery_rate: parseFloat(item.statistics?.delivered_rate) || 0,
          opened: parseInt(item.statistics?.open_count) || 0,
          unique_open_rate: parseFloat(item.statistics?.uniq_open_rate) || 0,
          clicked: parseInt(item.statistics?.click_count) || 0,
          click_rate: parseFloat(item.statistics?.click_rate) || 0,
          bounced: {
            soft: parseInt(item.statistics?.soft_bounce_count) || 0,
            hard: parseInt(item.statistics?.hard_bounce_count) || 0,
            total: parseInt(item.statistics?.bounce_count) || 0
          },
          unsubscribed: parseInt(item.statistics?.unsubscribe_count) || 0
        }
      }));
    } catch (error) {
      console.error("Erreur lors de la requête API:", error);
      
      // En mode démo, générer des campagnes fictives
      console.log("Falling back to mock campaigns due to API error");
      const mockCampaigns = generateMockCampaigns(8);
      console.log(`Generated ${mockCampaigns.length} mock campaigns for testing`);
      return mockCampaigns;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    throw error;
  }
}

/**
 * Récupère les détails d'une campagne spécifique
 */
export async function fetchCampaignDetails(account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail> {
  console.log(`Fetching details for campaign ${campaignUid} from account ${account.name}`);
  
  try {
    // Si l'UID commence par "mock-", c'est une campagne de démonstration
    if (campaignUid.startsWith('mock-')) {
      // Générer un détail de campagne fictif correspondant à l'UID
      throw new Error("Demo campaign - using mock data");
    }
    
    // Tenter de récupérer depuis l'API réelle
    // Construire l'URL pour la requête
    const params = {
      api_token: account.apiToken,
      _t: Date.now().toString() // Paramètre anti-cache
    };
    
    const apiUrl = buildProxyUrl(`campaigns/${campaignUid}`, params);
    console.log(`Fetching campaign details with URL: ${apiUrl}`);
    
    try {
      // Essayer d'abord un appel API direct
      console.log(`Attempting direct API call to: ${decodeURIComponent(apiUrl.split('url=')[1])}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes timeout
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Campaign details retrieved successfully:`, data);
      return data as AcelleCampaignDetail;
      
    } catch (error) {
      console.error(`Error fetching details for campaign ${campaignUid}:`, error);
      
      // Générer une campagne de démonstration comme fallback en cas d'erreur
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
    
    return campaign;
  });
}
