
import { supabase } from "@/integrations/supabase/client";

/**
 * Service ultra-simple pour récupérer les données brutes
 * SANS formatage complexe qui peut échouer
 */
export interface SimpleRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  created_by: string | null;
  assigned_to: string | null;
  mission_id: string | null;
  due_date: string;
  created_at: string;
  last_updated: string;
  sdr_name: string | null;
  assigned_to_name: string | null;
  mission_name: string | null;
  mission_client: string | null;
  details: any;
  isLate: boolean;
}

export const fetchSimpleRequests = async (): Promise<SimpleRequest[]> => {
  console.log("[SimpleRequestService] 🚀 Récupération des données ULTRA-SIMPLE");
  
  try {
    const { data, error } = await supabase
      .from('growth_requests_view')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("[SimpleRequestService] ❌ Erreur:", error);
      throw error;
    }
    
    if (!data) {
      console.log("[SimpleRequestService] ⚠️ Aucune donnée trouvée");
      return [];
    }
    
    console.log(`[SimpleRequestService] ✅ ${data.length} demandes récupérées de la base`);
    
    // Formatage MINIMAL et SÉCURISÉ
    const formattedRequests = data.map((req: any) => {
      const dueDate = new Date(req.due_date);
      const now = new Date();
      const isLate = dueDate < now && req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
      
      return {
        id: req.id || '',
        title: req.title || 'Sans titre',
        type: req.type || 'unknown',
        status: req.status || 'pending',
        workflow_status: req.workflow_status || 'pending_assignment',
        created_by: req.created_by,
        assigned_to: req.assigned_to,
        mission_id: req.mission_id,
        due_date: req.due_date || '',
        created_at: req.created_at || '',
        last_updated: req.last_updated || req.updated_at || '',
        sdr_name: req.sdr_name || 'Non assigné',
        assigned_to_name: req.assigned_to_name || 'Non assigné',
        mission_name: req.mission_name || 'Sans mission',
        mission_client: req.mission_client || 'Sans client',
        details: req.details || {},
        isLate
      } as SimpleRequest;
    });
    
    console.log(`[SimpleRequestService] 🎯 ${formattedRequests.length} demandes formatées avec succès`);
    console.log("[SimpleRequestService] 📋 Premiers IDs:", formattedRequests.slice(0, 3).map(r => r.id));
    
    return formattedRequests;
  } catch (error) {
    console.error("[SimpleRequestService] 💥 Exception:", error);
    return [];
  }
};
