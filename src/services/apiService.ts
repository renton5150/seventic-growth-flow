
import { safeSupabase } from "@/integrations/supabase/safeClient";
import { toast } from "sonner";

// Define simple but effective types
type TableName = string;
type RPCName = string;

// Error message mapping
const API_ERROR_MESSAGES: Record<string | number, string> = {
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
    const defaultMessage = API_ERROR_MESSAGES[statusCode] 
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
    table: TableName, 
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
      
      let query = safeSupabase.from(table).select(options.select || '*');
      
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
    table: TableName, 
    data: any,
    options: {
      select?: string;
      upsert?: boolean;
    } = {}
  ): Promise<T> {
    try {
      console.log(`API POST ${table}`, data);
      
      // Always insert as array to avoid type errors
      let insertResponse;
      if (options.upsert) {
        insertResponse = await safeSupabase.from(table).upsert([data]);
      } else {
        insertResponse = await safeSupabase.from(table).insert([data]);
      }
      
      if (this.isErrorResponse(insertResponse)) {
        return this.handleError('POST', table, insertResponse.error);
      }
      
      // Get the inserted data
      let selectResponse;
      if (insertResponse.data && insertResponse.data.length > 0) {
        const insertedId = insertResponse.data[0].id;
        
        if (options.select) {
          selectResponse = await safeSupabase.from(table)
            .select(options.select)
            .eq('id', insertedId)
            .single();
        } else {
          selectResponse = await safeSupabase.from(table)
            .select()
            .eq('id', insertedId)
            .single();
        }
        
        if (this.isErrorResponse(selectResponse)) {
          return this.handleError('POST', table, selectResponse.error);
        }
        
        return selectResponse.data as T;
      }
      
      return insertResponse.data?.[0] as T;
    } catch (error) {
      return this.handleError('POST', table, error);
    }
  }

  /**
   * Met à jour un enregistrement existant
   */
  async put<T = any>(
    table: TableName, 
    id: string, 
    data: any,
    options: {
      select?: string;
    } = {}
  ): Promise<T> {
    try {
      console.log(`API PUT ${table}/${id}`, data);
      
      // Prépare la requête de mise à jour
      const updateResponse = await safeSupabase.from(table)
        .update(data)
        .eq('id', id);
      
      if (this.isErrorResponse(updateResponse)) {
        return this.handleError('PUT', table, updateResponse.error);
      }
      
      // Récupère les données mises à jour
      const selectResponse = await safeSupabase.from(table)
        .select(options.select || '*')
        .eq('id', id)
        .single();
      
      if (this.isErrorResponse(selectResponse)) {
        return this.handleError('PUT', table, selectResponse.error);
      }
      
      return selectResponse.data as T;
    } catch (error) {
      return this.handleError('PUT', table, error);
    }
  }

  /**
   * Supprime un enregistrement
   */
  async delete(
    table: TableName, 
    id: string
  ): Promise<boolean> {
    try {
      console.log(`API DELETE ${table}/${id}`);
      
      // Exécute la requête
      const response = await safeSupabase.from(table)
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
    functionName: RPCName,
    params: any = {}
  ): Promise<T> {
    try {
      console.log(`API RPC ${functionName}`, params);
      
      const response = await safeSupabase.rpc(functionName, params);
      
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
