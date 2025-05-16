
import { Request, RequestStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { preloadMissionNames, forceRefreshFreshworks } from "@/services/missionNameService";

/**
 * Obtenir toutes les requêtes
 */
export const getAllRequests = async (): Promise<Request[]> => {
  try {
    console.log("[getAllRequests] Début récupération de toutes les requêtes");
    
    // Forcer le rafraîchissement de Freshworks
    forceRefreshFreshworks();
    
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
      await preloadMissionNames(missionIds);
      console.log(`[getAllRequests] ${missionIds.length} noms de missions préchargés`);
    }

    // Adapter les données au format attendu par l'application
    const formattedRequests = await Promise.all(requests.map(request => formatRequestFromDb(request)));
    
    console.log(`[getAllRequests] ${formattedRequests.length} requêtes récupérées et formatées`);
    
    // Vérifier si des requêtes ont une mission Freshworks
    const freshworksRequests = formattedRequests.filter(req => 
      req.missionId === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b"
    );
    
    if (freshworksRequests.length > 0) {
      console.log(`[getAllRequests] ${freshworksRequests.length} requêtes liées à Freshworks:`, 
        freshworksRequests.map(r => ({id: r.id, missionName: r.missionName}))
      );
    }
    
    return formattedRequests;
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
    
    // Forcer le rafraîchissement de Freshworks
    forceRefreshFreshworks();
    
    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de la requête:", error);
      return undefined;
    }

    // Si la requête est liée à Freshworks, log spécial
    if (request.mission_id === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b") {
      console.log("[getRequestById] Requête liée à Freshworks détectée!");
    }

    // Utiliser le formatteur centralisé qui gère correctement les noms de mission
    const formattedRequest = await formatRequestFromDb(request);
    console.log(`[getRequestById] Requête formatée: ID=${formattedRequest.id}, Mission=${formattedRequest.missionName}`);
    
    return formattedRequest;
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
