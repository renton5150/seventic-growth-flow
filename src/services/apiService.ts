
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const API_ERROR_MESSAGES = {
  400: "Données invalides",
  401: "Non autorisé",
  403: "Accès refusé", 
  404: "Ressource non trouvée",
  409: "Conflit avec une ressource existante",
  422: "Données non valides",
  429: "Trop de requêtes",
  500: "Erreur serveur",
  503: "Service indisponible"
};

class ApiService {
  /**
   * Détermine si une réponse est en erreur
   */
  private isErrorResponse(response: any): boolean {
    return response.error !== null && response.error !== undefined;
  }

  /**
   * Gère les erreurs des réponses Supabase
   */
  private handleError(method: string, endpoint: string, error: any): never {
    // Message d'erreur avec contexte
    const statusCode = error.code || error.status || "unknown";
    const defaultMessage = API_ERROR_MESSAGES[statusCode as keyof typeof API_ERROR_MESSAGES] 
      || "Une erreur est survenue";
    
    const errorObj = new Error(error.message || defaultMessage) as any;
    errorObj.status = statusCode;
    errorObj.data = error;
    errorObj.endpoint = endpoint;
    errorObj.method = method;

    // Log détaillé pour le débogage
    console.error(
      `API ${method.toUpperCase()} ${endpoint} a échoué:`,
      error.message || defaultMessage,
      error
    );

    // Notification utilisateur par défaut
    toast.error("Erreur API", {
      description: error.message || defaultMessage
    });

    throw errorObj;
  }

  /**
   * Récupère les données depuis une table
   */
  async get<T = any>(
    table: string, 
    options: {
      id?: string;
      query?: Record<string, any>;
      select?: string;
      order?: { column: string; ascending?: boolean };
      range?: { from: number; to: number };
      single?: boolean;
      maybeSingle?: boolean;
    } = {}
  ): Promise<T> {
    try {
      console.log(`API GET ${table}`, options);
      
      // Supabase expects actual table names, not dynamic strings
      const tableQuery = supabase.from(table);
      let query = tableQuery.select(options.select || '*');
      
      // Filtre par ID si spécifié
      if (options.id) {
        query = query.eq('id', options.id);
      }
      
      // Ajoute des filtres additionnels si spécifiés
      if (options.query) {
        Object.entries(options.query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Ajoute l'ordre si spécifié
      if (options.order) {
        query = query.order(
          options.order.column, 
          { ascending: options.order.ascending !== false }
        );
      }

      // Ajoute la pagination si spécifiée
      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }

      // Exécute la requête
      let response;
      if (options.single) {
        response = await query.single();
      } else if (options.maybeSingle) {
        response = await query.maybeSingle();
      } else {
        response = await query;
      }
      
      if (this.isErrorResponse(response)) {
        return this.handleError('GET', table, response.error);
      }
      
      return response.data as T;
    } catch (error) {
      return this.handleError('GET', table, error);
    }
  }

  /**
   * Crée un nouvel enregistrement dans une table
   */
  async post<T = any>(
    table: string, 
    data: Record<string, any>,
    options: {
      select?: string;
      upsert?: boolean;
    } = {}
  ): Promise<T> {
    try {
      console.log(`API POST ${table}`, data);
      
      // Prépare la requête
      const tableQuery = supabase.from(table);
      
      // Handle insert with or without upsert
      let insertQuery;
      if (options.upsert) {
        insertQuery = await tableQuery.upsert(data);
      } else {
        insertQuery = await tableQuery.insert(data);
      }
      
      // Get the inserted data
      let query;
      if (options.select) {
        query = supabase.from(table)
          .select(options.select)
          .eq('id', insertQuery.data?.[0].id)
          .single();
      } else {
        query = supabase.from(table)
          .select()
          .eq('id', insertQuery.data?.[0].id)
          .single();
      }
      
      // Exécute la requête pour obtenir les données
      const response = await query;
      
      if (this.isErrorResponse(response)) {
        return this.handleError('POST', table, response.error);
      }
      
      return response.data as T;
    } catch (error) {
      return this.handleError('POST', table, error);
    }
  }

  /**
   * Met à jour un enregistrement existant
   */
  async put<T = any>(
    table: string, 
    id: string, 
    data: Record<string, any>,
    options: {
      select?: string;
    } = {}
  ): Promise<T> {
    try {
      console.log(`API PUT ${table}/${id}`, data);
      
      // Prépare la requête de mise à jour
      const updateQuery = await supabase.from(table)
        .update(data)
        .eq('id', id);
      
      if (this.isErrorResponse(updateQuery)) {
        return this.handleError('PUT', table, updateQuery.error);
      }
      
      // Récupère les données mises à jour
      const tableQuery = supabase.from(table);
      let query = tableQuery.select(options.select || '*')
        .eq('id', id)
        .single();
      
      // Exécute la requête
      const response = await query;
      
      if (this.isErrorResponse(response)) {
        return this.handleError('PUT', table, response.error);
      }
      
      return response.data as T;
    } catch (error) {
      return this.handleError('PUT', table, error);
    }
  }

  /**
   * Supprime un enregistrement
   */
  async delete(
    table: string, 
    id: string
  ): Promise<boolean> {
    try {
      console.log(`API DELETE ${table}/${id}`);
      
      // Exécute la requête
      const response = await supabase.from(table)
        .delete()
        .eq('id', id);
      
      if (this.isErrorResponse(response)) {
        return this.handleError('DELETE', table, response.error);
      }
      
      return true;
    } catch (error) {
      return this.handleError('DELETE', table, error);
    }
  }

  /**
   * Exécute une fonction RPC
   */
  async rpc<T = any>(
    functionName: "create_user_profile" | "user_has_growth_role" | "user_is_admin",
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      console.log(`API RPC ${functionName}`, params);
      
      const response = await supabase.rpc(functionName, params);
      
      if (this.isErrorResponse(response)) {
        return this.handleError('RPC', functionName, response.error);
      }
      
      return response.data as T;
    } catch (error) {
      return this.handleError('RPC', functionName, error);
    }
  }
}

export const apiService = new ApiService();
