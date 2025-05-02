
import { AcelleCampaign } from '@/types/acelle.types';

/**
 * Génère des campagnes mock pour les démos et les tests
 * Limité à 5 campagnes par défaut pour cohérence
 */
export function generateMockCampaigns(count: number = 5): AcelleCampaign[] {
  const campaigns: AcelleCampaign[] = [];
  const statuses = ['queued', 'sending', 'sent', 'new', 'paused'];
  const subjects = [
    'Découvrez nos nouveaux services',
    'Invitation à notre événement annuel',
    'Offre spéciale pour nos clients',
    'Newsletter mensuelle',
    'Webinaire sur les tendances du marché'
  ];
  
  const names = [
    'Campagne de bienvenue',
    'Campagne de fidélisation',
    'Newsletter Mensuelle',
    'Promotion d\'été',
    'Campagne de fin d\'année'
  ];
  
  // Limiter à 5 campagnes par défaut même si on demande plus
  const actualCount = Math.min(count, 5);
  
  for (let i = 0; i < actualCount; i++) {
    // Date d'envoi aléatoire dans les 30 derniers jours
    const runAt = new Date();
    runAt.setDate(runAt.getDate() - Math.floor(Math.random() * 30));
    
    // Date de création quelques jours avant l'envoi
    const createdAt = new Date(runAt);
    createdAt.setDate(createdAt.getDate() - 3);
    
    // Statistiques réalistes
    const subscriberCount = Math.floor(Math.random() * 5000) + 500;
    const bounceRate = Math.random() * 0.05; // 0-5% de bounces
    const deliveredCount = Math.floor(subscriberCount * (1 - bounceRate));
    const openRate = Math.random() * 0.4 + 0.2; // 20-60% d'ouvertures
    const clickRate = Math.random() * 0.3; // 0-30% de clics
    
    // Calculer les nombres absolus
    const openCount = Math.floor(deliveredCount * openRate);
    const clickCount = Math.floor(deliveredCount * clickRate);
    const unsubscribeCount = Math.floor(deliveredCount * Math.random() * 0.02); // 0-2% de désabonnements
    const bounceCount = subscriberCount - deliveredCount;
    const softBounceCount = Math.floor(bounceCount * 0.7);
    const hardBounceCount = Math.floor(bounceCount * 0.3);
    
    const campaign: AcelleCampaign = {
      uid: `mock-${i + 1}`,
      campaign_uid: `mock-${i + 1}`,
      name: `${names[i % names.length]} ${i + 1}`,
      subject: subjects[i % subjects.length],
      status: statuses[i % statuses.length],
      created_at: createdAt.toISOString(),
      updated_at: new Date().toISOString(),
      delivery_date: runAt.toISOString(),
      run_at: runAt.toISOString(),
      statistics: {
        subscriber_count: subscriberCount,
        delivered_count: deliveredCount,
        delivered_rate: (1 - bounceRate) * 100,
        open_count: openCount,
        uniq_open_rate: openRate * 100,
        click_count: clickCount,
        click_rate: clickRate * 100,
        bounce_count: bounceCount,
        soft_bounce_count: softBounceCount,
        hard_bounce_count: hardBounceCount,
        unsubscribe_count: unsubscribeCount,
        abuse_complaint_count: Math.floor(unsubscribeCount * 0.1) // 10% des désabonnés se plaignent
      },
      delivery_info: {
        total: subscriberCount,
        delivered: deliveredCount,
        delivery_rate: (1 - bounceRate) * 100,
        opened: openCount,
        unique_open_rate: openRate * 100,
        clicked: clickCount,
        click_rate: clickRate * 100,
        bounced: {
          soft: softBounceCount,
          hard: hardBounceCount,
          total: bounceCount
        },
        unsubscribed: unsubscribeCount,
        complained: Math.floor(unsubscribeCount * 0.1)
      }
    };
    
    campaigns.push(campaign);
  }
  
  return campaigns;
}
