
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
  
  // Nettoyer les opérations en cours lors du démontage
  useEffect(() => {
    return () => {
      console.log("AdminUsers unmounting - nettoyage des opérations en cours");
      setIsRefreshing(false);
    };
  }, []);
  
  // Fonction optimisée pour rafraîchir les données
  const refreshUserData = useCallback(() => {
    if (isRefreshing) {
      console.log("Refresh déjà en cours, ignoré");
      return;
    }
    
    console.log("Rafraîchissement des données utilisateur depuis AdminUsers");
    setIsRefreshing(true);
    
    try {
      // Invalider le cache local
      invalidateUserCache();
      
      // Toast pour indiquer le rafraichissement
      const toastId = toast.loading("Rafraîchissement des données...", {
        duration: 1500,
        position: "bottom-right"
      });
      
      // Mettre à jour la clé de rafraîchissement
      setRefreshKey(prev => prev + 1);
      
      // Invalider les requêtes avec un délai pour éviter les problèmes de concurrence
      setTimeout(() => {
        // Invalider les requêtes utilisateurs
        queryClient.invalidateQueries({ 
          queryKey: ['users'],
          refetchType: 'all' 
        });
        
        // Invalider spécifiquement les données admin-users
        queryClient.invalidateQueries({ 
          queryKey: ['admin-users'],
          refetchType: 'all'
        });
        
        // Attendre que les données soient rechargées
        setTimeout(() => {
          toast.success("Données rafraîchies", { id: toastId });
          setIsRefreshing(false);
        }, 500);
      }, 200);
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
