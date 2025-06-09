import { supabase } from "@/integrations/supabase/client";
import { WorkScheduleRequest, WorkScheduleNotification } from "@/types/workSchedule";

export const workScheduleService = {
  // Récupérer toutes les demandes (admin) ou les demandes de l'utilisateur
  async getRequests(userId?: string): Promise<WorkScheduleRequest[]> {
    try {
      console.log("[workScheduleService] Récupération des demandes pour userId:", userId);
      
      // Utiliser une requête simple sans join pour éviter les erreurs de type
      let query = supabase.from('work_schedule_requests').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      query = query.order('start_date', { ascending: true });

      const { data, error } = await query;
      
      if (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        throw new Error(`Erreur de chargement: ${error.message}`);
      }

      console.log("[workScheduleService] Demandes récupérées:", data?.length || 0);

      // Enrichir avec les données utilisateur si nécessaire
      const enrichedData = await Promise.all(
        (data || []).map(async (request: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email, role')
            .eq('id', request.user_id)
            .single();

          return {
            ...request,
            user_name: profile?.name,
            user_email: profile?.email,
            user_role: profile?.role
          };
        })
      );

      return enrichedData as WorkScheduleRequest[];
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      throw error;
    }
  },

  // Créer une nouvelle demande
  async createRequest(request: Omit<WorkScheduleRequest, 'id' | 'created_at' | 'updated_at'>): Promise<WorkScheduleRequest> {
    console.log("[workScheduleService] Création d'une nouvelle demande:", request);
    
    try {
      // Vérifier d'abord si une demande existe déjà
      const { data: existing, error: checkError } = await supabase
        .from('work_schedule_requests')
        .select('id')
        .eq('user_id', request.user_id)
        .eq('start_date', request.start_date)
        .eq('request_type', request.request_type);

      if (checkError) {
        console.error("[workScheduleService] Erreur vérification:", checkError);
        throw new Error(`Erreur de vérification: ${checkError.message}`);
      }

      if (existing && existing.length > 0) {
        console.log("[workScheduleService] Demande existante trouvée:", existing);
        throw new Error("Une demande existe déjà pour cette date");
      }

      const { data, error } = await supabase
        .from('work_schedule_requests')
        .insert(request)
        .select()
        .single();

      if (error) {
        console.error("[workScheduleService] Erreur lors de la création:", error);
        throw new Error(`Erreur de création: ${error.message}`);
      }
      
      console.log("[workScheduleService] Demande créée avec succès:", data);
      return data as WorkScheduleRequest;
    } catch (error) {
      console.error("[workScheduleService] Erreur critique:", error);
      throw error;
    }
  },

  // Mettre à jour une demande
  async updateRequest(id: string, updates: Partial<WorkScheduleRequest>): Promise<WorkScheduleRequest> {
    console.log("[workScheduleService] Mise à jour de la demande:", id, updates);
    
    try {
      const { data, error } = await supabase
        .from('work_schedule_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("[workScheduleService] Erreur lors de la mise à jour:", error);
        throw new Error(`Erreur de mise à jour: ${error.message}`);
      }
      
      console.log("[workScheduleService] Demande mise à jour avec succès:", data);
      return data as WorkScheduleRequest;
    } catch (error) {
      console.error("[workScheduleService] Erreur critique:", error);
      throw error;
    }
  },

  // Supprimer une demande
  async deleteRequest(id: string): Promise<void> {
    console.log("[workScheduleService] Suppression de la demande:", id);
    
    try {
      const { error } = await supabase
        .from('work_schedule_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("[workScheduleService] Erreur lors de la suppression:", error);
        throw new Error(`Erreur de suppression: ${error.message}`);
      }
      
      console.log("[workScheduleService] Demande supprimée avec succès");
    } catch (error) {
      console.error("[workScheduleService] Erreur critique:", error);
      throw error;
    }
  },

  // Récupérer les notifications de l'utilisateur
  async getNotifications(userId: string): Promise<WorkScheduleNotification[]> {
    const { data, error } = await supabase
      .from('work_schedule_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as WorkScheduleNotification[];
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
