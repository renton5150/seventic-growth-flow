
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TeleworkDay {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
}

export const teleworkService = {
  // Récupérer tous les jours de télétravail d'un utilisateur
  async getTeleworkDays(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('work_schedule_requests')
      .select('start_date')
      .eq('user_id', userId)
      .eq('request_type', 'telework');
      
    if (error) throw error;
    return data?.map(item => item.start_date) || [];
  },

  // Ajouter un jour de télétravail
  async addTeleworkDay(userId: string, date: Date): Promise<void> {
    const dateString = format(date, 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('work_schedule_requests')
      .insert({
        user_id: userId,
        request_type: 'telework',
        start_date: dateString,
        end_date: dateString,
        status: 'approved',
        is_exceptional: false,
        reason: 'Télétravail sélectionné',
        approved_by: userId,
        approved_at: new Date().toISOString()
      });
      
    if (error) throw error;
  },

  // Supprimer un jour de télétravail
  async removeTeleworkDay(userId: string, date: Date): Promise<void> {
    const dateString = format(date, 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('work_schedule_requests')
      .delete()
      .eq('user_id', userId)
      .eq('start_date', dateString)
      .eq('request_type', 'telework');
      
    if (error) throw error;
  },

  // Réinitialiser tous les jours de télétravail
  async resetAllTelework(userId: string): Promise<void> {
    const { error } = await supabase
      .from('work_schedule_requests')
      .delete()
      .eq('user_id', userId)
      .eq('request_type', 'telework');
      
    if (error) throw error;
  }
};
