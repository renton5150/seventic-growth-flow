
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";

/**
 * Service unique pour récupérer TOUTES les demandes
 * Cette approche élimine la complexité des hooks multiples
 */
export const fetchAllGrowthRequests = async (): Promise<Request[]> => {
  console.log("[SingleRequestService] 🔄 Récupération de TOUTES les demandes depuis growth_requests_view");
  
  try {
    const { data, error } = await supabase
      .from('growth_requests_view')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("[SingleRequestService] ❌ Erreur lors de la récupération:", error);
      throw error;
    }
    
    console.log(`[SingleRequestService] ✅ ${data?.length || 0} demandes récupérées depuis la base`);
    
    if (!data) return [];
    
    // Formater toutes les demandes
    const formattedRequests = await Promise.all(
      data.map((req: any) => formatRequestFromDb(req))
    );
    
    console.log(`[SingleRequestService] 📊 Après formatage: ${formattedRequests.length} demandes`);
    
    return formattedRequests;
  } catch (error) {
    console.error("[SingleRequestService] 💥 Exception:", error);
    return [];
  }
};
