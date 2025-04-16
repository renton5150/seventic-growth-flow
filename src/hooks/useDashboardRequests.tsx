
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getMissionsByUserId } from "@/services/missionService";

export const useDashboardRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";

  // Récupérer toutes les requêtes
  const { data: allRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests, error: requestsError } = useQuery({
    queryKey: ['requests'],
    queryFn: getAllRequests,
    enabled: !!user
  });

  // Récupérer les missions de l'utilisateur s'il est SDR
  const { data: userMissions = [], isLoading: isLoadingMissions, error: missionsError } = useQuery({
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

    // Gérer les erreurs
    if (requestsError) {
      setError(requestsError instanceof Error ? requestsError : new Error('Erreur lors du chargement des demandes'));
      return;
    }

    if (missionsError && isSDR) {
      setError(missionsError instanceof Error ? missionsError : new Error('Erreur lors du chargement des missions'));
      return;
    }

    if (!allRequests.length) {
      setRequests([]);
      return;
    }

    if (isSDR) {
      console.log(`Filtering requests for SDR user ${user?.id}. ${userMissions.length} missions available.`);
      console.log(`User created requests: ${allRequests.filter(request => request.createdBy === user?.id).length}`);
      
      // Filtrer les requêtes pour un SDR selon ses missions ET ses propres créations
      const missionIds = userMissions.map(mission => mission.id);
      const filteredRequests = allRequests.filter(request => 
        // Requêtes liées aux missions de l'utilisateur
        missionIds.includes(request.missionId) || 
        // OU requêtes créées par l'utilisateur lui-même
        request.createdBy === user?.id
      );
      
      console.log(`Filtered ${filteredRequests.length} requests for SDR user`);
      setRequests(filteredRequests);
    } else {
      // Admin et Growth voient toutes les requêtes
      setRequests(allRequests);
    }
  }, [allRequests, userMissions, isSDR, isLoadingRequests, isLoadingMissions, user?.id, requestsError, missionsError]);

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "all") return true;
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "late") return request.isLate;
    return false;
  });

  const refetch = async () => {
    console.log("Refetching requests and missions data");
    try {
      await refetchRequests();
      console.log("Data refetched successfully");
    } catch (err) {
      console.error("Error refetching data:", err);
      setError(err instanceof Error ? err : new Error('Erreur lors du rechargement des données'));
    }
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
    error,
    refetch
  };
};
