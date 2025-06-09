
import { supabase } from "@/integrations/supabase/client";
import { WorkScheduleRequest, WorkScheduleNotification } from "@/types/workSchedule";

export const workScheduleService = {
  // Récupérer toutes les demandes (admin) ou les demandes de l'utilisateur
  async getRequests(userId?: string): Promise<WorkScheduleRequest[]> {
    let query = supabase
      .from('work_schedule_requests')
      .select(`
        *,
        profiles!work_schedule_requests_user_id_fkey(name, email, role)
      `)
      .order('start_date', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(request => ({
      ...request,
      user_name: request.profiles?.name,
      user_email: request.profiles?.email,
      user_role: request.profiles?.role
    }));
  },

  // Créer une nouvelle demande
  async createRequest(request: Omit<WorkScheduleRequest, 'id' | 'created_at' | 'updated_at'>): Promise<WorkScheduleRequest> {
    const { data, error } = await supabase
      .from('work_schedule_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour une demande
  async updateRequest(id: string, updates: Partial<WorkScheduleRequest>): Promise<WorkScheduleRequest> {
    const { data, error } = await supabase
      .from('work_schedule_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer une demande
  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('work_schedule_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Récupérer les notifications de l'utilisateur
  async getNotifications(userId: string): Promise<WorkScheduleNotification[]> {
    const { data, error } = await supabase
      .from('work_schedule_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Marquer une notification comme lue
  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('work_schedule_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Valider les règles métier
  validateRequest(request: Partial<WorkScheduleRequest>, existingRequests: WorkScheduleRequest[]): string[] {
    const errors: string[] = [];
    const startDate = new Date(request.start_date!);
    const endDate = new Date(request.end_date!);
    const today = new Date();

    // Vérifier que la date de fin est après la date de début
    if (endDate < startDate) {
      errors.push("La date de fin doit être après la date de début");
    }

    // Pour le télétravail, vérifier les règles spécifiques
    if (request.request_type === 'telework') {
      // Vérifier le délai de 1 semaine (sauf demande exceptionnelle)
      if (!request.is_exceptional) {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        if (startDate < oneWeekFromNow) {
          errors.push("Les demandes de télétravail doivent être déposées au moins 1 semaine à l'avance");
        }
      }

      // Vérifier la limite de 2 jours par semaine
      const requestDays = this.getBusinessDays(startDate, endDate);
      for (const week of this.groupDaysByWeek(requestDays)) {
        if (week.length > 2) {
          errors.push("Maximum 2 jours de télétravail par semaine autorisés");
        }
      }

      // Vérifier les conflits avec les demandes existantes pour cette semaine
      for (const week of this.groupDaysByWeek(requestDays)) {
        const existingTeleworkDays = existingRequests
          .filter(r => r.request_type === 'telework' && r.status === 'approved')
          .flatMap(r => this.getBusinessDays(new Date(r.start_date), new Date(r.end_date)))
          .filter(day => this.isSameWeek(day, week[0]));

        if (existingTeleworkDays.length + week.length > 2) {
          errors.push("Cette semaine dépasse la limite de 2 jours de télétravail");
        }
      }
    }

    return errors;
  },

  // Utilitaires pour les calculs de dates
  getBusinessDays(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (current.getDay() !== 0 && current.getDay() !== 6) { // Pas weekend
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  },

  groupDaysByWeek(days: Date[]): Date[][] {
    const weeks: Date[][] = [];
    
    for (const day of days) {
      const weekStart = new Date(day);
      weekStart.setDate(day.getDate() - day.getDay() + 1); // Lundi
      
      let week = weeks.find(w => this.isSameWeek(w[0], day));
      if (!week) {
        week = [];
        weeks.push(week);
      }
      week.push(day);
    }
    
    return weeks;
  },

  isSameWeek(date1: Date, date2: Date): boolean {
    const week1 = new Date(date1);
    week1.setDate(date1.getDate() - date1.getDay() + 1);
    const week2 = new Date(date2);
    week2.setDate(date2.getDate() - date2.getDay() + 1);
    
    return week1.getTime() === week2.getTime();
  }
};
