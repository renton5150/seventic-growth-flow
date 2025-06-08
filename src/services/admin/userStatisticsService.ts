
import { supabase } from "@/integrations/supabase/client";
import { getAllUsers } from "@/services/user/userQueries";
import { fetchRequests } from "@/services/requests/requestQueryService";

// Interface pour les statistiques utilisateur
export interface UserStatistics {
  total: number;
  pending: number;
  completed: number;
  late: number;
}

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  stats: UserStatistics;
}

// Fonction principale pour récupérer les statistiques utilisateur - LOGIQUE VRAIMENT CORRIGÉE
export async function fetchUserStatistics(): Promise<UserWithStats[]> {
  try {
    console.log("🔍 DÉBUT RÉCUPÉRATION STATISTIQUES UTILISATEUR - LOGIQUE VRAIMENT CORRIGÉE 🔍");
    
    // Récupère tous les utilisateurs
    const users = await getAllUsers();
    console.log("✅ Utilisateurs récupérés:", users.length, users);
    
    // Récupère toutes les demandes depuis la vue requests_with_missions
    const requests = await fetchRequests();
    console.log("✅ Demandes récupérées:", requests.length, requests);
    
    // Calcule les statistiques pour chaque utilisateur avec la LOGIQUE VRAIMENT CORRIGÉE
    const usersWithStats = users.map(user => {
      console.log(`\n📊 CALCUL STATS VRAIMENT CORRIGÉ POUR ${user.name} (${user.role}) - ID: ${user.id.slice(0, 8)}`);
      
      let userRequests;
      
      // LOGIQUE VRAIMENT CORRIGÉE : Filtrage strict selon le rôle de l'utilisateur
      if (user.role === "sdr") {
        // Pour les SDR, compter UNIQUEMENT les demandes qu'ils ont créées
        userRequests = requests.filter(req => req.createdBy === user.id);
        console.log(`✅ SDR ${user.name}: ${userRequests.length} demandes créées par lui`);
      } else if (user.role === "growth" || user.role === "admin") {
        // Pour les Growth et Admin, compter UNIQUEMENT les demandes qui leur sont assignées
        userRequests = requests.filter(req => req.assigned_to === user.id);
        console.log(`✅ ${user.role.toUpperCase()} ${user.name}: ${userRequests.length} demandes assignées à lui`);
      } else {
        userRequests = [];
        console.log(`⚠️ Rôle non reconnu pour ${user.name}: ${user.role}`);
      }
      
      // Log des demandes filtrées pour vérification
      userRequests.forEach((req, idx) => {
        console.log(`  📋 Demande ${idx + 1}: ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
      });
      
      // LOGIQUE VRAIMENT CORRIGÉE : Calcule les statistiques avec les VRAIES règles
      const now = new Date();
      
      // Completed: demandes avec workflow_status "completed" UNIQUEMENT
      const completedRequests = userRequests.filter(req => {
        const isCompleted = req.workflow_status === "completed";
        if (isCompleted) {
          console.log(`  ✅ Completed: ${req.title} (workflow: ${req.workflow_status})`);
        }
        return isCompleted;
      });
      
      // Pending: demandes avec workflow_status "pending_assignment" OU "in_progress" MAIS PAS "completed"
      const pendingRequests = userRequests.filter(req => {
        const isPending = (req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress") && req.workflow_status !== "completed";
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

      console.log(`📊 STATISTIQUES VRAIMENT CORRIGÉES pour ${user.name}:`, stats);
      console.log(`📊 VÉRIFICATION: Total=${stats.total}, Pending=${stats.pending}, Completed=${stats.completed}, Late=${stats.late}`);
      
      return {
        ...user,
        stats
      };
    });
    
    console.log("🎯 STATISTIQUES VRAIMENT CORRIGÉES:", usersWithStats);
    return usersWithStats;
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques:", error);
    throw error;
  }
}

// Fonction de debug pour vérifier les données brutes
export async function debugUserStatistics() {
  console.log("🔧 DÉBUT DEBUG MANUEL DES STATISTIQUES VRAIMENT CORRIGÉES 🔧");
  
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
        const pendingCreated = createdRequests.filter(req => (req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress") && req.workflow_status !== "completed");
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
        const pendingAssigned = assignedRequests.filter(req => (req.workflow_status === "pending_assignment" || req.workflow_status === "in_progress") && req.workflow_status !== "completed");
        const completedAssigned = assignedRequests.filter(req => req.workflow_status === "completed");
        const lateAssigned = assignedRequests.filter(req => req.workflow_status !== 'completed' && req.workflow_status !== 'canceled' && (req.isLate || (req.dueDate && new Date(req.dueDate) < new Date())));
        
        console.log(`  - Pending: ${pendingAssigned.length}`);
        console.log(`  - Completed: ${completedAssigned.length}`);
        console.log(`  - Late: ${lateAssigned.length}`);
        
        assignedRequests.forEach(req => {
          console.log(`  - ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
        });
      }
    });
    
  } catch (error) {
    console.error("Erreur debug:", error);
  }
}
