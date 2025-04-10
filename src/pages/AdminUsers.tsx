
import { useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserManagementTabs } from "@/components/admin/UserManagementTabs";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { invalidateUserCache } from "@/services/user/userQueries";
import { useQueryClient } from "@tanstack/react-query";

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  // Fonction pour rafraîchir les données utilisateur - optimisée pour limiter les appels
  const refreshUserData = useCallback(() => {
    console.log("Rafraîchissement des données utilisateur depuis AdminUsers");
    
    // Invalider le cache local d'abord
    invalidateUserCache();
    
    // Utiliser une seule invalidation avec refetchType: 'inactive' pour éviter les requêtes multiples simultanées
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['users'],
        refetchType: 'all' 
      });
    }, 50);
  }, [queryClient]);
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
        
        <UserManagementTabs onUserDataChange={refreshUserData} />
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
