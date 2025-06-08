
import { supabase } from "@/integrations/supabase/client";
import { getAllUsers } from "@/services/user/userQueries";
import { fetchRequests } from "@/services/requests/requestQueryService";

// Interface pour les statistiques utilisateur
export interface UserStatistics {
  total: number;
  pending: number;
  completed: number;
  late: number;
  unassigned?: number; // Nouveau champ pour les demandes non assignées
}

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  stats: UserStatistics;
}

// Fonction principale pour récupérer les statistiques utilisateur - LOGIQUE FINALE CORRIGÉE
export async function fetchUserStatistics(): Promise<UserWithStats[]> {
  try {
    console.log("🔍 DÉBUT RÉCUPÉRATION STATISTIQUES UTILISATEUR - LOGIQUE FINALE CORRIGÉE 🔍");
    
    // Récupère tous les utilisateurs
    const users = await getAllUsers();
    console.log("✅ Utilisateurs récupérés:", users.length, users);
    
    // Récupère toutes les demandes depuis la vue requests_with_missions
    const requests = await fetchRequests();
    console.log("✅ Demandes récupérées:", requests.length, requests);
    
    // Calcule les statistiques pour chaque utilisateur avec la LOGIQUE FINALE CORRIGÉE
    const usersWithStats = users.map(user => {
      console.log(`\n📊 CALCUL STATS FINAL CORRIGÉ POUR ${user.name} (${user.role}) - ID: ${user.id.slice(0, 8)}`);
      
      let userRequests;
      
      // LOGIQUE FINALE CORRIGÉE : Filtrage strict selon le rôle de l'utilisateur
      if (user.role === "sdr") {
        // Pour les SDR, compter UNIQUEMENT les demandes qu'ils ont créées
        userRequests = requests.filter(req => req.createdBy === user.id);
        console.log(`✅ SDR ${user.name}: ${userRequests.length} demandes créées par lui`);
      } else if (user.role === "growth" || user.role === "admin") {
        // Pour les Growth et Admin, compter UNIQUEMENT les demandes qui leur sont assignées
        userRequests = requests.filter(req => req.assigned_to === user.id);
        console.log(`✅ ${user.role.toUpperCase()} ${user.name}: ${userRequests.length} demandes assignées à lui`);
        
        // Pour Growth, calculer aussi les demandes non assignées
        if (user.role === "growth") {
          const unassignedRequests = requests.filter(req => !req.assigned_to || req.assigned_to === null);
          console.log(`📋 Growth ${user.name}: ${unassignedRequests.length} demandes non assignées`);
        }
      } else {
        userRequests = [];
        console.log(`⚠️ Rôle non reconnu pour ${user.name}: ${user.role}`);
      }
      
      // Log des demandes filtrées pour vérification
      userRequests.forEach((req, idx) => {
        console.log(`  📋 Demande ${idx + 1}: ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
      });
      
      // LOGIQUE FINALE CORRIGÉE : Calcule les statistiques avec les VRAIES règles
      const now = new Date();
      
      // Completed: demandes avec workflow_status "completed" UNIQUEMENT
      const completedRequests = userRequests.filter(req => {
        const isCompleted = req.workflow_status === "completed";
        if (isCompleted) {
          console.log(`  ✅ Completed: ${req.title} (workflow: ${req.workflow_status})`);
        }
        return isCompleted;
      });
      
      // Pending: demandes avec workflow_status "pending_assignment" OU "in_progress" 
      const pendingRequests = userRequests.filter(req => {
        const isPending = req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress";
        if (isPending) {
          console.log(`  📋 Pending: ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
        }
        return isPending;
      });
      
      // Late: demandes actives (pas completed) avec due_date dépassée
      const lateRequests = userRequests.filter(req => {
        const isNotCompleted = req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
        const isLate = req.isLate || (req.dueDate && new Date(req.dueDate) < now);
        const isActuallyLate = isNotCompleted && isLate;
        
        if (isActuallyLate) {
          console.log(`  ⚠️ Late: ${req.title} (due: ${req.dueDate}, workflow: ${req.workflow_status})`);
        }
        return isActuallyLate;
      });
      
      const stats: UserStatistics = {
        total: userRequests.length,
        pending: pendingRequests.length,
        completed: completedRequests.length,
        late: lateRequests.length,
      };

      // Pour les Growth, ajouter les demandes non assignées
      if (user.role === "growth") {
        const unassignedRequests = requests.filter(req => !req.assigned_to || req.assigned_to === null);
        stats.unassigned = unassignedRequests.length;
      }

      console.log(`📊 STATISTIQUES FINALES CORRIGÉES pour ${user.name}:`, stats);
      console.log(`📊 VÉRIFICATION: Total=${stats.total}, Pending=${stats.pending}, Completed=${stats.completed}, Late=${stats.late}${stats.unassigned ? `, Unassigned=${stats.unassigned}` : ''}`);
      
      return {
        ...user,
        stats
      };
    });
    
    console.log("🎯 STATISTIQUES FINALES CORRIGÉES:", usersWithStats);
    return usersWithStats;
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques:", error);
    throw error;
  }
}

