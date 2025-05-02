
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
    // En mode démo, générer des campagnes fictives
    // Cette partie est maintenue pour permettre une utilisation sans API fonctionnelle
    const mockCampaigns = generateMockCampaigns(8);
    console.log(`Generated ${mockCampaigns.length} mock campaigns for testing`);
    return mockCampaigns;
    
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
      
      const directResponse = await fetch(decodeURIComponent(apiUrl.split('url=')[1]), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        timeout: 5000 // Timeout court pour l'appel direct
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log(`Direct API call successful, campaign details:`, data);
        return data as AcelleCampaignDetail;
      } else {
        console.error("Direct API call failed, falling back to proxy:", directResponse.status);
      }
    } catch (e) {
      console.error("Direct API call failed, falling back to proxy:", e);
    }
    
    // Essayer via le proxy si l'appel direct échoue
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
      
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
    const mockCampaign = generateMockCampaigns(1)[0] as AcelleCampaignDetail;
    mockCampaign.uid = campaignUid;
    mockCampaign.html = "<h1>Données de démonstration</h1><p>Les détails réels ne sont pas disponibles actuellement.</p>";
    mockCampaign.plain = "Données de démonstration\n\nLes détails réels ne sont pas disponibles actuellement.";
    
    throw error;
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
  
  campaigns.forEach(campaign => {
    // Extraire les données de delivery_info si disponible
    const deliveryInfo = campaign.delivery_info || {};
    const stats = campaign.statistics || {};
    
    // Agréger les données
    totalEmails += deliveryInfo.total || stats.subscriber_count || 0;
    totalDelivered += deliveryInfo.delivered || stats.delivered_count || 0;
    totalOpened += deliveryInfo.opened || stats.open_count || 0;
    totalClicked += deliveryInfo.clicked || stats.click_count || 0;
    
    const bounced = deliveryInfo.bounced || {};
    totalBounced += bounced.total || stats.bounce_count || 0;
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
