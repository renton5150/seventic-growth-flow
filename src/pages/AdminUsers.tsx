
import { useCallback, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserManagementTabs } from "@/components/admin/UserManagementTabs";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { invalidateUserCache } from "@/services/user/userQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fonction pour rafraîchir les données utilisateur - optimisée pour limiter les appels
  const refreshUserData = useCallback(() => {
    console.log("Rafraîchissement des données utilisateur depuis AdminUsers");
    
    try {
      // Invalider le cache local d'abord
      invalidateUserCache();
      
      // Toast pour indiquer le rafraichissement
      toast.info("Rafraîchissement des données...", {
        duration: 1000,
        position: "bottom-right"
      });
      
      // Mettre à jour la clé de rafraîchissement pour forcer la mise à jour des composants
      setRefreshKey(prev => prev + 1);
      
      // Utiliser une seule invalidation avec refetchType: 'all' pour forcer un re-fetch complet
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['users'],
          refetchType: 'all' 
        });
        
        // Garantir que les données admin-users sont aussi rafraîchies
        queryClient.invalidateQueries({ 
          queryKey: ['admin-users'],
          refetchType: 'all' 
        });
      }, 300);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
    }
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
        
        <UserManagementTabs 
          key={`user-management-${refreshKey}`} 
          onUserDataChange={refreshUserData} 
        />
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
