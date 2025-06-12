
import { supabase } from "@/integrations/supabase/client";

/**
 * Service de récupération DIRECTE des demandes depuis la table requests
 * Sans formatage complexe - juste les données essentielles
 */
export interface DirectRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  assigned_to: string | null;
  created_by: string | null;
  mission_id: string | null;
  due_date: string;
  created_at: string;
  last_updated: string;
  details: any;
  // Champs calculés simples
  assigned_to_name: string;
  mission_name: string;
  mission_client: string;
  sdr_name: string;
  isLate: boolean;
}

export const fetchDirectRequests = async (): Promise<DirectRequest[]> => {
  console.log("🚀 [DIRECT] Début de fetchDirectRequests - récupération DIRECTE");
  
  try {
    // Récupérer directement depuis la table requests avec les jointures nécessaires
    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        *,
        mission:missions(name, client),
        assigned_profile:profiles!assigned_to(name),
        created_profile:profiles!created_by(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ [DIRECT] Erreur Supabase:", error);
      throw error;
    }

    console.log(`✅ [DIRECT] ${requests?.length || 0} demandes récupérées directement`);

    if (!requests || requests.length === 0) {
      console.warn("⚠️ [DIRECT] Aucune demande trouvée dans la table requests");
      return [];
    }

    // Formatage minimal et direct
    const directRequests: DirectRequest[] = requests.map((req: any) => {
      const dueDate = new Date(req.due_date);
      const now = new Date();
      const isLate = dueDate < now && req.workflow_status !== 'completed';

      const directRequest: DirectRequest = {
        id: req.id,
        title: req.title || 'Sans titre',
        type: req.type || 'unknown',
        status: req.status || 'pending',
        workflow_status: req.workflow_status || 'pending_assignment',
        assigned_to: req.assigned_to,
        created_by: req.created_by,
        mission_id: req.mission_id,
        due_date: req.due_date,
        created_at: req.created_at,
        last_updated: req.last_updated,
        details: req.details || {},
        // Champs calculés
        assigned_to_name: req.assigned_profile?.name || 'Non assigné',
        mission_name: req.mission?.name || 'Sans mission',
        mission_client: req.mission?.client || 'Sans client',
        sdr_name: req.created_profile?.name || 'Inconnu',
        isLate
      };

      console.log(`📋 [DIRECT] Demande formatée: ${directRequest.id} - ${directRequest.title}`);
      return directRequest;
    });

    console.log(`🎯 [DIRECT] ${directRequests.length} demandes formatées avec succès`);
    console.log("🔍 [DIRECT] IDs des demandes:", directRequests.map(r => r.id.substring(0, 8)));
    
    return directRequests;

  } catch (error) {
    console.error("💥 [DIRECT] Exception dans fetchDirectRequests:", error);
    return [];
  }
};
