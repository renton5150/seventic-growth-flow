
import { AcelleAccount } from '@/types/acelle.types';
import { buildCorsProxyUrl } from './cors-proxy';

// Interface pour les options des requêtes API Acelle
interface AcelleApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Service pour interagir avec l'API Acelle
 * Utilise le proxy CORS pour contourner les limitations CORS
 */
class AcelleApiService {
  /**
   * Construit l'URL complète pour une requête API
   */
  buildUrl(path: string): string {
    return buildCorsProxyUrl(path);
  }
  
  /**
   * Effectue une requête à l'API Acelle
   */
  async fetch(account: AcelleAccount, path: string, options: AcelleApiOptions = {}): Promise<any> {
    if (!account || !account.api_token || !account.api_endpoint) {
      throw new Error('Configuration du compte Acelle invalide');
    }
    
    const url = this.buildUrl(path);
    
    // Construire les options de la requête
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Acelle-Token': account.api_token,
        'X-Acelle-Endpoint': account.api_endpoint,
        ...options.headers
      }
    };
    
    // Ajouter le corps si présent
    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la requête API:', error);
      throw error;
    }
  }
}

export const acelleApiService = new AcelleApiService();
export const buildProxyUrl = (path: string): string => buildCorsProxyUrl(path);
