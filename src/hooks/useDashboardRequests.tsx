
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { mockData } from "@/data/mockData";

export const useDashboardRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Request[]>([]);

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";

  useEffect(() => {
    const allRequests = getAllRequests();
    
    const filteredRequests = isSDR
      ? allRequests.filter(
          (request) =>
            mockData.missions
              .filter((mission) => mission.sdrId === user?.id)
              .map((mission) => mission.id)
              .includes(request.missionId)
        )
      : allRequests;
    
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
    isGrowth
  };
};
