
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/types";
import { useRequestQueries } from "./useRequestQueries";
import { useRequestAssignment } from "./useRequestAssignment";

export function useGrowthDashboard(defaultTab?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || "to_assign");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  const { 
    toAssignRequests, 
    myAssignmentsRequests,
    allGrowthRequests,
    refetchToAssign, 
    refetchMyAssignments,
    refetchAllRequests,
    getRequestDetails
  } = useRequestQueries(user?.id);
  
  useEffect(() => {
    if (allGrowthRequests && allGrowthRequests.length > 0) {
      console.log("Mise à jour des requêtes dans useGrowthDashboard:", allGrowthRequests);
      // Maintenir la liste complète de toutes les requêtes pour tous les onglets
      setAllRequests(allGrowthRequests);
    }
  }, [allGrowthRequests]);
  
  const handleRequestUpdated = () => {
    refetchToAssign();
    refetchMyAssignments();
    refetchAllRequests();
  };
  
  const { assignRequestToMe, updateRequestWorkflowStatus } = useRequestAssignment(handleRequestUpdated);
  
  const handleOpenEditDialog = (request: Request) => {
    console.log("Ouverture du dialogue d'édition avec la requête:", request);
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };
  
  const handleOpenCompletionDialog = (request: Request) => {
    console.log("Ouverture du dialogue de complétion avec la requête:", request);
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  };
  
  const handleViewDetails = (request: Request) => {
    navigate(`/requests/${request.type}/${request.id}`);
  };
  
  // Utiliser useMemo pour filtrer les requêtes en fonction de l'onglet actif
  const filteredRequests = useMemo(() => {
    console.log("Filtrage des requêtes pour l'onglet:", activeTab, "avec", allRequests.length, "requêtes");
    
    switch (activeTab) {
      case "all":
        return allGrowthRequests; // Utiliser directement allGrowthRequests pour l'onglet "all"
      case "to_assign":
        return toAssignRequests;
      case "my_assignments":
        return myAssignmentsRequests;
      case "email":
        return allRequests.filter(req => req.type === "email");
      case "database":
        return allRequests.filter(req => req.type === "database");
      case "linkedin":
        return allRequests.filter(req => req.type === "linkedin");
      case "pending":
        return allRequests.filter(req => req.workflow_status === "pending_assignment");
      case "inprogress":
        return allRequests.filter(req => req.workflow_status === "in_progress");
      case "completed":
        return allRequests.filter(req => req.workflow_status === "completed");
      default:
        return allGrowthRequests;
    }
  }, [activeTab, allRequests, toAssignRequests, myAssignmentsRequests, allGrowthRequests]);
  
  return {
    filteredRequests,
    allRequests: allGrowthRequests, // Utiliser allGrowthRequests pour garantir que les données sont à jour
    isLoading: false,
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
    handleViewDetails,
    handleRequestUpdated,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    getRequestDetails
  };
}
