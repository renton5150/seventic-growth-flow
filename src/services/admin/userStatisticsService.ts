
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
 * Service pour récupérer les statistiques globales - VERSION CORRIGÉE
 */
export const fetchGlobalStatistics = async (): Promise<GlobalStatistics> => {
  try {
    console.log("[GlobalStatistics] 🚀 Récupération des statistiques globales - VERSION CORRIGÉE");
    
    // 1. Récupérer tous les utilisateurs actifs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['sdr', 'growth', 'admin']);

    if (usersError) {
      console.error("[GlobalStatistics] ❌ Erreur users:", usersError);
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    // 2. Récupérer toutes les demandes ACTIVES (non complétées, non annulées)
    const { data: allRequests, error: requestsError } = await supabase
      .from('requests_with_missions')
      .select('workflow_status, due_date, assigned_to, created_by')
      .not('workflow_status', 'in', '(completed,canceled)'); // Exclure les complétées et annulées

    if (requestsError) {
      console.error("[GlobalStatistics] ❌ Erreur requests:", requestsError);
      throw new Error(`Erreur récupération demandes: ${requestsError.message}`);
    }

    console.log(`[GlobalStatistics] 📊 ${allRequests?.length || 0} demandes actives trouvées`);

    // 3. Calculer les statistiques globales basées sur les demandes ACTIVES uniquement
    const totalUsers = users?.length || 0;
    
    // Demandes en attente = pending_assignment OU in_progress
    const totalPending = allRequests?.filter(req => 
      req.workflow_status === 'pending_assignment' || 
      req.workflow_status === 'in_progress'
    ).length || 0;
    
    // Demandes terminées = celles avec workflow_status 'completed' (mais on les a exclues de la requête)
    // Donc on va les récupérer séparément
    const { data: completedRequests } = await supabase
      .from('requests_with_missions')
      .select('id')
      .eq('workflow_status', 'completed');
    
    const totalCompleted = completedRequests?.length || 0;
    
    // Demandes en retard = demandes actives avec due_date dépassée
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

    console.log("[GlobalStatistics] ✅ Statistiques globales calculées (VERSION CORRIGÉE):", globalStats);
    
    return globalStats;
  } catch (error) {
    console.error("[GlobalStatistics] 💥 Erreur:", error);
    throw error;
  }
};

/**
 * Service pour récupérer les statistiques des utilisateurs - VERSION ULTRA CORRIGÉE
 */
export const fetchUserStatistics = async (): Promise<UserWithStats[]> => {
  try {
    console.log("[UserStatisticsService] 🚀 DÉMARRAGE ULTRA CORRIGÉ - Récupération des statistiques utilisateur");
    
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

    // 3. CALCUL CORRIGÉ : Demandes non assignées (pour Growth)
    const unassignedRequests = allRequests?.filter(req => 
      !req.assigned_to && 
      req.workflow_status !== 'completed' && 
      req.workflow_status !== 'canceled'
    ) || [];
    
    console.log(`[UserStatisticsService] 🔍 ULTRA CORRIGÉ - Demandes non assignées: ${unassignedRequests.length}`);

    // 4. Calculer les stats pour chaque utilisateur - LOGIQUE ULTRA CORRIGÉE
    const usersWithStats: UserWithStats[] = users.map(user => {
      let userRequests;
      let stats;

      if (user.role === 'sdr') {
        // Pour SDR : demandes créées par eux (TOUTES, y compris complétées)
        userRequests = allRequests?.filter(req => req.created_by === user.id) || [];
        
        // Calcul CORRIGÉ pour SDR
        stats = {
          total: userRequests.length,
          // En attente = demandes créées par le SDR qui sont pending_assignment OU in_progress
          pending: userRequests.filter(req => 
            req.workflow_status === 'pending_assignment' || 
            req.workflow_status === 'in_progress'
          ).length,
          completed: userRequests.filter(req => req.workflow_status === 'completed').length,
          // En retard = demandes créées par le SDR qui ne sont pas complétées ET ont due_date dépassée
          late: userRequests.filter(req => 
            req.workflow_status !== 'completed' && 
            req.workflow_status !== 'canceled' &&
            req.due_date && 
            new Date(req.due_date) < new Date()
          ).length
        };
        
        console.log(`[UserStatisticsService] 📊 SDR ${user.name} - ULTRA CORRIGÉ:`, {
          total: stats.total,
          pending: stats.pending,
          completed: stats.completed,
          late: stats.late,
          'pending_requests_details': userRequests.filter(req => 
            req.workflow_status === 'pending_assignment' || 
            req.workflow_status === 'in_progress'
          ).map(req => ({ id: req.id, title: req.title, workflow_status: req.workflow_status }))
        });
        
      } else {
        // Pour Growth : demandes assignées à eux
        userRequests = allRequests?.filter(req => req.assigned_to === user.id) || [];
        
        // Calcul CORRIGÉ pour Growth
        stats = {
          total: userRequests.length,
          // En attente = demandes assignées au Growth qui sont pending_assignment OU in_progress
          pending: userRequests.filter(req => 
            req.workflow_status === 'pending_assignment' || 
            req.workflow_status === 'in_progress'
          ).length,
          completed: userRequests.filter(req => req.workflow_status === 'completed').length,
          // En retard = demandes assignées au Growth qui ne sont pas complétées ET ont due_date dépassée
          late: userRequests.filter(req => 
            req.workflow_status !== 'completed' && 
            req.workflow_status !== 'canceled' &&
            req.due_date && 
            new Date(req.due_date) < new Date()
          ).length,
          unassigned: unassignedRequests.length // MÊME NOMBRE pour tous les Growth
        };
        
        console.log(`[UserStatisticsService] 📊 Growth ${user.name} - ULTRA CORRIGÉ:`, {
          total: stats.total,
          pending: stats.pending,
          completed: stats.completed,
          late: stats.late,
          unassigned: stats.unassigned,
          'pending_requests_details': userRequests.filter(req => 
            req.workflow_status === 'pending_assignment' || 
            req.workflow_status === 'in_progress'
          ).map(req => ({ id: req.id, title: req.title, workflow_status: req.workflow_status }))
        });
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

    console.log("[UserStatisticsService] ✅ ULTRA CORRIGÉ - Statistiques calculées pour tous les utilisateurs");
    
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
