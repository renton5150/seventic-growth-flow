
import { useCallback, useState, useEffect } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Clean up any pending operations when component unmounts
  useEffect(() => {
    return () => {
      console.log("AdminUsers unmounting - nettoyage des opérations en cours");
      setIsRefreshing(false);
    };
  }, []);
  
  // Optimized refresh function with debounce
  const refreshUserData = useCallback(() => {
    if (isRefreshing) {
      console.log("Refresh déjà en cours, ignoré");
      return;
    }
    
    console.log("Rafraîchissement des données utilisateur depuis AdminUsers");
    setIsRefreshing(true);
    
    try {
      // Invalider le cache local d'abord
      invalidateUserCache();
      
      // Toast pour indiquer le rafraichissement
      const toastId = toast.loading("Rafraîchissement des données...", {
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
        
        // Assez de temps pour que les données soient rechargées
        setTimeout(() => {
          toast.success("Données rafraîchies", { id: toastId });
          setIsRefreshing(false);
        }, 500);
      }, 300);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      setIsRefreshing(false);
      toast.error("Erreur lors du rafraîchissement");
    }
  }, [queryClient, isRefreshing]);
  
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
