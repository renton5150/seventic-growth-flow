
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
    
    // Construire l'URL de base pour la fonction Edge acelle-proxy
    const baseUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy';
    
    // Ajouter les paramètres à l'URL si fournis
    let queryParams = '';
    if (params && Object.keys(params).length > 0) {
      queryParams = '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }
    
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
    
    // Appeler la fonction Edge pour vérifier l'API
    const { data, error } = await supabase.functions.invoke('check-acelle-api', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Acelle-Token': apiToken,
        'X-Acelle-Endpoint': apiEndpoint
      },
      body: { 
        apiEndpoint, 
        apiToken 
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
  // Nettoyer l'endpoint et le chemin
  const cleanEndpoint = apiEndpoint.replace(/\/$/, '');
  
  // CORRECTION: Vérifier si le chemin contient déjà le préfixe /api/v1/
  const hasApiPrefix = path.startsWith('/api/v1/') || path.startsWith('api/v1/');
  
  // Nettoyer le chemin (supprimer le slash initial si présent)
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Déterminer le chemin final à utiliser
  const finalPath = hasApiPrefix ? cleanPath : `api/v1/${cleanPath}`;
  
  // Log pour debug
  console.log(`Construction chemin API: endpoint=${cleanEndpoint}, chemin=${path}, chemin final=${finalPath}`);
  
  // Construire l'URL avec le chemin API
  return buildProxyUrl(cleanEndpoint, {
    path: finalPath,
    ...params
  });
};
