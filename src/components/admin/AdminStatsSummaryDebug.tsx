
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";
import { getAllUsers } from "@/services/userService";

export const AdminStatsSummaryDebug = () => {
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin-requests-debug'],
    queryFn: async () => {
      console.log("🔍 DÉBUT DEBUG STATISTIQUES ADMIN 🔍");
      const allRequests = await fetchRequests();
      console.log("Source des données brutes:", allRequests);
      
      // Log détaillé de chaque demande
      allRequests.forEach((req, index) => {
        console.log(`Demande ${index + 1}:`, {
          id: req.id,
          title: req.title,
          status: req.status,
          workflow_status: req.workflow_status,
          created_by: req.createdBy,
          assigned_to: req.assigned_to,
          due_date: req.dueDate,
          is_late: req.isLate
        });
      });
      
      return allRequests;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-debug'],
    queryFn: async () => {
      const allUsers = await getAllUsers();
      console.log("Utilisateurs récupérés:", allUsers);
      return allUsers;
    }
  });

  // Fonction de vérification des statistiques
  const verifyStatistics = (users: any[], rawRequests: any[]) => {
    console.log("📊 VÉRIFICATION MANUELLE DES STATISTIQUES 📊");
    
    users.forEach(user => {
      console.log(`\n--- Analyse pour ${user.name} (${user.role}) ---`);
      
      // Filtrer les demandes selon le rôle
      let userRequests;
      if (user.role === 'sdr') {
        // SDR: demandes qu'il a créées
        userRequests = rawRequests.filter(req => req.createdBy === user.id);
        console.log(`SDR ${user.name}: ${userRequests.length} demandes créées`);
      } else if (user.role === 'growth') {
        // Growth: demandes qui lui sont assignées
        userRequests = rawRequests.filter(req => req.assigned_to === user.id);
        console.log(`Growth ${user.name}: ${userRequests.length} demandes assignées`);
      } else {
        // Admin: toutes les demandes assignées
        userRequests = rawRequests.filter(req => req.assigned_to === user.id);
        console.log(`Admin ${user.name}: ${userRequests.length} demandes assignées`);
      }
      
      // Calculer les statistiques manuellement
      const now = new Date();
      const manualStats = {
        total: userRequests.length,
        pending: userRequests.filter(req => 
          req.workflow_status === "pending_assignment" || req.status === "pending"
        ).length,
        completed: userRequests.filter(req => 
          req.workflow_status === "completed"
        ).length,
        late: userRequests.filter(req => {
          const isActive = req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
          const isLate = req.isLate || (req.dueDate && new Date(req.dueDate) < now);
          return isActive && isLate;
        }).length,
      };
      
      console.log(`Statistiques calculées pour ${user.name}:`, manualStats);
      
      // Afficher les demandes par statut
      const pendingReqs = userRequests.filter(req => 
        req.workflow_status === "pending_assignment" || req.status === "pending"
      );
      const completedReqs = userRequests.filter(req => 
        req.workflow_status === "completed"
      );
      const lateReqs = userRequests.filter(req => {
        const isActive = req.workflow_status !== 'completed' && req.workflow_status !== 'canceled';
        const isLate = req.isLate || (req.dueDate && new Date(req.dueDate) < now);
        return isActive && isLate;
      });
      
      console.log(`Détail des demandes pour ${user.name}:`, {
        pending: pendingReqs.map(r => ({ id: r.id, title: r.title, status: r.status, workflow: r.workflow_status })),
        completed: completedReqs.map(r => ({ id: r.id, title: r.title, status: r.status, workflow: r.workflow_status })),
        late: lateReqs.map(r => ({ id: r.id, title: r.title, due_date: r.dueDate, is_late: r.isLate }))
      });
    });
  };

  // Exécuter la vérification si les données sont disponibles
  if (!isLoadingRequests && requests.length > 0 && users.length > 0) {
    verifyStatistics(users, requests);
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Debug des statistiques administrateur</h3>
      <p className="text-sm text-gray-600">
        Vérifiez la console pour voir l'analyse détaillée des statistiques.
      </p>
      <div className="mt-2 space-y-1 text-xs">
        <div>Total demandes: {requests.length}</div>
        <div>Total utilisateurs: {users.length}</div>
        <div>Loading: {isLoadingRequests ? 'Oui' : 'Non'}</div>
      </div>
    </div>
  );
};
