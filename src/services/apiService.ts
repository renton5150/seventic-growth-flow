import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase URL or Key not provided, running with mock data. Check your environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type pour les options supplémentaires
interface ApiOptions {
  query?: Record<string, any>;
  order?: { column: string; ascending: boolean };
  maybeSingle?: boolean;
  userRole?: string; // Ajout du rôle utilisateur
}

/**
 * Récupérer une ressource via l'API
 */
export const get = async <T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T[]> => {
  try {
    console.log(`API GET ${endpoint}`, options);

    let query = supabase.from(endpoint).select("*");

    if (options.query) {
      query = query.match(options.query);
    }

    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`API GET ${endpoint} a échoué:`, error);
      throw {
        message: error.message,
        status: error.code,
        data: error,
        endpoint,
        method: "GET",
      };
    }

    console.log(`API GET ${endpoint} a réussi:`, data);

    if (options.maybeSingle) {
      return data[0] as unknown as T[];
    }

    return data as unknown as T[];
  } catch (error: any) {
    console.error(`API GET ${endpoint} a échoué:`, error);
    throw error;
  }
};

/**
 * Créer une ressource via l'API
 */
export const post = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    console.log(`API POST ${endpoint}`, data);

    // Supprimer les propriétés à valeur undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const { data: responseData, error } = await supabase
      .from(endpoint)
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error(`API POST ${endpoint} a échoué:`, error);
      throw {
        message: error.message,
        status: error.code,
        data: error,
        endpoint,
        method: "POST",
      };
    }

    console.log(`API POST ${endpoint} a réussi:`, responseData);
    return responseData as unknown as T;
  } catch (error: any) {
    console.error(`API POST ${endpoint} a échoué:`, error);
    throw error;
  }
};

/**
 * Mettre à jour une ressource via l'API
 */
export const put = async <T>(
  endpoint: string,
  id: string,
  data: any,
  options: ApiOptions = {}
): Promise<T> => {
  try {
    console.log(`API PUT ${endpoint}/${id}`, data);
    
    // Supprimer les propriétés à valeur undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    
    // Si un rôle utilisateur est spécifié, l'ajouter aux données
    if (options.userRole) {
      cleanData.user_role = options.userRole;
    }
    
    // Appel à Supabase API
    const response = await supabase
      .from(endpoint)
      .update(cleanData)
      .eq("id", id);
    
    if (response.error) {
      console.error(`API PUT ${endpoint} a échoué:`, response.error);
      throw {
        message: response.error.message,
        status: response.error.code,
        data: response.error,
        endpoint,
        method: "PUT",
      };
    }
    
    // Récupérer les données mises à jour
    const { data: updatedData, error: getError } = await supabase
      .from(endpoint)
      .select()
      .eq("id", id)
      .single();
    
    if (getError) {
      console.error(`Erreur lors de la récupération des données mises à jour:`, getError);
      throw {
        message: getError.message,
        status: getError.code,
        data: getError,
        endpoint,
        method: "GET",
      };
    }
    
    return updatedData as unknown as T;
    
  } catch (error: any) {
    console.error(`API PUT ${endpoint} a échoué:`, error);
    throw error;
  }
};

/**
 * Supprimer une ressource via l'API
 */
export const deleteResource = async (endpoint: string, id: string): Promise<void> => {
  try {
    console.log(`API DELETE ${endpoint}/${id}`);

    const { error } = await supabase.from(endpoint).delete().eq("id", id);

    if (error) {
      console.error(`API DELETE ${endpoint} a échoué:`, error);
      throw {
        message: error.message,
        status: error.code,
        data: error,
        endpoint,
        method: "DELETE",
      };
    }

    console.log(`API DELETE ${endpoint} a réussi`);
  } catch (error: any) {
    console.error(`API DELETE ${endpoint} a échoué:`, error);
    throw error;
  }
};
