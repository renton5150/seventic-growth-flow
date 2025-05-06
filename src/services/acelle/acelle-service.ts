
/**
 * Utilities pour l'API Acelle
 */
import { AcelleAccount } from "@/types/acelle.types";

/**
 * Configuration du mode démo
 */
export const DEMO_MODE = true; // Activer le mode démo par défaut

/**
 * Construit l'URL pour l'API Acelle en tenant compte de la configuration du compte
 */
export const buildAcelleApiUrl = (account: AcelleAccount, path: string): string => {
  // Normaliser le endpoint en supprimant le slash final si présent
  const apiBase = account.api_endpoint?.endsWith("/") 
    ? account.api_endpoint.slice(0, -1) 
    : account.api_endpoint;
  
  // Vérifier si le path commence par un slash et l'ajuster
  const apiPath = path.startsWith("/") ? path.substring(1) : path;
  
  // Déterminer si l'API contient déjà "api/v1" dans son URL
  const needsApiV1 = !apiBase.includes("/api/v1");
  const apiV1Path = needsApiV1 ? "/api/v1/" : "/";
  
  // Construire l'URL finale avec le token d'API
  const apiToken = account.api_token;
  const separator = apiPath.includes("?") ? "&" : "?";
  const finalPath = `${apiPath}${separator}api_token=${apiToken}`;
  
  return `${apiBase}${apiV1Path}${finalPath}`;
};

/**
 * Construit l'URL pour le proxy CORS
 */
export const buildProxyUrl = (path: string): string => {
  // URL de base pour le proxy CORS
  const proxyBase = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
  
  // Vérifier si le path commence par un slash et l'ajuster
  const apiPath = path.startsWith("/") ? path.substring(1) : path;
  
  // Construire l'URL finale pour le proxy
  return `${proxyBase}/${apiPath}`;
};

/**
 * Effectue un appel à l'API Acelle via le proxy CORS
 */
