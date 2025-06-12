
import { supabase } from "@/integrations/supabase/client";

/**
 * Service ultra-simple pour récupérer les données brutes
 * AVEC logs détaillés pour diagnostiquer le problème
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
  console.log("🔍 [DIAGNOSTIC] Début de fetchSimpleRequests");
  console.log("🔍 [DIAGNOSTIC] Tentative de connexion à Supabase...");
  
  try {
    // Étape 1: Vérifier la connexion Supabase
    console.log("🔍 [DIAGNOSTIC] Test de connexion Supabase...");
    const { data: testData, error: testError } = await supabase
      .from('growth_requests_view')
      .select('count(*)', { count: 'exact' });
    
    if (testError) {
      console.error("❌ [DIAGNOSTIC] Erreur de connexion Supabase:", testError);
      throw testError;
    }
    
    console.log("✅ [DIAGNOSTIC] Connexion Supabase OK");
    
    // Étape 2: Récupération des données brutes
    console.log("🔍 [DIAGNOSTIC] Récupération des données depuis growth_requests_view...");
    
    const { data, error } = await supabase
      .from('growth_requests_view')
      .select('*')
      .order('created_at', { ascending: false });
      
    console.log("🔍 [DIAGNOSTIC] Réponse de Supabase:");
    console.log("  - Error:", error);
    console.log("  - Data length:", data?.length || 0);
    console.log("  - Data sample:", data ? data.slice(0, 2) : "null");
      
    if (error) {
      console.error("❌ [DIAGNOSTIC] Erreur Supabase lors de la récupération:", error);
      throw error;
    }
    
    if (!data) {
      console.warn("⚠️ [DIAGNOSTIC] Données nulles retournées par Supabase");
      return [];
    }
    
    if (data.length === 0) {
      console.warn("⚠️ [DIAGNOSTIC] Tableau vide retourné par Supabase");
      return [];
    }
    
    console.log(`✅ [DIAGNOSTIC] ${data.length} demandes brutes récupérées de Supabase`);
    console.log("🔍 [DIAGNOSTIC] Structure de la première demande:", Object.keys(data[0] || {}));
    
    // Étape 3: Formatage MINIMAL et sécurisé
    console.log("🔍 [DIAGNOSTIC] Début du formatage...");
    
    const formattedRequests = data.map((req: any, index: number) => {
      console.log(`🔍 [DIAGNOSTIC] Formatage demande ${index + 1}/${data.length} - ID: ${req.id}`);
      
      try {
        // Calcul simple de retard
        const dueDate = new Date(req.due_date);
        const now = new Date();
        const isLate = dueDate < now && req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
        
        const formatted = {
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
        
        console.log(`✅ [DIAGNOSTIC] Demande ${index + 1} formatée: ${formatted.title}`);
        return formatted;
        
      } catch (formatError) {
        console.error(`❌ [DIAGNOSTIC] Erreur formatage demande ${index + 1}:`, formatError);
        // Retourner un objet minimal en cas d'erreur
        return {
          id: req.id || `error-${index}`,
          title: `Erreur formatage: ${req.title || 'Inconnu'}`,
          type: 'error',
          status: 'error',
          workflow_status: 'error',
          created_by: null,
          assigned_to: null,
          mission_id: null,
          due_date: '',
          created_at: '',
          last_updated: '',
          sdr_name: 'Erreur',
          assigned_to_name: 'Erreur',
          mission_name: 'Erreur',
          mission_client: 'Erreur',
          details: {},
          isLate: false
        } as SimpleRequest;
      }
    });
    
    console.log(`🎯 [DIAGNOSTIC] Formatage terminé: ${formattedRequests.length} demandes formatées`);
    console.log("🔍 [DIAGNOSTIC] IDs des demandes formatées:", formattedRequests.map(r => r.id));
    console.log("🔍 [DIAGNOSTIC] Titres des demandes formatées:", formattedRequests.map(r => r.title));
    
    return formattedRequests;
    
  } catch (error) {
    console.error("💥 [DIAGNOSTIC] Exception dans fetchSimpleRequests:", error);
    console.error("💥 [DIAGNOSTIC] Stack trace:", error.stack);
    return [];
  }
};
