
import { AcelleCampaign } from '@/types/acelle.types';

/**
 * Génère des campagnes mock pour les démos et les tests
 */
export function generateMockCampaigns(count: number = 10): AcelleCampaign[] {
  const campaigns: AcelleCampaign[] = [];
  const statuses = ['queued', 'sending', 'sent', 'new', 'paused'];
  const subjects = [
    'Découvrez nos nouveaux services',
    'Invitation à notre événement annuel',
    'Offre spéciale pour nos clients',
    'Newsletter mensuelle',
    'Webinaire sur les tendances du marché',
    'Mise à jour importante de notre politique',
    'Dernières actualités du secteur',
    'Joyeuses fêtes de fin d\'année'
  ];
  
  const names = [
    'Campagne de bienvenue',
    'Campagne de fidélisation',
    'Newsletter Mensuelle',
    'Promotion d\'été',
    'Campagne de fin d\'année',
    'Annonce de produit',
    'Rappel d\'événement',
    'Suivi client'
  ];
  
  for (let i = 0; i < count; i++) {
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
        unsubscribe_count: unsubscribeCount
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
          soft: Math.floor(bounceCount * 0.7),
          hard: Math.floor(bounceCount * 0.3),
          total: bounceCount
        },
        unsubscribed: unsubscribeCount
      }
    };
    
    campaigns.push(campaign);
  }
  
  return campaigns;
}
