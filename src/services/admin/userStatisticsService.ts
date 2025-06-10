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

/**
 * Service pour récupérer les statistiques globales
 */
export const fetchGlobalStatistics = async (): Promise<GlobalStatistics> => {
  try {
    console.log("[GlobalStatistics] 🚀 Récupération des statistiques globales");
    
    // 1. Récupérer tous les utilisateurs actifs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['sdr', 'growth', 'admin']);

    if (usersError) {
      console.error("[GlobalStatistics] ❌ Erreur users:", usersError);
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    // 2. Récupérer toutes les demandes
    const { data: allRequests, error: requestsError } = await supabase
      .from('requests_with_missions')
      .select('workflow_status, due_date');

    if (requestsError) {
      console.error("[GlobalStatistics] ❌ Erreur requests:", requestsError);
      throw new Error(`Erreur récupération demandes: ${requestsError.message}`);
    }

    // 3. Calculer les statistiques globales
    const totalUsers = users?.length || 0;
    
    const totalPending = allRequests?.filter(req => 
      req.workflow_status === 'pending_assignment' || 
      req.workflow_status === 'in_progress'
    ).length || 0;
    
    const totalCompleted = allRequests?.filter(req => 
      req.workflow_status === 'completed'
    ).length || 0;
    
    const totalLate = allRequests?.filter(req => 
      req.workflow_status !== 'completed' && 
      req.workflow_status !== 'canceled' &&
      req.due_date && 
      new Date(req.due_date) < new Date()
    ).length || 0;

    const globalStats: GlobalStatistics = {
      totalUsers,
      totalPending,
      totalCompleted,
      totalLate
    };

    console.log("[GlobalStatistics] ✅ Statistiques globales calculées:", globalStats);
    
    return globalStats;
  } catch (error) {
    console.error("[GlobalStatistics] 💥 Erreur:", error);
    throw error;
  }
};

/**
 * Service pour récupérer les statistiques des utilisateurs - VERSION FINALE CORRIGÉE
 */
export const fetchUserStatistics = async (): Promise<UserWithStats[]> => {
  try {
    console.log("[UserStatisticsService] 🚀 DÉMARRAGE FINAL CORRIGÉ - Récupération des statistiques utilisateur");
    
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

    console.log(`[UserStatisticsService] 👥 ${users.length} utilisateurs récupérés:`, users.map(u => ({ name: u.name, role: u.role })));

    // 2. Récupérer TOUTES les demandes avec les détails
    const { data: allRequests, error: requestsError } = await supabase
      .from('requests_with_missions')
      .select('*');

    if (requestsError) {
      console.error("[UserStatisticsService] ❌ Erreur requests:", requestsError);
      throw new Error(`Erreur récupération demandes: ${requestsError.message}`);
    }

    console.log(`[UserStatisticsService] 📋 ${allRequests?.length || 0} demandes récupérées au total`);

    // 3. CORRECTION CRITIQUE : Filtrer correctement les demandes non assignées
    const unassignedRequests = allRequests?.filter(req => 
      !req.assigned_to && 
      req.workflow_status !== 'completed' && 
      req.workflow_status !== 'canceled'
    ) || [];
    
    console.log(`[UserStatisticsService] 🔍 CORRECTION FINALE - Demandes non assignées: ${unassignedRequests.length}`);
    console.log("[UserStatisticsService] 📊 Détail des demandes non assignées:", 
      unassignedRequests.map(req => ({
        id: req.id,
        title: req.title,
        workflow_status: req.workflow_status,
        assigned_to: req.assigned_to
      }))
    );

    // 4. Calculer les stats pour chaque utilisateur
    const usersWithStats: UserWithStats[] = users.map(user => {
      let userRequests;
      let stats;

      if (user.role === 'sdr') {
        // Pour SDR : demandes créées par eux
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
        // Pour Growth : demandes assignées à eux
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
          unassigned: unassignedRequests.length // MÊME NOMBRE pour tous les Growth
        };
      }

      console.log(`[UserStatisticsService] 📊 Stats pour ${user.name} (${user.role}):`, stats);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'sdr' | 'growth' | 'admin',
        avatar: user.avatar,
        stats
      };
    });

    console.log("[UserStatisticsService] ✅ FINAL CORRIGÉ - Statistiques calculées pour tous les utilisateurs");
    
    return usersWithStats;
  } catch (error) {
    console.error("[UserStatisticsService] 💥 Erreur finale:", error);
    throw error;
  }
};

/**
 * Fonction de debug pour analyser les données - VERSION FINALE CORRIGÉE
 */
export const debugUserStatistics = async (): Promise<void> => {
  try {
    console.log("🔧 === DEBUG STATISTIQUES UTILISATEUR - VERSION FINALE CORRIGÉE ===");
    
    // Debug des demandes non assignées
    const { data: allRequests } = await supabase
      .from('requests_with_missions')
      .select('id, title, workflow_status, assigned_to, created_by, target_role');
    
    const unassignedRequests = allRequests?.filter(req => 
      !req.assigned_to && 
      req.workflow_status !== 'completed' && 
      req.workflow_status !== 'canceled'
    ) || [];
    
    console.log(`🔍 FINAL CORRIGÉ - Total demandes: ${allRequests?.length}`);
    console.log(`🔍 FINAL CORRIGÉ - Demandes non assignées (actives): ${unassignedRequests.length}`);
    
    console.log("📋 Détail des demandes non assignées:", unassignedRequests.map(req => ({
      id: req.id,
      title: req.title,
      workflow_status: req.workflow_status,
      assigned_to: req.assigned_to,
      target_role: req.target_role
    })));
    
    console.log("🔧 === FIN DEBUG FINAL CORRIGÉ ===");
  } catch (error) {
    console.error("💥 Erreur debug:", error);
  }
};
