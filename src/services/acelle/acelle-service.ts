
import { AcelleAccount } from '@/types/acelle.types';
import { fetchViaProxy, getAuthToken } from './cors-proxy';

// Interface pour les options des requêtes API Acelle
interface AcelleApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  preferCache?: boolean;
}

/**
 * Service pour interagir avec l'API Acelle
 * Utilise le système de proxy unifié pour contourner les limitations CORS
 */
class AcelleApiService {
  /**
   * Effectue une requête à l'API Acelle avec gestion robuste des erreurs
   */
  async fetch(account: AcelleAccount, path: string, options: AcelleApiOptions = {}): Promise<any> {
    if (!account || !account.api_token || !account.api_endpoint) {
      throw new Error('Configuration du compte Acelle invalide');
    }
    
    // Obtenir un token d'authentification valide
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('Authentification requise');
    }
    
    // Préparer les options de la requête
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };
    
    // Ajouter le corps si présent
    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }
    
    // Utiliser notre système unifié de requête
    try {
      const response = await fetchViaProxy(
        path,
        fetchOptions,
        account.api_token,
        account.api_endpoint,
        options.retries || 3
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la requête API:', error);
      throw error;
    }
  }
  
  /**
   * Effectue un test de ping pour vérifier la connexion API
   */
  async ping(account: AcelleAccount): Promise<boolean> {
    try {
      // Essayer d'abord l'endpoint ping
      const response = await this.fetch(account, 'ping', { retries: 1 });
      return !!response;
    } catch (pingError) {
      try {
        // Si ping échoue, essayer l'endpoint campaigns comme alternative
        const campaignsResponse = await this.fetch(account, 'campaigns?page=1&per_page=1', { retries: 1 });
        return !!campaignsResponse;
      } catch (e) {
        console.error("Erreur lors du ping de l'API:", e);
        return false;
      }
    }
  }
}

export const acelleApiService = new AcelleApiService();
