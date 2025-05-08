
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";

/**
 * Récupère une campagne spécifique par son ID
 */
export const fetchCampaignById = async (
  campaignUid: string,
  accountId: string
): Promise<AcelleCampaign | null> => {
  try {
    // Rechercher dans la table email_campaigns_cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .maybeSingle();
    
    if (error) {
      console.error("Erreur lors de la récupération de la campagne:", error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Normaliser les données delivery_info pour assurer leur format correct
    let deliveryInfo = data.delivery_info;
    
    // S'assurer que delivery_info est un objet et normaliser ses valeurs numériques
    if (deliveryInfo) {
      // Convertir explicitement les valeurs importantes en nombres
      deliveryInfo = normalizeDeliveryInfo(deliveryInfo);
      
      console.log("DeliveryInfo normalisé:", deliveryInfo);
    }
    
    // Transformer les données pour correspondre au type AcelleCampaign
    return {
      uid: data.campaign_uid,
      campaign_uid: data.campaign_uid,
      name: data.name,
      subject: data.subject,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      delivery_date: data.delivery_date,
      run_at: data.run_at,
      last_error: data.last_error,
      // Important: utiliser les données normalisées
      delivery_info: deliveryInfo as any,
      // Dupliquer les statistiques pour s'assurer qu'elles sont accessibles via les deux chemins
      statistics: deliveryInfo as any
    };
  } catch (error) {
    console.error("Exception lors de la récupération de la campagne:", error);
    return null;
  }
};

/**
 * Récupère les campagnes du cache pour une liste de comptes
 * avec support de pagination
 */
export const fetchCampaignsFromCache = async (
  accounts: AcelleAccount[],
  page = 1,
  itemsPerPage = 10
): Promise<AcelleCampaign[]> => {
  try {
    if (!accounts.length) return [];
    
    // Extraire les IDs des comptes
    const accountIds = accounts.map(account => account.id);
    
    // Calcul du décalage pour la pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    // Récupérer les campagnes pour tous les comptes spécifiés avec pagination
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error("Erreur lors de la récupération des campagnes du cache:", error);
      return [];
    }
    
    // Transformer les données pour correspondre au type AcelleCampaign
    return (data || []).map(item => {
      // Normaliser les données delivery_info pour assurer leur format correct
      const normalizedDeliveryInfo = normalizeDeliveryInfo(item.delivery_info);
      
      return {
        uid: item.campaign_uid,
        campaign_uid: item.campaign_uid,
        name: item.name,
        subject: item.subject,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        delivery_date: item.delivery_date,
        run_at: item.run_at,
        last_error: item.last_error,
        // Utiliser les données normalisées
        delivery_info: normalizedDeliveryInfo as any,
        // Dupliquer les données normalisées pour garantir la cohérence
        statistics: normalizedDeliveryInfo as any
      };
    });
  } catch (error) {
    console.error("Exception lors de la récupération des campagnes du cache:", error);
    return [];
  }
};

/**
 * Normalise les données delivery_info pour garantir le bon format des valeurs numériques
 */
const normalizeDeliveryInfo = (deliveryInfo: any): any => {
  if (!deliveryInfo) return {};
  
  // Copier l'objet pour éviter de modifier l'original
  const normalized = { ...deliveryInfo };
  
  // Convertir les champs numériques importants en nombres
  const numericFields = [
    'subscriber_count', 'delivered_count', 'open_count', 'uniq_open_count', 
    'click_count', 'bounce_count', 'soft_bounce_count', 'hard_bounce_count',
    'unsubscribe_count', 'abuse_complaint_count', 'total'
  ];
  
  numericFields.forEach(field => {
    if (normalized[field] !== undefined) {
      normalized[field] = parseFloat(normalized[field]) || 0;
    }
  });
  
  // Convertir les taux en nombres (pourcentages)
  const rateFields = [
    'uniq_open_rate', 'open_rate', 'unique_open_rate', 'click_rate', 
    'delivered_rate', 'bounce_rate', 'unsubscribe_rate'
  ];
  
  rateFields.forEach(field => {
    if (normalized[field] !== undefined) {
      // Si c'est une chaîne, la nettoyer avant conversion
      if (typeof normalized[field] === 'string') {
        normalized[field] = parseFloat(normalized[field].replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
      } else {
        normalized[field] = parseFloat(normalized[field]) || 0;
      }
    }
  });
  
  // Gérer le cas spécial pour "bounced" qui peut être un objet ou un nombre
  if (normalized.bounced !== undefined) {
    if (typeof normalized.bounced === 'object' && normalized.bounced !== null) {
      // Si c'est un objet, normaliser ses propriétés
      if (normalized.bounced.soft !== undefined) {
        normalized.bounced.soft = parseFloat(normalized.bounced.soft) || 0;
      }
      if (normalized.bounced.hard !== undefined) {
        normalized.bounced.hard = parseFloat(normalized.bounced.hard) || 0;
      }
      if (normalized.bounced.total !== undefined) {
        normalized.bounced.total = parseFloat(normalized.bounced.total) || 0;
      }
    } else {
      // Si c'est une valeur directe
      normalized.bounced = parseFloat(normalized.bounced) || 0;
    }
  }
  
  console.log("Normalisation appliquée:", {
    before: deliveryInfo,
    after: normalized
  });
  
  return normalized;
};
