
import { Request, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { toast } from "sonner";

/**
 * Cloner une requête existante
 * @param requestId ID de la requête à cloner
 * @returns La nouvelle requête clonée ou undefined en cas d'erreur
 */
export const cloneRequest = async (requestId: string): Promise<Request | undefined> => {
  try {
    console.log(`[cloneRequest] Début du clonage de la requête ${requestId}`);
    
    // 1. Récupérer les données de la requête originale
    const { data: originalRequest, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError) {
      console.error("[cloneRequest] Erreur lors de la récupération de la requête originale:", fetchError);
      return undefined;
    }
    
    // 2. Préparer les données pour la nouvelle requête
    const newRequestData = {
      title: `Copie de: ${originalRequest.title}`,
      type: originalRequest.type,
      mission_id: originalRequest.mission_id,
      created_by: originalRequest.created_by, // Conserver le même créateur
      details: originalRequest.details,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Échéance à une semaine
      status: "pending", // Statut initial
      workflow_status: "pending_assignment", // En attente d'affectation
      target_role: originalRequest.target_role,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };
    
    console.log("[cloneRequest] Données préparées pour la nouvelle requête:", newRequestData);
    
    // 3. Insérer la nouvelle requête
    const { data: newRequest, error: insertError } = await supabase
      .from('requests')
      .insert(newRequestData)
      .select()
      .single();
    
    if (insertError) {
      console.error("[cloneRequest] Erreur lors de l'insertion de la nouvelle requête:", insertError);
      return undefined;
    }
    
    // 4. Formater la requête pour l'interface utilisateur
    const formattedRequest = await formatRequestFromDb(newRequest);
    console.log("[cloneRequest] Nouvelle requête créée et formatée:", formattedRequest);
    
    return formattedRequest;
  } catch (error) {
    console.error("[cloneRequest] Erreur inattendue lors du clonage de la requête:", error);
    return undefined;
  }
};