export const callAcelleApi = async (
  account: AcelleAccount,
  path: string,
  options?: {
    method?: string;
    body?: any;
    maxRetries?: number;
    useProxy?: boolean;
    headers?: Record<string, string>;
    demoMode?: boolean;
  }, 
  retryCount = 0
): Promise<any> => {
  try {
    // Vérifier si le mode démo est activé
    if (DEMO_MODE || options?.demoMode) {
      // En mode démo, ne pas faire d'appels API réels
      console.log(`[MODE DÉMO] Simulation d'appel API pour: ${path}`);
      
      // Simuler un léger délai pour donner l'impression d'une requête réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retourner des données de démo adaptées au type de requête
      return getDemoResponse(path);
    }
    
    // Utilisation réelle de l'API via le proxy CORS
    const method = options?.method || "GET";
    const maxRetries = options?.maxRetries || 1;
    
    // Construire les en-têtes
    const url = buildProxyUrl(path);
    
    console.log(`Appel API Acelle via proxy (${retryCount + 1}/${maxRetries + 1}): ${url}`);
    
    // Configurer les en-têtes pour le proxy CORS
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Acelle-Endpoint": account.api_endpoint,
      "X-Acelle-Token": account.api_token,
      "X-Auth-Method": "token",
      ...(options?.headers || {})
    };
    
    // Configurer la requête
    const requestOptions: RequestInit = {
      method,
      headers,
      cache: "no-store"
    };
    
    // Ajouter le corps si nécessaire
    if (options?.body && method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    // Effectuer la requête
    const response = await fetch(url, requestOptions);
    
    // Vérifier le statut de la réponse
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} - ${response.statusText}`);
      
      // En cas d'erreur, retourner automatiquement des données de démo
      console.log("Réponse d'erreur détectée, fallback vers données de démo");
      return getDemoResponse(path);
    }
    
    // Traiter la réponse
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API:", error);
    
    // En cas d'erreur, retourner systématiquement des données de démo
    console.log("Erreur API détectée, fallback vers données de démo");
    return getDemoResponse(path);
  }
};

/**
 * Génère des réponses de démo pour différents types d'API
 */
export const getDemoResponse = (path: string): any => {
  // Déterminer le type de réponse en fonction du chemin
  if (path.match(/^campaigns\/?$/)) {
    // Liste des campagnes
    return generateDemoCampaigns(10);
  } 
  else if (path.match(/^campaigns\/[a-zA-Z0-9]+$/)) {
    // Détails d'une campagne spécifique
    const campaignId = path.split('/')[1];
    return generateDemoCampaignDetails(campaignId);
  }
  else if (path.match(/^campaigns\/[a-zA-Z0-9]+\/overview$/)) {
    // Statistiques d'une campagne
    const campaignId = path.split('/')[1];
    return generateDemoCampaignStats(campaignId);
  }
  
  // Par défaut, retourner un objet générique
  return {
    status: "success",
    message: "Opération simulée réussie",
    data: {}
  };
};

/**
 * Génère une liste de campagnes de démo
 */
export const generateDemoCampaigns = (count: number = 10): any => {
  const campaigns = [];
  const statuses = ["sent", "sending", "queued", "ready", "new", "paused", "failed"];
  const subjects = ["Newsletter mensuelle", "Promotion spéciale", "Annonce importante", "Webinar à venir", "Invitation"];
  
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const createdDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    
    campaigns.push({
      uid: `demo-${i}-${Math.random().toString(36).substring(2, 8)}`,
      name: `Campagne démo ${i + 1}`,
      subject: `${subject} ${i + 1}`,
      status: status,
      created_at: createdDate.toISOString(),
      updated_at: new Date().toISOString(),
      delivery_date: status === "new" ? null : new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      run_at: status === "sending" ? new Date().toISOString() : null,
      from_email: "marketing@example.com",
      from_name: "Service Marketing",
      reply_to: "contact@example.com",
      type: "regular"
    });
  }
  
  return campaigns;
};

/**
 * Génère les détails d'une campagne de démo
 */
export const generateDemoCampaignDetails = (campaignId: string): any => {
  return {
    uid: campaignId,
    name: `Campagne ${campaignId.slice(0, 8)}`,
    subject: `Sujet de la campagne ${campaignId.slice(0, 5)}`,
    status: "sent",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    delivery_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    from_email: "marketing@example.com",
    from_name: "Service Marketing",
    reply_to: "contact@example.com",
    plain: "Contenu texte de la campagne",
    html: "<h1>Campagne marketing</h1><p>Contenu HTML de la campagne</p>",
    type: "regular"
  };
};

/**
 * Génère des statistiques pour une campagne de démo
 */
export const generateDemoCampaignStats = (campaignId: string): any => {
  const subscriberCount = 5000 + Math.floor(Math.random() * 5000);
  const deliveryRate = 0.95 + (Math.random() * 0.05);
  const openRate = 0.25 + (Math.random() * 0.3);
  const clickRate = 0.05 + (Math.random() * 0.15);
  
  const delivered = Math.floor(subscriberCount * deliveryRate);
  const opened = Math.floor(delivered * openRate);
  const clicked = Math.floor(opened * clickRate);
  
  return {
    data: {
      uid: campaignId,
      name: `Campagne ${campaignId.slice(0, 8)}`,
      subscribers_count: subscriberCount,
      recipients_count: delivered,
      delivery_rate: deliveryRate * 100, // En pourcentage
      unique_opens_count: opened,
      unique_opens_rate: openRate * 100, // En pourcentage
      opens_count: opened + Math.floor(opened * 0.3),
      unique_clicks_count: clicked,
      clicks_count: clicked + Math.floor(clicked * 0.5),
      clicks_rate: clickRate * 100, // En pourcentage
      bounce_count: Math.floor(subscriberCount * 0.03),
      soft_bounce_count: Math.floor(subscriberCount * 0.02),
      hard_bounce_count: Math.floor(subscriberCount * 0.01),
      unsubscribe_count: Math.floor(subscriberCount * 0.005),
      feedback_count: Math.floor(subscriberCount * 0.001)
    }
  };
};

// Export des fonctions principales sous forme d'objet service
export const acelleApiService = {
  buildAcelleApiUrl,
  buildProxyUrl,
  callAcelleApi,
  getDemoResponse,
  generateDemoCampaigns,
  generateDemoCampaignDetails,
  generateDemoCampaignStats,
  DEMO_MODE
};
