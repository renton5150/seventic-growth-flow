
import { useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserManagementTabs } from "@/components/admin/UserManagementTabs";
import { useAuth } from "@/contexts/auth";
import { Navigate, useLocation } from "react-router-dom";
import { invalidateUserCache } from "@/services/user/userQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Détecter si on arrive par une redirection de suppression
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refresh = params.get('refresh');
    
    if (refresh) {
      // Force un rafraîchissement complet des données à l'arrivée sur la page
      console.log("Détection de paramètre refresh, rafraîchissement forcé des données");
      invalidateUserCache();
      
      // Forcer un refetch de toutes les requêtes
      queryClient.invalidateQueries({ 
        queryKey: ['users'],
        refetchType: 'all' 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['admin-users'],
        refetchType: 'all' 
      });
      
      // Afficher un toast de confirmation
      toast.success("La liste des utilisateurs a été rafraîchie");
    }
  }, [location.search, queryClient]);
  
  // Fonction pour rafraîchir les données utilisateur - optimisée pour limiter les appels
  const refreshUserData = useCallback(() => {
    console.log("Rafraîchissement des données utilisateur depuis AdminUsers");
    
    try {
      // Invalider le cache local d'abord
      invalidateUserCache();
      
      // Toast pour indiquer le raffraichissement
      toast.info("Rafraîchissement des données...", {
        duration: 1000,
        position: "bottom-right"
      });
      
      // Utiliser une seule invalidation avec refetchType: 'all' pour forcer un re-fetch complet
      queryClient.invalidateQueries({ 
        queryKey: ['users'],
        refetchType: 'all' 
      });
      
      // Garantir que les données admin-users sont aussi rafraîchies
      queryClient.invalidateQueries({ 
        queryKey: ['admin-users'],
        refetchType: 'all' 
      });
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
        
        <UserManagementTabs onUserDataChange={refreshUserData} />
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
