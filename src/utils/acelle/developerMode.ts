
import { AcelleCampaign, AcelleCampaignStatistics, AcelleAccount } from '../../types/acelle.types';
import { createEmptyStatistics } from './campaignStats';

// Flag pour activer/désactiver le mode développeur globalement
export const DEVELOPER_MODE = true;

// Data generator de statistiques réalistes
export function generateFakeStats(campaignId: string): AcelleCampaignStatistics {
  // Générer des nombres aléatoires réalistes
  const totalEmails = Math.floor(Math.random() * 1000) + 500;
  const deliveredRate = 0.95 + Math.random() * 0.05;
  const delivered = Math.floor(totalEmails * deliveredRate);
  const bounced = totalEmails - delivered;
  const openRate = 0.2 + Math.random() * 0.4;
  const opened = Math.floor(delivered * openRate);
  const uniqueOpenRate = openRate * 0.9; // Légèrement inférieur au taux d'ouverture total
  const uniqueOpens = Math.floor(opened * 0.9);
  const clickRate = 0.1 + Math.random() * 0.3;
  const clicked = Math.floor(opened * clickRate);
  const unsubscribed = Math.floor(delivered * Math.random() * 0.02);
  const spam = Math.floor(delivered * Math.random() * 0.01);
  
  // Adapter aux types exacts de notre application
  return {
    subscriber_count: totalEmails,
    delivered_count: delivered,
    delivered_rate: deliveredRate * 100,
    open_count: opened,
    uniq_open_count: uniqueOpens,
    uniq_open_rate: uniqueOpenRate * 100,
    open_rate: openRate * 100,
    click_count: clicked,
    click_rate: clickRate * 100,
    bounce_count: bounced,
    soft_bounce_count: Math.floor(bounced * 0.7),
    hard_bounce_count: Math.floor(bounced * 0.3),
    unsubscribe_count: unsubscribed,
    abuse_complaint_count: spam
  };
}

// Wrapper pour toutes les fonctions acelle
export function withDeveloperFallback<T>(
  apiCall: () => Promise<T>,
  fallbackData: T
): Promise<T> {
  if (!DEVELOPER_MODE) {
    return apiCall();
  }
  
  console.log("[DEV MODE] Using fallback data instead of API call");
  return new Promise((resolve) => {
    // Simuler un délai réseau réaliste
    setTimeout(() => {
      resolve(fallbackData);
    }, 500 + Math.random() * 1000); // délai aléatoire entre 500ms et 1.5s
  });
}

// Générer une campagne factice complète
export function generateFakeCampaign(id?: string): AcelleCampaign {
  const uid = id || `fake-${Math.random().toString(36).substring(2, 10)}`;
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // jusqu'à 30 jours dans le passé
  
  // Liste de noms de campagnes plausibles
  const campaignNames = [
    "Newsletter Mensuelle",
    "Promotion Été",
    "Annonce Produit",
    "Invitation Webinar",
    "Relance Clients",
    "Bienvenue Nouveaux Clients",
    "Offre Exclusive",
    "Mise à jour Service",
    "Étude Satisfaction"
  ];
  
  // Liste de sujets plausibles
  const subjects = [
    "Découvrez nos dernières actualités",
    "Offre spéciale : -20% ce week-end !",
    "Nous lançons un nouveau produit",
    "Invitation à notre prochain webinar",
    "Nous n'avons pas eu de nouvelles...",
    "Bienvenue dans notre communauté",
    "Offre exclusive pour nos membres",
    "Importantes mises à jour de nos services",
    "Votre avis compte pour nous"
  ];
  
  // Statuts possibles avec distribution réaliste
  const statuses = ["draft", "queued", "sending", "sent", "paused", "error"];
  const statusProbabilities = [0.1, 0.1, 0.1, 0.6, 0.05, 0.05];
  
  // Sélectionner un statut selon les probabilités
  let statusIndex = 0;
  const randomValue = Math.random();
  let cumulativeProbability = 0;
  
  for (let i = 0; i < statusProbabilities.length; i++) {
    cumulativeProbability += statusProbabilities[i];
    if (randomValue <= cumulativeProbability) {
      statusIndex = i;
      break;
    }
  }
  
  const status = statuses[statusIndex];
  
  // Générer des dates cohérentes
  const deliveryDate = status === 'draft' || status === 'queued' 
    ? new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // futur pour draft/queued
    : new Date(createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000); // passé pour autres statuts
  
  // Générer statistics seulement si la campagne est envoyée
  const statistics = (status === 'sent' || status === 'sending') 
    ? generateFakeStats(uid)
    : createEmptyStatistics();
  
  // Indice aléatoire pour choisir le nom et sujet
  const randomIndex = Math.floor(Math.random() * campaignNames.length);
  
  return {
    uid,
    campaign_uid: uid,
    name: campaignNames[randomIndex],
    subject: subjects[randomIndex],
    status,
    created_at: createdAt.toISOString(),
    updated_at: new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    delivery_date: deliveryDate.toISOString(),
    run_at: status !== 'draft' ? deliveryDate.toISOString() : null,
    statistics,
    delivery_info: {
      total: statistics.subscriber_count,
      delivered: statistics.delivered_count,
      opened: statistics.open_count,
      clicked: statistics.click_count,
      bounced: statistics.bounce_count,
      delivery_rate: statistics.delivered_rate,
      unique_open_rate: statistics.uniq_open_rate,
      click_rate: statistics.click_rate
    }
  };
}

// Générer un tableau de campagnes factices
export function generateFakeCampaigns(count: number = 10): AcelleCampaign[] {
  return Array.from({ length: count }, (_, i) => generateFakeCampaign());
}

// Simuler une réponse API pour les statistiques de campagne
export function mockCampaignStatisticsResponse(campaignId: string) {
  const stats = generateFakeStats(campaignId);
  return {
    success: true,
    message: "Statistiques générées en mode développeur",
    data: { statistics: stats },
    stats
  };
}

// Hook utilitaire pour le mode développeur dans les composants
export function useDeveloperMode() {
  return {
    isDeveloperMode: DEVELOPER_MODE,
    getStats: (campaignId: string) => withDeveloperFallback(
      () => Promise.reject(new Error("API call not implemented")), 
      mockCampaignStatisticsResponse(campaignId)
    ),
    getCampaigns: (count: number = 10) => withDeveloperFallback(
      () => Promise.reject(new Error("API call not implemented")), 
      generateFakeCampaigns(count)
    ),
    getSingleCampaign: (id: string) => withDeveloperFallback(
      () => Promise.reject(new Error("API call not implemented")),
      generateFakeCampaign(id)
    )
  };
}