// Fonction pour récupérer les statistiques globales CORRIGÉES
export async function fetchGlobalStatistics() {
  try {
    console.log("🌍 CALCUL STATISTIQUES GLOBALES CORRIGÉES");
    
    const users = await getAllUsers();
    const requests = await fetchRequests();
    
    // Compter uniquement les utilisateurs actifs (pas les admins purs)
    const activeUsers = users.filter(user => user.role === 'sdr' || user.role === 'growth');
    
    // Compter les demandes selon les VRAIES règles
    const pendingRequests = requests.filter(req => 
      req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress"
    );
    
    const completedRequests = requests.filter(req => 
      req.workflow_status === "completed"
    );
    
    const now = new Date();
    const lateRequests = requests.filter(req => {
      const isNotCompleted = req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
      const isLate = req.isLate || (req.dueDate && new Date(req.dueDate) < now);
      return isNotCompleted && isLate;
    });
    
    const stats = {
      totalUsers: activeUsers.length,
      totalPending: pendingRequests.length,
      totalCompleted: completedRequests.length,
      totalLate: lateRequests.length,
    };
    
    console.log("🌍 STATISTIQUES GLOBALES CORRIGÉES:", stats);
    return stats;
    
  } catch (error) {
    console.error("❌ Erreur stats globales:", error);
    throw error;
  }
}

// Fonction de debug pour vérifier les données brutes
export async function debugUserStatistics() {
  console.log("🔧 DÉBUT DEBUG MANUEL DES STATISTIQUES CORRIGÉES 🔧");
  
  try {
    const users = await getAllUsers();
    const requests = await fetchRequests();
    
    console.log("=== DONNÉES BRUTES ===");
    console.log("Utilisateurs:", users);
    console.log("Demandes:", requests);
    
    console.log("=== ANALYSE DÉTAILLÉE PAR UTILISATEUR ===");
    users.forEach(user => {
      console.log(`\n--- ${user.name} (${user.role}) ---`);
      
      if (user.role === "sdr") {
        // Demandes créées par l'utilisateur SDR
        const createdRequests = requests.filter(req => req.createdBy === user.id);
        console.log(`Demandes créées: ${createdRequests.length}`);
        
        // Analyse par statut
        const pendingCreated = createdRequests.filter(req => req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress");
        const completedCreated = createdRequests.filter(req => req.workflow_status === "completed");
        const lateCreated = createdRequests.filter(req => req.workflow_status !== 'completed' && req.workflow_status !== 'canceled' && (req.isLate || (req.dueDate && new Date(req.dueDate) < new Date())));
        
        console.log(`  - Pending: ${pendingCreated.length}`);
        console.log(`  - Completed: ${completedCreated.length}`);
        console.log(`  - Late: ${lateCreated.length}`);
        
        createdRequests.forEach(req => {
          console.log(`  - ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
        });
      } else if (user.role === "growth" || user.role === "admin") {
        // Demandes assignées à l'utilisateur Growth/Admin
        const assignedRequests = requests.filter(req => req.assigned_to === user.id);
        console.log(`Demandes assignées: ${assignedRequests.length}`);
        
        // Analyse par statut
        const pendingAssigned = assignedRequests.filter(req => req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress");
        const completedAssigned = assignedRequests.filter(req => req.workflow_status === "completed");
        const lateAssigned = assignedRequests.filter(req => req.workflow_status !== 'completed' && req.workflow_status !== 'canceled' && (req.isLate || (req.dueDate && new Date(req.dueDate) < new Date())));
        
        console.log(`  - Pending: ${pendingAssigned.length}`);
        console.log(`  - Completed: ${completedAssigned.length}`);
        console.log(`  - Late: ${lateAssigned.length}`);
        
        if (user.role === "growth") {
          const unassignedRequests = requests.filter(req => !req.assigned_to || req.assigned_to === null);
          console.log(`  - Non assignées: ${unassignedRequests.length}`);
        }
        
        assignedRequests.forEach(req => {
          console.log(`  - ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
        });
      }
    });
    
  } catch (error) {
    console.error("Erreur debug:", error);
  }
}
