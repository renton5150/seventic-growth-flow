
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";

/**
 * Service pour gérer les appels à l'API Acelle
 */
export const acelleService = {
  /**
   * Génère des campagnes fictives pour le mode démo
   * @param count Nombre de campagnes à générer
   */
  generateMockCampaigns: (count: number = 5) => {
    return Array.from({ length: count }).map((_, index) => {
      const totalEmails = Math.floor(Math.random() * 1000) + 200;
      const deliveredRate = 0.97 + Math.random() * 0.02;
      const delivered = Math.floor(totalEmails * deliveredRate);
      const openRate = 0.3 + Math.random() * 0.4;
      const opened = Math.floor(delivered * openRate);
      const clickRate = 0.1 + Math.random() * 0.3;
      const clicked = Math.floor(opened * clickRate);
      const bounceCount = totalEmails - delivered;
      
      return {
        uid: `demo-${index}`,
        name: `Campagne démo ${index + 1}`,
        subject: `Sujet de la campagne ${index + 1}`,
        status: ["sent", "sending", "queued", "new", "paused", "failed"][Math.floor(Math.random() * 6)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_date: new Date().toISOString(),
        statistics: {
          subscriber_count: totalEmails,
          delivered_count: delivered,
          delivered_rate: deliveredRate * 100,
          open_count: opened,
          uniq_open_rate: openRate * 100,
          click_count: clicked,
          click_rate: clickRate * 100,
          bounce_count: bounceCount,
          soft_bounce_count: Math.floor(bounceCount * 0.7),
          hard_bounce_count: Math.floor(bounceCount * 0.3),
          unsubscribe_count: Math.floor(delivered * 0.02),
          abuse_complaint_count: Math.floor(delivered * 0.005),
        },
        delivery_info: {
          total: totalEmails,
          delivered: delivered,
          delivery_rate: deliveredRate * 100,
          opened: opened,
          unique_open_rate: openRate * 100,
          clicked: clicked,
          click_rate: clickRate * 100,
          bounced: {
            total: bounceCount,
            soft: Math.floor(bounceCount * 0.7),
            hard: Math.floor(bounceCount * 0.3)
          },
          unsubscribed: Math.floor(delivered * 0.02),
          complained: Math.floor(delivered * 0.005)
        }
      };
    });
  }
};

/**
 * Appelle l'API Acelle via le proxy CORS Supabase
 * @param endpoint Point de terminaison API Acelle (sans le domaine)
 * @param params Paramètres à inclure dans la requête
 */
export const callAcelleApi = async (endpoint: string, params: Record<string, any>) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }
    
    const { api_endpoint: apiEndpoint } = params;
    
    // Construire l'URL de l'API Acelle
    let baseUrl = params.api_endpoint;
    if (!baseUrl) {
      throw new Error("L'endpoint API n'est pas défini");
    }
    
    // S'assurer que l'URL ne se termine pas par un slash
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // S'assurer que l'endpoint a un slash au début s'il n'est pas vide
    const formattedEndpoint = endpoint ? (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : '';
    
    // Construire l'URL finale
    const url = `${baseUrl}${formattedEndpoint}`;
    
    console.log(`Appel à l'API Acelle: ${url}`, { params });
    
    // Activer le debug pour voir les détails
    const debugMode = true;
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'api_endpoint') { // Ne pas inclure 'api_endpoint' dans les paramètres
        queryParams.append(key, String(value));
      }
    }
    
    // Ajouter le paramètre de debug si nécessaire
    if (debugMode) {
      queryParams.append('debug', 'true');
    }
    
    // Ajouter un timestamp pour éviter les problèmes de cache
    queryParams.append('_t', Date.now().toString());
    
    // Appeler l'API Acelle directement en utilisant CORS Proxy
    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Acelle (${response.status}): ${errorText}`);
      throw new Error(`Erreur API Acelle: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Acelle:", error);
    throw error;
  }
};
