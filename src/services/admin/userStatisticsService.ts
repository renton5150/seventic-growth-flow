import { supabase } from "@/integrations/supabase/client";

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  role: 'sdr' | 'growth' | 'admin';
  avatar?: string;
  stats: {
    total: number;
    pending: number;
    completed: number;
    late: number;
    unassigned?: number; // Pour Growth uniquement
  };
}

export interface GlobalStatistics {
  totalUsers: number;
  totalPending: number;
  totalCompleted: number;
  totalLate: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Service pour récupérer les statistiques globales - VERSION CORRIGÉE AVEC FILTRES DATE
 */
export const fetchGlobalStatistics = async (dateRange?: DateRange | null): Promise<GlobalStatistics> => {
  try {
    console.log("[GlobalStatistics] 🚀 Récupération des statistiques globales avec filtre date:", dateRange);
    
    // 1. Récupérer tous les utilisateurs actifs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['sdr', 'growth', 'admin']);

    if (usersError) {
      console.error("[GlobalStatistics] ❌ Erreur users:", usersError);
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    // 2. Construire la requête avec ou sans filtre de date
    let activeRequestsQuery = supabase
      .from('requests_with_missions')
      .select('workflow_status, due_date, assigned_to, created_by, created_at')
      .not('workflow_status', 'in', '(completed,canceled)');

    // Appliquer le filtre de date si fourni
    if (dateRange) {
      activeRequestsQuery = activeRequestsQuery
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
    }

    const { data: allRequests, error: requestsError } = await activeRequestsQuery;

    if (requestsError) {
      console.error("[GlobalStatistics] ❌ Erreur requests:", requestsError);
      throw new Error(`Erreur récupération demandes: ${requestsError.message}`);
    }

    console.log(`[GlobalStatistics] 📊 ${allRequests?.length || 0} demandes actives trouvées avec filtres`);

    // 3. Calculer les statistiques globales basées sur les demandes filtrées
    const totalUsers = users?.length || 0;
    
    const totalPending = allRequests?.filter(req => 
      req.workflow_status === 'pending_assignment' || 
      req.workflow_status === 'in_progress'
    ).length || 0;
    
    // Pour les demandes terminées, utiliser une requête séparée avec filtre date si nécessaire
    let completedQuery = supabase
      .from('requests_with_missions')
      .select('id')
      .eq('workflow_status', 'completed');

    if (dateRange) {
      completedQuery = completedQuery
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
    }

    const { data: completedRequests } = await completedQuery;
    const totalCompleted = completedRequests?.length || 0;
    
    const totalLate = allRequests?.filter(req => 
      req.due_date && 
      new Date(req.due_date) < new Date()
    ).length || 0;

    const globalStats: GlobalStatistics = {
      totalUsers,
      totalPending,
      totalCompleted,
      totalLate
    };

    console.log("[GlobalStatistics] ✅ Statistiques globales calculées avec filtres:", globalStats);
    
    return globalStats;
  } catch (error) {
    console.error("[GlobalStatistics] 💥 Erreur:", error);
    throw error;
  }
};

/**
 * Service pour récupérer les statistiques des utilisateurs avec filtre de date
 */
export const fetchUserStatistics = async (dateRange?: DateRange | null): Promise<UserWithStats[]> => {
  try {
    console.log("[UserStatisticsService] 🚀 DÉMARRAGE avec filtre date:", dateRange);
    
    // 1. Récupérer tous les utilisateurs SDR et Growth
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar')
      .in('role', ['sdr', 'growth']);

    if (usersError) {
      console.error("[UserStatisticsService] ❌ Erreur users:", usersError);
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.warn("[UserStatisticsService] ⚠️ Aucun utilisateur trouvé");
      return [];
    }

    console.log(`[UserStatisticsService] 👥 ${users.length} utilisateurs récupérés`);

    // 2. Construire la requête de demandes avec filtre de date optionnel
    let requestsQuery = supabase.from('requests_with_missions').select('*');
    
    if (dateRange) {
      requestsQuery = requestsQuery
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
    }

    const { data: allRequests, error: requestsError } = await requestsQuery;

    if (requestsError) {
      console.error("[UserStatisticsService] ❌ Erreur requests:", requestsError);
      throw new Error(`Erreur récupération demandes: ${requestsError.message}`);
    }

    console.log(`[UserStatisticsService] 📋 ${allRequests?.length || 0} demandes récupérées avec filtres`);

    // 3. Calculer les demandes non assignées pour Growth
    const unassignedRequests = allRequests?.filter(req => 
      !req.assigned_to && 
      req.workflow_status !== 'completed' && 
      req.workflow_status !== 'canceled'
    ) || [];
    
    console.log(`[UserStatisticsService] 🔍 Demandes non assignées: ${unassignedRequests.length}`);

    // 4. Calculer les stats pour chaque utilisateur avec les données filtrées
    const usersWithStats: UserWithStats[] = users.map(user => {
      let userRequests;
      let stats;

      if (user.role === 'sdr') {
        userRequests = allRequests?.filter(req => req.created_by === user.id) || [];
        
        stats = {
          total: userRequests.length,
          pending: userRequests.filter(req => 
            req.workflow_status === 'pending_assignment' || 
            req.workflow_status === 'in_progress'
          ).length,
          completed: userRequests.filter(req => req.workflow_status === 'completed').length,
          late: userRequests.filter(req => 
            req.workflow_status !== 'completed' && 
            req.workflow_status !== 'canceled' &&
            req.due_date && 
            new Date(req.due_date) < new Date()
          ).length
        };
        
      } else {
        userRequests = allRequests?.filter(req => req.assigned_to === user.id) || [];
        
        stats = {
          total: userRequests.length,
          pending: userRequests.filter(req => 
            req.workflow_status === 'pending_assignment' || 
            req.workflow_status === 'in_progress'
          ).length,
          completed: userRequests.filter(req => req.workflow_status === 'completed').length,
          late: userRequests.filter(req => 
            req.workflow_status !== 'completed' && 
            req.workflow_status !== 'canceled' &&
            req.due_date && 
            new Date(req.due_date) < new Date()
          ).length,
          unassigned: unassignedRequests.length
        };
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'sdr' | 'growth' | 'admin',
        avatar: user.avatar,
        stats
      };
    });

    console.log("[UserStatisticsService] ✅ Statistiques calculées avec filtres date");
    
    return usersWithStats;
  } catch (error) {
    console.error("[UserStatisticsService] 💥 Erreur finale:", error);
    throw error;
  }
};

/**
 * Fonction de debug pour analyser les données - VERSION ULTRA CORRIGÉE
 */
export const debugUserStatistics = async (): Promise<void> => {
  try {
    console.log("🔧 === DEBUG STATISTIQUES UTILISATEUR - VERSION ULTRA CORRIGÉE ===");
    
    // Debug complet des demandes
    const { data: allRequests } = await supabase
      .from('requests_with_missions')
      .select('id, title, workflow_status, assigned_to, created_by, target_role, due_date');
    
    console.log(`🔍 ULTRA CORRIGÉ - Total demandes: ${allRequests?.length}`);
    
    // Analyser les demandes par statut
    const byStatus = allRequests?.reduce((acc, req) => {
      acc[req.workflow_status] = (acc[req.workflow_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("📊 Répartition par statut:", byStatus);
    
    // Demandes non assignées
    const unassignedRequests = allRequests?.filter(req => 
      !req.assigned_to && 
      req.workflow_status !== 'completed' && 
      req.workflow_status !== 'canceled'
    ) || [];
    
    console.log(`🔍 ULTRA CORRIGÉ - Demandes non assignées (actives): ${unassignedRequests.length}`);
    console.log("📋 Détail des demandes non assignées:", unassignedRequests.map(req => ({
      id: req.id,
      title: req.title,
      workflow_status: req.workflow_status,
      target_role: req.target_role
    })));
    
    // Demandes pending/in_progress par créateur (SDR)
    const { data: sdrUsers } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'sdr');
    
    console.log("📊 Demandes en attente par SDR:");
    sdrUsers?.forEach(sdr => {
      const sdrRequests = allRequests?.filter(req => req.created_by === sdr.id) || [];
      const pendingRequests = sdrRequests.filter(req => 
        req.workflow_status === 'pending_assignment' || 
        req.workflow_status === 'in_progress'
      );
      console.log(`  - ${sdr.name}: ${pendingRequests.length} en attente sur ${sdrRequests.length} total`);
    });
    
    // Demandes pending/in_progress par assigné (Growth)
    const { data: growthUsers } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'growth');
    
    console.log("📊 Demandes en attente par Growth:");
    growthUsers?.forEach(growth => {
      const growthRequests = allRequests?.filter(req => req.assigned_to === growth.id) || [];
      const pendingRequests = growthRequests.filter(req => 
        req.workflow_status === 'pending_assignment' || 
        req.workflow_status === 'in_progress'
      );
      console.log(`  - ${growth.name}: ${pendingRequests.length} en attente sur ${growthRequests.length} total`);
    });
    
    console.log("🔧 === FIN DEBUG ULTRA CORRIGÉ ===");
  } catch (error) {
    console.error("💥 Erreur debug:", error);
  }
};
