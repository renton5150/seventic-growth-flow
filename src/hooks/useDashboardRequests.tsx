
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { mockData } from "@/data/mockData";
import { getUserById } from "@/data/users";

export const useDashboardRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Request[]>([]);

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const allRequests = getAllRequests();
    
    // Add SDR names to requests
    const requestsWithSdrNames = allRequests.map(request => {
      const mission = mockData.missions.find(m => m.id === request.missionId);
      if (mission) {
        const sdr = getUserById(mission.sdrId);
        return {
          ...request,
          sdrName: sdr?.name || "Inconnu"
        };
      }
      return request;
    });
    
    const filteredRequests = isSDR
      ? requestsWithSdrNames.filter(
          (request) =>
            mockData.missions
              .filter((mission) => mission.sdrId === user?.id)
              .map((mission) => mission.id)
              .includes(request.missionId)
        )
      : requestsWithSdrNames;
    
    setRequests(filteredRequests);
  }, [user, isSDR]);

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
    isAdmin
  };
};
