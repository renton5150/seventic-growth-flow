
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

  // Fonction de nettoyage des données fantômes
  async cleanupWorkScheduleData(userId: string): Promise<string[]> {
    try {
      console.log("🧹 Début du nettoyage des données de télétravail pour l'utilisateur:", userId);
      
      // 1. Récupérer toutes les entrées pour cet utilisateur
      const { data: existingEntries, error: fetchError } = await supabase
        .from('work_schedule_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('request_type', 'telework');
        
      if (fetchError) throw fetchError;
      
      console.log("📊 Entrées existantes:", existingEntries?.length || 0);
      
      if (!existingEntries || existingEntries.length === 0) {
        console.log("✅ Aucune donnée à nettoyer");
        return [];
      }
      
      // 2. Identifier les doublons potentiels (même date, formats différents)
      const dateMap = new Map();
      const duplicates: string[] = [];
      
      existingEntries.forEach(entry => {
        // Normalisation de la date pour comparaison
        const normalizedDate = new Date(entry.start_date).toISOString().split('T')[0];
        
        if (dateMap.has(normalizedDate)) {
          duplicates.push(entry.id);
        } else {
          dateMap.set(normalizedDate, entry.id);
        }
      });
      
      console.log("🔍 Doublons identifiés:", duplicates.length);
      
      // 3. Supprimer les doublons
      if (duplicates.length > 0) {
        const { error: deleteError } = await supabase
          .from('work_schedule_requests')
          .delete()
          .in('id', duplicates);
          
        if (deleteError) throw deleteError;
        console.log("🗑️ Doublons supprimés");
      }
      
      // 4. Vérifier l'intégrité des données restantes
      const { data: remainingEntries, error: verifyError } = await supabase
        .from('work_schedule_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('request_type', 'telework');
        
      if (verifyError) throw verifyError;
      
      console.log("✅ Nettoyage terminé. Entrées restantes:", remainingEntries?.length || 0);
      return (remainingEntries || []).map(entry => entry.start_date);
      
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage:", error);
      throw error;
    }
  },

  // Créer une nouvelle demande
  async createRequest(request: Omit<WorkScheduleRequest, 'id' | 'created_at' | 'updated_at'>): Promise<WorkScheduleRequest> {
    console.log("✅ [workScheduleService] Création d'une nouvelle demande:", request);
    
    try {
      // Vérifier d'abord si une demande existe déjà
      const { data: existing, error: checkError } = await supabase
        .from('work_schedule_requests')
        .select('id')
        .eq('user_id', request.user_id)
        .eq('start_date', request.start_date)
        .eq('request_type', request.request_type);

      if (checkError) {
        console.error("❌ [workScheduleService] Erreur vérification:", checkError);
        throw new Error(`Erreur de vérification: ${checkError.message}`);
      }

      if (existing && existing.length > 0) {
        console.log("❌ [workScheduleService] Demande existante trouvée:", existing);
        throw new Error("Une demande existe déjà pour cette date");
      }

      const { data, error } = await supabase
        .from('work_schedule_requests')
        .insert(request)
        .select()
        .single();

      if (error) {
        console.error("❌ [workScheduleService] Erreur lors de la création:", error);
        throw new Error(`Erreur de création: ${error.message}`);
      }
      
      console.log("✅ [workScheduleService] Demande créée avec succès:", data);
      return data as WorkScheduleRequest;
    } catch (error) {
      console.error("❌ [workScheduleService] Erreur critique:", error);
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

  // Supprimer une demande - VERSION ROBUSTE pour éliminer les données fantômes
  async deleteRequest(id: string): Promise<{ success: true; deletedId: string }> {
    console.log("🔥 [workScheduleService] Suppression robuste de la demande:", id);
    
    try {
      // Étape 1: Récupérer la demande avant suppression pour debug
      const { data: requestToDelete, error: fetchError } = await supabase
        .from('work_schedule_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error("❌ [workScheduleService] Erreur lors de la récupération avant suppression:", fetchError);
        throw new Error(`Erreur de récupération: ${fetchError.message}`);
      }

      console.log("🔥 [workScheduleService] Demande à supprimer:", requestToDelete);

      // Étape 2: Recherche exhaustive de toutes les entrées similaires (pour nettoyer les doublons)
      const dateObj = new Date(requestToDelete.start_date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      const { data: similarEntries, error: searchError } = await supabase
        .from('work_schedule_requests')
        .select('id, start_date')
        .eq('user_id', requestToDelete.user_id)
        .eq('request_type', 'telework')
        .eq('start_date', formattedDate);

      if (searchError) {
        console.error("❌ [workScheduleService] Erreur lors de la recherche d'entrées similaires:", searchError);
      } else {
        console.log("🔍 [workScheduleService] Entrées similaires trouvées:", similarEntries?.length || 0);
      }

      // Étape 3: Supprimer l'entrée principale
      const { error: deleteError } = await supabase
        .from('work_schedule_requests')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error("❌ [workScheduleService] Erreur lors de la suppression:", deleteError);
        throw new Error(`Erreur de suppression: ${deleteError.message}`);
      }
      
      console.log("✅ [workScheduleService] Demande supprimée avec succès de la BDD");

      // Étape 4: Suppression préventive des doublons potentiels
      if (similarEntries && similarEntries.length > 1) {
        const otherIds = similarEntries.filter(entry => entry.id !== id).map(entry => entry.id);
        if (otherIds.length > 0) {
          console.log("🧹 [workScheduleService] Suppression préventive des doublons:", otherIds);
          const { error: cleanupError } = await supabase
            .from('work_schedule_requests')
            .delete()
            .in('id', otherIds);
          
          if (cleanupError) {
            console.warn("⚠️ [workScheduleService] Erreur lors du nettoyage des doublons:", cleanupError);
          } else {
            console.log("🧹 [workScheduleService] Doublons supprimés avec succès");
          }
        }
      }

      // Étape 5: Vérifier que la suppression a bien eu lieu
      const { data: verifyData, error: verifyError } = await supabase
        .from('work_schedule_requests')
        .select('id')
        .eq('id', id);

      if (verifyError) {
        console.error("❌ [workScheduleService] Erreur lors de la vérification:", verifyError);
      } else {
        console.log("✅ [workScheduleService] Vérification suppression - Résultat:", verifyData?.length === 0 ? "SUCCÈS" : "ÉCHEC");
      }

      // Retourner un objet explicite avec les informations nécessaires
      return { 
        success: true, 
        deletedId: id 
      };
      
    } catch (error) {
      console.error("❌ [workScheduleService] Erreur critique:", error);
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

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('work_schedule_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  validateRequest(request: Partial<WorkScheduleRequest>, existingRequests: WorkScheduleRequest[]): string[] {
    const errors: string[] = [];
    const startDate = new Date(request.start_date!);
    const endDate = new Date(request.end_date!);
    const today = new Date();

    if (endDate < startDate) {
      errors.push("La date de fin doit être après la date de début");
    }

    if (request.request_type === 'telework') {
      if (!request.is_exceptional) {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        if (startDate < oneWeekFromNow) {
          errors.push("Les demandes de télétravail doivent être déposées au moins 1 semaine à l'avance");
        }
      }

      const requestDays = this.getBusinessDays(startDate, endDate);
      for (const week of this.groupDaysByWeek(requestDays)) {
        if (week.length > 2) {
          errors.push("Maximum 2 jours de télétravail par semaine autorisés");
        }
      }

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

  getBusinessDays(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
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
      weekStart.setDate(day.getDate() - day.getDay() + 1);
      
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
