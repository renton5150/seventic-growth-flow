
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

// Fonction principale pour récupérer les statistiques utilisateur
export async function fetchUserStatistics(): Promise<UserWithStats[]> {
  try {
    console.log("🔍 DÉBUT RÉCUPÉRATION STATISTIQUES UTILISATEUR - VERSION CORRIGÉE 🔍");
    
    // Récupère tous les utilisateurs
    const users = await getAllUsers();
    console.log("Utilisateurs récupérés:", users.length, users);
    
    // Récupère toutes les demandes depuis la vue requests_with_missions
    const requests = await fetchRequests();
    console.log("Demandes récupérées:", requests.length, requests);
    
    // Calcule les statistiques pour chaque utilisateur
    const usersWithStats = users.map(user => {
      console.log(`\n📊 CALCUL STATS POUR ${user.name} (${user.role}) - ID: ${user.id.slice(0, 8)}`);
      
      let userRequests;
      
      // LOGIQUE CORRIGÉE : Filtrage selon le rôle de l'utilisateur
      if (user.role === "sdr") {
        // Pour les SDR, compter UNIQUEMENT les demandes qu'ils ont créées
        userRequests = requests.filter(req => req.createdBy === user.id);
        console.log(`SDR ${user.name}: ${userRequests.length} demandes créées`);
      } else if (user.role === "growth" || user.role === "admin") {
        // Pour les Growth et Admin, compter UNIQUEMENT les demandes qui leur sont assignées
        userRequests = requests.filter(req => req.assigned_to === user.id);
        console.log(`${user.role.toUpperCase()} ${user.name}: ${userRequests.length} demandes assignées`);
      } else {
        userRequests = [];
        console.log(`Rôle non reconnu pour ${user.name}: ${user.role}`);
      }
      
      // Log des demandes filtrées
      userRequests.forEach((req, idx) => {
        console.log(`  Demande ${idx + 1}: ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
      });
      
      // LOGIQUE CORRIGÉE : Calcule les statistiques
      const now = new Date();
      
      // Pending: demandes en attente d'assignation OU en cours
      const pendingRequests = userRequests.filter(req => {
        const isPending = req.workflow_status === "pending_assignment" || 
                         req.workflow_status === "in_progress" ||
                         req.status === "pending";
        if (isPending) {
          console.log(`  📋 Pending: ${req.title} (workflow: ${req.workflow_status}, status: ${req.status})`);
        }
        return isPending;
      });
      
      // Completed: demandes terminées
      const completedRequests = userRequests.filter(req => {
        const isCompleted = req.workflow_status === "completed";
        if (isCompleted) {
          console.log(`  ✅ Completed: ${req.title} (workflow: ${req.workflow_status})`);
        }
        return isCompleted;
      });
      
      // Late: demandes en retard (actives avec due_date dépassée)
      const lateRequests = userRequests.filter(req => {
        const isActive = req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
        const isLate = req.isLate || (req.dueDate && new Date(req.dueDate) < now);
        const isActuallyLate = isActive && isLate;
        
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

      console.log(`📊 Stats finales pour ${user.name}:`, stats);
      
      return {
        ...user,
        stats
      };
    });
    
    console.log("🎯 STATISTIQUES FINALES:", usersWithStats);
    return usersWithStats;
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques:", error);
    throw error;
  }
}

// Fonction de debug pour vérifier les données brutes
export async function debugUserStatistics() {
  console.log("🔧 DÉBUT DEBUG MANUEL DES STATISTIQUES 🔧");
  
  try {
    const users = await getAllUsers();
    const requests = await fetchRequests();
    
    console.log("=== DONNÉES BRUTES ===");
    console.log("Utilisateurs:", users);
    console.log("Demandes:", requests);
    
    console.log("=== ANALYSE PAR UTILISATEUR ===");
    users.forEach(user => {
      console.log(`\n--- ${user.name} (${user.role}) ---`);
      
      if (user.role === "sdr") {
        // Demandes créées par l'utilisateur
        const createdRequests = requests.filter(req => req.createdBy === user.id);
        console.log(`Demandes créées: ${createdRequests.length}`);
        createdRequests.forEach(req => {
          console.log(`  - ${req.title} (${req.workflow_status})`);
        });
      } else if (user.role === "growth" || user.role === "admin") {
        // Demandes assignées à l'utilisateur
        const assignedRequests = requests.filter(req => req.assigned_to === user.id);
        console.log(`Demandes assignées: ${assignedRequests.length}`);
        assignedRequests.forEach(req => {
          console.log(`  - ${req.title} (${req.workflow_status})`);
        });
      }
    });
    
  } catch (error) {
    console.error("Erreur debug:", error);
  }
}
