
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
    console.log(`[cloneRequest] 🚀 Début du clonage de la requête ${requestId}`);
    
    // 1. Récupérer les données de la requête originale avec tous les détails
    const { data: originalRequest, error: fetchError } = await supabase
      .from('requests_with_missions')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError) {
      console.error("[cloneRequest] ❌ Erreur lors de la récupération de la requête originale:", fetchError);
      toast.error("Erreur lors de la récupération de la demande à cloner");
      return undefined;
    }
    
    if (!originalRequest) {
      console.error("[cloneRequest] ❌ Requête originale non trouvée");
      toast.error("Demande à cloner non trouvée");
      return undefined;
    }
    
    console.log("[cloneRequest] 📋 Requête originale récupérée:", originalRequest);
    
    // 2. Préparer les données pour la nouvelle requête
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      console.error("[cloneRequest] ❌ Utilisateur non connecté");
      toast.error("Vous devez être connecté pour cloner une demande");
      return undefined;
    }
    
    // Calculer la date d'échéance (7 jours à partir d'aujourd'hui)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    const newRequestData = {
      title: `Copie de: ${originalRequest.title}`,
      type: originalRequest.type,
      mission_id: originalRequest.mission_id,
      created_by: currentUser.id, // Utiliser l'utilisateur actuel comme créateur
      details: originalRequest.details, // Conserver tous les détails (template, database, blacklist, etc.)
      due_date: dueDate.toISOString(), // Échéance à une semaine
      status: "pending", // Statut initial
      workflow_status: "pending_assignment", // En attente d'affectation
      target_role: originalRequest.target_role,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };
    
    console.log("[cloneRequest] 📋 Données préparées pour la nouvelle requête:", newRequestData);
    
    // 3. Insérer la nouvelle requête
    const { data: newRequest, error: insertError } = await supabase
      .from('requests')
      .insert(newRequestData)
      .select()
      .single();
    
    if (insertError) {
      console.error("[cloneRequest] ❌ Erreur lors de l'insertion de la nouvelle requête:", insertError);
      toast.error("Erreur lors de la création de la nouvelle demande");
      return undefined;
    }
    
    console.log("[cloneRequest] ✅ Nouvelle requête insérée:", newRequest);
    
    // 4. Formater la requête pour l'interface utilisateur
    const formattedRequest = await formatRequestFromDb(newRequest);
    console.log("[cloneRequest] 🎯 Nouvelle requête formatée:", formattedRequest);
    
    return formattedRequest;
  } catch (error) {
    console.error("[cloneRequest] 💥 Erreur inattendue lors du clonage de la requête:", error);
    toast.error("Erreur inattendue lors du clonage");
    return undefined;
  }
};
