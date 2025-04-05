
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { Request } from "@/types/types";
import { mockData } from "@/data/mockData";
import { getUserById } from "@/data/users";

export function useGrowthDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  const loadRequests = () => {
    if (user?.role === "growth" || user?.role === "admin") {
      const allRequests = getAllRequests();
      
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
      
      setRequests(requestsWithSdrNames);
    }
  };
  
  useEffect(() => {
    loadRequests();
  }, [user]);
  
  const filteredRequests = requests.filter(request => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "inprogress") return request.status === "inprogress";
    if (activeTab === "completed") return request.status === "completed";
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    return false;
  });
  
  const handleOpenEditDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };
  
  const handleOpenCompletionDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  };
  
  const handleRequestUpdated = () => {
    loadRequests();
  };
  
  return {
    requests,
    filteredRequests,
    activeTab,
    setActiveTab,
    selectedRequest,
    setSelectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleRequestUpdated
  };
}
