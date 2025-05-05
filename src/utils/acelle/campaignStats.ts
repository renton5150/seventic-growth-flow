
import { AcelleCampaign } from "@/types/acelle.types";

/**
 * Crée un objet de statistiques vide mais valide avec des valeurs par défaut
 */
export const createEmptyStatistics = () => {
  return {
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
};

/**
 * Calcule la distribution des statuts de campagne
 */
export const calculateStatusCounts = (campaigns: AcelleCampaign[]) => {
  // Initialiser les compteurs pour les différents statuts
  const counts: Record<string, number> = {
    "new": 0,
    "queued": 0,
    "sending": 0,
    "sent": 0,
    "paused": 0,
    "failed": 0
  };
  
  // Compter les campagnes par statut
  campaigns.forEach(campaign => {
    const status = (campaign.status || '').toLowerCase();
    if (status in counts) {
      counts[status]++;
    } else if (status === 'ready') {
      counts['queued']++; // Considérer 'ready' comme 'queued'
    }
  });
  
  // Traduire les statuts pour l'affichage
  return Object.entries(counts).map(([status, count]) => ({
    status: translateStatus(status),
    count
  }));
};

/**
 * Traduit les statuts techniques en libellés français pour l'affichage
 */
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'new': 'Nouveau',
    'queued': 'En attente',
    'ready': 'En attente',
    'sending': 'En envoi',
    'sent': 'Envoyé',
    'paused': 'En pause',
    'failed': 'Échoué'
  };
  
  return translations[status.toLowerCase()] || 'Inconnu';
};

/**
 * Calcule les statistiques de livraison globales pour un ensemble de campagnes
 */
export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  // Initialiser les compteurs
  let totalEmails = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Parcourir toutes les campagnes pour agréger les statistiques
  campaigns.forEach(campaign => {
    // Extraire les statistiques de la campagne
    const stats = campaign.statistics;
    const delivery = campaign.delivery_info;
    
    // Utiliser la source la plus fiable entre statistics et delivery_info
    if (stats) {
      totalEmails += stats.subscriber_count || 0;
      totalDelivered += stats.delivered_count || 0;
      totalOpened += stats.open_count || 0;
      totalClicked += stats.click_count || 0;
      totalBounced += stats.bounce_count || 0;
    } else if (delivery) {
      totalEmails += delivery.total || 0;
      totalDelivered += delivery.delivered || 0;
      totalOpened += delivery.opened || 0;
      totalClicked += delivery.clicked || 0;
      
      // Gérer les différentes structures possibles pour les bounces
      if (typeof delivery.bounced === 'number') {
        totalBounced += delivery.bounced;
      } else if (typeof delivery.bounced === 'object' && delivery.bounced) {
        totalBounced += delivery.bounced.total || 0;
      }
    }
  });
  
  // Retourner les statistiques agrégées
  return {
    totalEmails,
    totalDelivered,
    totalOpened,
    totalClicked,
    totalBounced
  };
};
