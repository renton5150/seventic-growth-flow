
import { supabase } from "@/integrations/supabase/client";
import { format, isValid } from "date-fns";
import { toast } from "sonner";

// Interface pour les demandes de télétravail
interface TeleworkRequest {
  id: string;
  user_id: string;
  request_type: 'telework';
  start_date: string;
  end_date: string;
  status: 'approved';
  is_exceptional: boolean;
  reason: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export const workScheduleNewService = {
  // Récupérer toutes les demandes de télétravail pour un utilisateur
  async getTeleworkRequests(userId: string): Promise<TeleworkRequest[]> {
    try {
      console.log("📆 [NewService] Récupération télétravail pour:", userId);
      
      const { data, error } = await supabase
        .from('work_schedule_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('request_type', 'telework')
        .order('start_date', { ascending: true });
        
      if (error) {
        console.error("❌ [NewService] Erreur récupération:", error);
        throw new Error(`Erreur de récupération: ${error.message}`);
      }
      
      console.log("✅ [NewService] Récupéré:", data?.length || 0, "demandes");
      // Assertion de type car nous savons que request_type sera 'telework' grâce à la contrainte DB
      return (data || []) as TeleworkRequest[];
    } catch (error) {
      console.error("❌ [NewService] Erreur critique:", error);
      throw error;
    }
  },

  // Ajouter un jour de télétravail
  async addTeleworkDay(userId: string, date: Date): Promise<{ success: boolean; addedDate: string }> {
    try {
      // Validation et normalisation de la date
      if (!isValid(date)) {
        throw new Error("Date invalide");
      }
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log("➕ [NewService] Ajout télétravail:", formattedDate);
      
      // Vérification d'existence avec la contrainte unique
      const { data: existingData, error: checkError } = await supabase
        .from('work_schedule_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('start_date', formattedDate)
        .eq('request_type', 'telework');
        
      if (checkError) {
        console.error("❌ [NewService] Erreur vérification:", checkError);
        throw new Error(`Erreur de vérification: ${checkError.message}`);
      }
      
      if (existingData && existingData.length > 0) {
        console.log("⚠️ [NewService] Télétravail déjà existant");
        throw new Error("Un jour de télétravail existe déjà pour cette date");
      }
      
      // Insertion dans la nouvelle table avec contrainte unique
      const requestData = {
        user_id: userId,
        request_type: 'telework' as const,
        start_date: formattedDate,
        end_date: formattedDate,
        status: 'approved' as const,
        is_exceptional: false,
        reason: 'Télétravail sélectionné',
        approved_by: userId,
        approved_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('work_schedule_requests')
        .insert([requestData])
        .select()
        .single();
        
      if (error) {
        console.error("❌ [NewService] Erreur insertion:", error);
        if (error.code === '23505') { // Violation de contrainte unique
          throw new Error("Un jour de télétravail existe déjà pour cette date");
        }
        throw new Error(`Erreur d'insertion: ${error.message}`);
      }
      
      console.log("✅ [NewService] Télétravail ajouté avec succès:", data.id);
      return { success: true, addedDate: formattedDate };
    } catch (error) {
      console.error("❌ [NewService] Erreur critique ajout:", error);
      throw error;
    }
  },

  // Supprimer un jour de télétravail
  async removeTeleworkDay(userId: string, date: Date): Promise<{ success: boolean; removedDate: string }> {
    try {
      // Validation et normalisation de la date
      if (!isValid(date)) {
        throw new Error("Date invalide");
      }
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log("🗑️ [NewService] Suppression télétravail:", formattedDate);
      
      // Suppression avec conditions strictes
      const { data, error } = await supabase
        .from('work_schedule_requests')
        .delete()
        .eq('user_id', userId)
        .eq('start_date', formattedDate)
        .eq('request_type', 'telework')
        .select();
        
      if (error) {
        console.error("❌ [NewService] Erreur suppression:", error);
        throw new Error(`Erreur de suppression: ${error.message}`);
      }
      
      const deletedCount = data?.length || 0;
      console.log("✅ [NewService] Supprimé:", deletedCount, "entrée(s)");
      
      // Vérification post-suppression
      const { data: checkData, error: checkError } = await supabase
        .from('work_schedule_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('start_date', formattedDate)
        .eq('request_type', 'telework');
        
      if (checkError) {
        console.warn("⚠️ [NewService] Erreur vérification post-suppression:", checkError);
      }
      
      const isFullyDeleted = !checkData || checkData.length === 0;
      console.log("🔍 [NewService] Vérification suppression:", isFullyDeleted ? "SUCCÈS" : "ÉCHEC");
      
      return { success: isFullyDeleted, removedDate: formattedDate };
    } catch (error) {
      console.error("❌ [NewService] Erreur critique suppression:", error);
      throw error;
    }
  },

  // Réinitialiser complètement tous les jours de télétravail d'un utilisateur
  async resetAllTelework(userId: string): Promise<{ success: boolean; deletedCount: number }> {
    try {
      console.log("🔄 [NewService] Réinitialisation complète pour:", userId);
      
      // Suppression de toutes les demandes de télétravail
      const { data, error } = await supabase
        .from('work_schedule_requests')
        .delete()
        .eq('user_id', userId)
        .eq('request_type', 'telework')
        .select();
        
      if (error) {
        console.error("❌ [NewService] Erreur réinitialisation:", error);
        throw new Error(`Erreur de réinitialisation: ${error.message}`);
      }
      
      const deletedCount = data?.length || 0;
      console.log("✅ [NewService] Réinitialisation réussie, supprimé:", deletedCount, "entrée(s)");
      
      return { success: true, deletedCount };
    } catch (error) {
      console.error("❌ [NewService] Erreur critique réinitialisation:", error);
      throw error;
    }
  }
};
