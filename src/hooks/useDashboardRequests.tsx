import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getMissionsByUserId } from "@/services/missionService";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";

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

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "all") return true;
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "late") return request.isLate;
    return false;
  });

  return {
    requests,
    filteredRequests,
    activeTab,
    setActiveTab,
    isSDR,
    isGrowth,
    isAdmin,
    loading,
    refetch: refetchRequests
  };
};
