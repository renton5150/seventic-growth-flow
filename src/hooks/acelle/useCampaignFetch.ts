
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign, CachedCampaign } from "@/types/acelle.types";

export const fetchCampaignsFromCache = async (activeAccounts: AcelleAccount[]): Promise<AcelleCampaign[]> => {
  const accountIds = activeAccounts.map(acc => acc.id);
  if (accountIds.length === 0) {
    console.log("No active accounts found");
    return [];
  }

  console.log(`Fetching campaigns for accounts: ${accountIds.join(', ')}`);
  
  try {
    const { data: cachedCampaigns, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    if (!cachedCampaigns || cachedCampaigns.length === 0) {
      console.log("No campaigns found in cache");
      return [];
    }

    console.log(`Found ${cachedCampaigns.length} campaigns in cache`);
    // Only log detailed sample data in development
    if (process.env.NODE_ENV !== 'production' && cachedCampaigns.length > 0) {
      console.log("Sample campaign data:", cachedCampaigns[0]);
    }

    // Assurer la conversion correcte des données de cache vers le format AcelleCampaign
    return cachedCampaigns.map((campaign: CachedCampaign) => {
      // Initialiser les structures de données requises
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

      // Extraire avec précaution les données de delivery_info
      if (campaign.delivery_info) {
        try {
          // Traiter delivery_info s'il est fourni comme une chaîne JSON
          if (typeof campaign.delivery_info === 'string') {
            try {
              const parsedInfo = JSON.parse(campaign.delivery_info);
              if (parsedInfo && typeof parsedInfo === 'object' && !Array.isArray(parsedInfo)) {
                deliveryInfo = {
                  ...deliveryInfo,
                  ...parsedInfo,
                };
                
                // Traiter les données de rebond séparément
                if (parsedInfo.bounced && typeof parsedInfo.bounced === 'object' && !Array.isArray(parsedInfo.bounced)) {
                  deliveryInfo.bounced = {
                    ...deliveryInfo.bounced,
                    ...(parsedInfo.bounced as { soft?: number; hard?: number; total?: number })
                  };
                }
              }
            } catch (parseError) {
              console.error(`Error parsing delivery_info JSON for campaign ${campaign.campaign_uid}:`, parseError);
            }
          } 
          // Traiter delivery_info s'il est déjà un objet
          else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
            if (!Array.isArray(campaign.delivery_info)) {
              const deliveryInfoObj = campaign.delivery_info as Record<string, any>;
              
              // Copier les propriétés non-imbriquées
              Object.entries(deliveryInfoObj).forEach(([key, value]) => {
                if (key !== 'bounced' && value !== null && value !== undefined) {
                  (deliveryInfo as any)[key] = value;
                }
              });
              
              // Traiter la propriété imbriquée 'bounced'
              if (deliveryInfoObj.bounced && 
                  typeof deliveryInfoObj.bounced === 'object' && 
                  !Array.isArray(deliveryInfoObj.bounced)) {
                deliveryInfo.bounced = {
                  soft: deliveryInfoObj.bounced.soft || 0,
                  hard: deliveryInfoObj.bounced.hard || 0,
                  total: deliveryInfoObj.bounced.total || 0
                };
              }
            } else {
              console.warn(`Unexpected array format for delivery_info in campaign ${campaign.campaign_uid}`);
            }
          }
        } catch (e) {
          console.error(`Error processing delivery_info for campaign ${campaign.campaign_uid}:`, e);
        }
      }

      // Créer l'objet statistiques
      const statistics = {
        subscriber_count: getNumberSafely(campaign, ['delivery_info', 'total'], deliveryInfo.total),
        delivered_count: getNumberSafely(campaign, ['delivery_info', 'delivered'], deliveryInfo.delivered),
        delivered_rate: getNumberSafely(campaign, ['delivery_info', 'delivery_rate'], deliveryInfo.delivery_rate),
        open_count: getNumberSafely(campaign, ['delivery_info', 'opened'], deliveryInfo.opened),
        uniq_open_rate: getNumberSafely(campaign, ['delivery_info', 'unique_open_rate'], deliveryInfo.unique_open_rate),
        click_count: getNumberSafely(campaign, ['delivery_info', 'clicked'], deliveryInfo.clicked),
        click_rate: getNumberSafely(campaign, ['delivery_info', 'click_rate'], deliveryInfo.click_rate),
        bounce_count: getNumberSafely(campaign, ['delivery_info', 'bounced', 'total'], deliveryInfo.bounced.total),
        soft_bounce_count: getNumberSafely(campaign, ['delivery_info', 'bounced', 'soft'], deliveryInfo.bounced.soft),
        hard_bounce_count: getNumberSafely(campaign, ['delivery_info', 'bounced', 'hard'], deliveryInfo.bounced.hard),
        unsubscribe_count: getNumberSafely(campaign, ['delivery_info', 'unsubscribed'], deliveryInfo.unsubscribed),
        abuse_complaint_count: getNumberSafely(campaign, ['delivery_info', 'complained'], deliveryInfo.complained)
      };

      // Créer l'objet final de campagne avec une compatibilité totale
      return {
        uid: campaign.campaign_uid,                // Utiliser campaign_uid comme uid
        campaign_uid: campaign.campaign_uid,       // Conserver aussi campaign_uid pour compatibilité
        name: campaign.name || 'Sans nom',
        subject: campaign.subject || 'Sans sujet',
        status: campaign.status || 'unknown',
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        delivery_date: campaign.delivery_date || '',
        run_at: campaign.run_at || '',
        last_error: campaign.last_error || '',
        delivery_info: deliveryInfo,
        statistics: statistics,
        meta: {},                              // Initialiser meta comme objet vide
        track: {},                             // Initialiser track comme objet vide
        report: {}                             // Initialiser report comme objet vide
      } as AcelleCampaign;
    });
  } catch (error) {
    console.error('Fatal error fetching campaigns from cache:', error);
    return [];
  }
};

// Fonction utilitaire sécurisée pour extraire des valeurs numériques
function getNumberSafely(obj: any, path: string[], defaultValue: number = 0): number {
  try {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    if (current === undefined || current === null) return defaultValue;
    const num = Number(current);
    return isNaN(num) ? defaultValue : num;
  } catch (e) {
    return defaultValue;
  }
}
