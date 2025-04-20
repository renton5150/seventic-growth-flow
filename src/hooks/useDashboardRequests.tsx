
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getMissionsByUserId } from "@/services/missionService";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { toast } from "sonner";

export const useDashboardRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";

  // Récupérer toutes les requêtes avec les relations
  const { data: allRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['dashboard-requests-with-missions'],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Récupération des requêtes pour le tableau de bord");
      try {
        // Utilisation de la vue requests_with_missions
        const { data, error } = await supabase
          .from('requests_with_missions')
          .select('*');
          
        if (error) {
          console.error("Erreur lors de la récupération des requêtes:", error);
          return [];
        }
        
        console.log("Requêtes récupérées pour le tableau de bord:", data);
        
        // Traiter les données avec formatRequestFromDb
        return data.map((req: any) => formatRequestFromDb(req));
      } catch (err) {
        console.error("Exception lors de la récupération des requêtes:", err);
        return [];
      }
    },
    enabled: !!user
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
      // Filtrer les requêtes pour un SDR selon ses missions
      const missionIds = userMissions.map(mission => mission.id);
      const filteredRequests = allRequests.filter(request => 
        missionIds.includes(request.missionId) || request.createdBy === user?.id
      );
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

  // Solution radicale: Implémentation directe avec un forçage du rendu complet
  const handleStatCardClick = (filterType: "all" | "pending" | "inprogress" | "completed" | "late") => {
    console.log("[ULTRA FIX] useDashboardRequests - handleStatCardClick appelé avec:", filterType);
    
    // Application immédiate du filtre
    setActiveTab(filterType);
    
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
