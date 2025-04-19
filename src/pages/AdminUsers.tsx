
import { useCallback, useState, useRef } from "react";
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
  const isRefreshingRef = useRef(false);
  
  // Fonction optimisée pour rafraîchir les données avec un debounce intégré
  const refreshUserData = useCallback(() => {
    // Vérifier si un rafraîchissement est déjà en cours avec la référence
    if (isRefreshingRef.current) {
      console.log("Refresh déjà en cours, ignoré");
      return;
    }
    
    console.log("Rafraîchissement des données utilisateur depuis AdminUsers");
    isRefreshingRef.current = true;
    
    try {
      // Invalider le cache local
      invalidateUserCache();
      
      // Toast discret pour indiquer le rafraichissement
      const toastId = toast.loading("Rafraîchissement...", {
        duration: 1000,
        position: "bottom-right"
      });
      
      // Mettre à jour la clé de rafraîchissement
      setRefreshKey(prev => prev + 1);
      
      // Invalider les requêtes avec un délai pour éviter les problèmes de concurrence
      setTimeout(() => {
        // Invalider les requêtes utilisateurs
        queryClient.invalidateQueries({ 
          queryKey: ['users']
        });
        
        // Invalider spécifiquement les données admin-users
        queryClient.invalidateQueries({ 
          queryKey: ['admin-users']
        });
        
        toast.success("Données rafraîchies", { 
          id: toastId,
          duration: 1000
        });
        
        // Réinitialiser l'état de rafraîchissement après une période suffisante
        setTimeout(() => {
          isRefreshingRef.current = false;
        }, 1500); // Attendre 1.5 secondes avant de permettre un nouveau rafraîchissement
      }, 200);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      isRefreshingRef.current = false;
      toast.error("Erreur lors du rafraîchissement");
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
