
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getMissionsByUserId } from "@/services/missionService";
import { StatFilter } from "@/components/admin/AdminStatsSummary";

export const useDashboardRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";

  // Récupérer toutes les requêtes
  const { data: allRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['requests'],
    queryFn: getAllRequests,
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
        missionIds.includes(request.missionId)
      );
      setRequests(filteredRequests);
    } else {
      // Admin et Growth voient toutes les requêtes
      setRequests(allRequests);
    }
  }, [allRequests, userMissions, isSDR, isLoadingRequests, isLoadingMissions]);

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "all") return true;
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "completed") return request.status === "completed";
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
