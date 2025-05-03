
import { toast } from "sonner";

/**
 * Traduit le statut d'une campagne Acelle
 */
export function translateStatus(status: string): string {
  const translations = {
    'new': 'Nouveau',
    'queued': 'En file d\'attente',
    'sending': 'Envoi en cours',
    'sent': 'Envoyé',
    'error': 'Erreur',
    'ready': 'Prêt',
    'paused': 'En pause',
    'failed': 'Échec',
    'done': 'Terminé',
    'cancelled': 'Annulé',
    'rejected': 'Rejeté'
  };
  
  return translations[status.toLowerCase()] || status;
}

/**
 * Récupère la variante de badge appropriée pour un statut donné
 */
export function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  const badgeMap = {
    'new': 'default',
    'queued': 'secondary',
    'sending': 'warning',
    'sent': 'success',
    'error': 'destructive',
    'ready': 'secondary',
    'paused': 'outline',
    'failed': 'destructive',
    'done': 'success',
    'cancelled': 'outline',
    'rejected': 'destructive'
  };
  
  return badgeMap[status.toLowerCase()] as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" || 'default';
}

/**
 * Formate un pourcentage pour l'affichage
 */
export function renderPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Récupère les statistiques d'une campagne Acelle
 */
export async function fetchCampaignStats(
  campaignUid: string,
  apiEndpoint: string,
  apiToken: string
): Promise<any> {
  try {
    // Formatage de l'URL API
    const url = `${apiEndpoint}/api/v1/campaigns/${campaignUid}/statistics`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching campaign statistics:", error);
    toast.error("Erreur lors de la récupération des statistiques");
    return null;
  }
}

/**
 * Traite les statistiques brutes d'une campagne
 */
export function processRawStats(rawStats: any): Record<string, any> {
  // Implémenter le traitement des statistiques brutes
  return rawStats;
}

/**
 * Génère des statistiques simulées pour le mode démo
 */
export function generateSimulatedStats(): Record<string, any> {
  const subCount = Math.floor(Math.random() * 1000) + 100;
  const deliveredCount = Math.floor(subCount * (0.92 + Math.random() * 0.08));
  const deliveredRate = deliveredCount / subCount;
  
  const openCount = Math.floor(deliveredCount * (0.3 + Math.random() * 0.5));
  const uniqOpenRate = openCount / deliveredCount;
  
  const clickCount = Math.floor(openCount * (0.1 + Math.random() * 0.3));
  const clickRate = clickCount / deliveredCount;
  
  const bounceCount = subCount - deliveredCount;
  const softBounce = Math.floor(bounceCount * (0.7 + Math.random() * 0.3));
  const hardBounce = bounceCount - softBounce;
  
  const unsubCount = Math.floor(deliveredCount * Math.random() * 0.02);
  const complaintCount = Math.floor(deliveredCount * Math.random() * 0.005);
  
  const statistics = {
    subscriber_count: subCount,
    delivered_count: deliveredCount,
    delivered_rate: deliveredRate,
    open_count: openCount,
    uniq_open_count: openCount,
    uniq_open_rate: uniqOpenRate,
    click_count: clickCount,
    click_rate: clickRate,
    bounce_count: bounceCount,
    soft_bounce_count: softBounce,
    hard_bounce_count: hardBounce,
    unsubscribe_count: unsubCount,
    abuse_complaint_count: complaintCount
  };
  
  const delivery_info = {
    total: subCount,
    delivered: deliveredCount,
    delivery_rate: deliveredRate,
    opened: openCount,
    unique_open_rate: uniqOpenRate,
    clicked: clickCount,
    click_rate: clickRate,
    bounced: {
      total: bounceCount,
      soft: softBounce,
      hard: hardBounce
    },
    unsubscribed: unsubCount,
    complained: complaintCount
  };
  
  return { statistics, delivery_info };
}
