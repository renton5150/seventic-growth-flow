
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMissionsByUserId } from "@/services/missionService";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { toast } from "sonner";

export const useDashboardRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";

  // Récupérer toutes les requêtes avec les relations
  const { data: allRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['dashboard-requests-with-missions', user?.id, isSDR],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Récupération des requêtes pour le tableau de bord");
      try {
        // Utilisation de la vue requests_with_missions
        let query = supabase.from('requests_with_missions')
          .select('*')
          .not('workflow_status', 'in', '(completed,canceled)'); // Exclure les demandes terminées ET annulées
        
        // Si c'est un SDR, filtrer pour ne montrer que ses propres requêtes
        if (isSDR) {
          console.log("SDR détecté - Filtrage des requêtes pour l'utilisateur:", user.id);
          query = query.eq('created_by', user.id);
        }
        
        const { data, error } = await query;
          
        if (error) {
          console.error("Erreur lors de la récupération des requêtes:", error);
          return [];
        }
        
        console.log(`Requêtes récupérées pour le tableau de bord: ${data.length}`, 
                    isSDR ? "pour le SDR" : "pour Admin/Growth");
        
        // Traiter les données avec formatRequestFromDb - et attendre les résultats des promesses
        const formattedRequests = await Promise.all(data.map((req: any) => formatRequestFromDb(req)));
        return formattedRequests;
      } catch (err) {
        console.error("Exception lors de la récupération des requêtes:", err);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  // Récupérer les missions de l'utilisateur s'il est SDR
  const { data: userMissions = [], isLoading: isLoadingMissions } = useQuery({
    queryKey: ['missions', user?.id],
    queryFn: async () => user?.id ? await getMissionsByUserId(user.id) : [],
    enabled: !!user && isSDR
  });

  useEffect(() => {
    if (isLoadingRequests || isLoadingMissions) {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (!allRequests.length) {
      setRequests([]);
      return;
    }

    if (isSDR && userMissions.length) {
      // Pour les SDR, ne montrer que les requêtes qu'ils ont créées
      // allRequests est maintenant correctement typé comme Request[] et non Promise<Request>[]
      const filteredRequests = allRequests.filter(request => request.createdBy === user?.id);
      setRequests(filteredRequests);
    } else {
      // Admin et Growth voient toutes les requêtes
      setRequests(allRequests);
    }
  }, [allRequests, userMissions, isSDR, isLoadingRequests, isLoadingMissions, user?.id]);

  // Fonction pour filtrer les requêtes en fonction de l'onglet actif
  const getFilteredRequests = useCallback(() => {
    console.log(`[DEBUG] useDashboardRequests - Filtrage des requêtes avec activeTab: ${activeTab}`);
    
    return requests.filter((request) => {
      if (activeTab === "all") return true;
      if (activeTab === "email") return request.type === "email";
      if (activeTab === "database") return request.type === "database";
      if (activeTab === "linkedin") return request.type === "linkedin";
      if (activeTab === "pending") {
        return request.status === "pending" || request.workflow_status === "pending_assignment";
      }
      if (activeTab === "inprogress") {
        return request.workflow_status === "in_progress";
      }
      if (activeTab === "completed") {
        // Ces requêtes ne devraient plus être présentes dans la liste principale
        // mais conservons le filtre pour la cohérence du code
        return request.workflow_status === "completed";
      }
      if (activeTab === "late") {
        return request.isLate === true;
      }
      return false;
    });
  }, [activeTab, requests]);

  // Calcul des requêtes filtrées en fonction de l'onglet actif
  const filteredRequests = getFilteredRequests();

  // Implémentation directe avec un forçage du rendu complet et invalidation des requêtes
  const handleStatCardClick = (filterType: "all" | "pending" | "inprogress" | "completed" | "late") => {
    console.log("[ULTRA FIX] useDashboardRequests - handleStatCardClick appelé avec:", filterType);
    
    // Application immédiate du filtre
    setActiveTab(filterType);
    
    // Force refresh data
    queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
    
    // Notification visuelle
    toast.success(`Filtrage appliqué: ${
      filterType === "all" ? "toutes les demandes" :
      filterType === "pending" ? "demandes en attente" :
      filterType === "inprogress" ? "demandes en cours" :
      filterType === "completed" ? "demandes terminées" :
      "demandes en retard"
    }`, {
      duration: 2000,
      position: "top-center"
    });
    
    console.log("[ULTRA FIX] useDashboardRequests - activeTab mis à jour:", filterType);
  };

  return {
    requests,
    filteredRequests,
    activeTab,
    setActiveTab,
    isSDR,
    isGrowth,
    isAdmin,
    loading,
    refetch: refetchRequests,
    handleStatCardClick,
  };
};
