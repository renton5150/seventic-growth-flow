
/**
 * Utilitaires pour la construction d'URL de proxy pour l'API Acelle
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Construit une URL complète pour l'API proxy Acelle
 * @param apiEndpoint Le point d'entrée de l'API Acelle
 * @param params Les paramètres à ajouter à l'URL sous forme d'objet Record<string, string>
 * @returns L'URL complète pour le proxy
 */
export const buildProxyUrl = (apiEndpoint: string, params: Record<string, string> = {}): string => {
  try {
    // Nettoyer l'endpoint (retirer le slash final s'il est présent)
    const cleanEndpoint = apiEndpoint.replace(/\/$/, '');
    
    // Construire l'URL de base pour la fonction Edge proxy simplifiée
    const baseUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy-simple';
    
    // Ajouter les paramètres à l'URL si fournis
    let queryParams = '';
    if (params && Object.keys(params).length > 0) {
      queryParams = '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }
    
    // Ajouter un paramètre anti-cache pour éviter les problèmes de mise en cache
    const timestamp = Date.now();
    queryParams = queryParams 
      ? `${queryParams}&_t=${timestamp}` 
      : `?_t=${timestamp}`;
    
    console.log(`ProxyURL construite: ${baseUrl}${queryParams} (sans token visible)`);
    
    return `${baseUrl}${queryParams}`;
  } catch (error) {
    console.error("Erreur lors de la construction de l'URL du proxy:", error);
    throw error;
  }
};

/**
 * Vérifie si un point d'entrée API est accessible en utilisant la fonction Edge check-acelle-api
 * @param apiEndpoint Point d'entrée API à tester
 * @param apiToken Token API à utiliser pour le test
 * @returns Promise<boolean> Indiquant si le point d'entrée est accessible
 */
export const checkApiEndpoint = async (apiEndpoint: string, apiToken: string): Promise<boolean> => {
  try {
    // Obtenir un token d'authentification pour appeler la fonction Edge
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error("Erreur d'authentification pour la vérification de l'API:", sessionError);
      return false;
    }
    
    const accessToken = sessionData.session.access_token;
    
    console.log("Test de connexion à l'API Acelle avec nouveau proxy simplifié");
    
    // Utiliser notre nouvelle fonction test-acelle-auth pour tester l'authentification
    const { data, error } = await supabase.functions.invoke('test-acelle-auth', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-acelle-token': apiToken,
        'x-acelle-endpoint': apiEndpoint
      }
    });
    
    if (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      return false;
    }
    
    return data?.success || false;
  } catch (error) {
    console.error("Exception lors de la vérification de l'API:", error);
    return false;
  }
};

/**
 * Construit le chemin complet d'une API spécifique pour Acelle
 * @param apiEndpoint Point d'entrée de base de l'API
 * @param path Chemin spécifique de l'API (avec ou sans le préfixe /api/v1/)
 * @param params Paramètres supplémentaires
 * @returns URL complète pour l'API
 */
export const buildApiPath = (apiEndpoint: string, path: string, params: Record<string, string> = {}): string => {
  // Nettoyer l'endpoint - enlever le slash final s'il existe
  const cleanEndpoint = apiEndpoint.replace(/\/$/, '');
  
  // CORRECTION: Vérifier si l'endpoint contient déjà "api/v1"
  const hasApiPrefixInEndpoint = cleanEndpoint.includes('/api/v1');
  
  // Vérifier si le chemin contient déjà le préfixe /api/v1/
  const hasApiPrefixInPath = path.startsWith('/api/v1/') || path.startsWith('api/v1/');
  
  // Nettoyer le chemin (supprimer le slash initial si présent)
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Déterminer le chemin final à utiliser
  let finalPath;
  
  if (hasApiPrefixInEndpoint) {
    // Si l'endpoint contient déjà "/api/v1", on utilise simplement le chemin nettoyé
    finalPath = cleanPath;
    console.log(`Endpoint contient déjà api/v1, utilisation directe du chemin: ${finalPath}`);
  } else if (hasApiPrefixInPath) {
    // Si le chemin contient déjà le préfixe, on l'utilise tel quel
    finalPath = cleanPath;
    console.log(`Chemin avec préfixe api/v1 détecté: ${finalPath}`);
  } else {
    // Sinon, on ajoute le préfixe au chemin
    finalPath = `api/v1/${cleanPath}`;
    console.log(`Ajout du préfixe api/v1 au chemin: ${finalPath}`);
  }
  
  // Log pour debug
  console.log(`Construction URL API: endpoint=${cleanEndpoint}, chemin=${path}, chemin final=${finalPath}`);
  
  // Construire l'URL avec la nouvelle approche simplifiée
  const finalParams = { ...params, path: finalPath };
  
  // Construire l'URL avec le chemin API
  return buildProxyUrl(cleanEndpoint, finalParams);
};
