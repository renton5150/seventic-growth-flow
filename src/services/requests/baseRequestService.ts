
import { Request, RequestStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { preloadMissionNames } from "@/services/missionNameService";

/**
 * Obtenir toutes les requêtes
 */
export const getAllRequests = async (): Promise<Request[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des requêtes:", error);
      return [];
    }

    // Précharger les noms de missions pour optimiser les performances
    const missionIds = requests
      .map(req => req.mission_id)
      .filter((id): id is string => !!id);
      
    if (missionIds.length > 0) {
      // Déclencher le préchargement en parallèle
      preloadMissionNames(missionIds);
    }

    // Adapter les données au format attendu par l'application
    return Promise.all(requests.map(request => formatRequestFromDb(request)));
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des requêtes:", error);
    return [];
  }
};

/**
 * Obtenir une requête par ID
 */
export const getRequestById = async (requestId: string): Promise<Request | undefined> => {
  try {
    console.log(`[getRequestById] Récupération de la requête ${requestId}`);
    
    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de la requête:", error);
      return undefined;
    }

    // Utiliser le formatteur centralisé qui gère correctement les noms de mission
    return await formatRequestFromDb(request);
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la requête:", error);
    return undefined;
  }
};

/**
 * Obtenir les requêtes par mission
 */
export const getRequestsByMissionId = async (missionId: string): Promise<Request[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des requêtes pour la mission ${missionId}:`, error);
      return [];
    }

    return Promise.all(requests.map(request => formatRequestFromDb(request)));
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des requêtes par mission:", error);
    return [];
  }
};

/**
 * Mettre à jour le statut d'une requête
 */
export const updateRequestStatus = async (requestId: string, status: RequestStatus, additionalData: Record<string, any> = {}): Promise<Request | undefined> => {
  try {
    const { data: request, error: getError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (getError) {
      console.error("Erreur lors de la récupération de la requête pour mise à jour:", getError);
      return undefined;
    }

    const updateData = {
      ...request,
      ...additionalData,
      status,
      last_updated: new Date().toISOString()
    };

    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour du statut de la requête:", updateError);
      return undefined;
    }

    return formatRequestFromDb(updatedRequest);
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour du statut de la requête:", error);
    return undefined;
  }
};
