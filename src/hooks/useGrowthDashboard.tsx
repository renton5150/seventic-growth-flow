
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
      console.log("Exemple de nom de mission dans useGrowthDashboard:", allGrowthRequests[0]?.missionName);
      // Maintenir la liste complète de toutes les requêtes pour tous les onglets
      setAllRequests(allGrowthRequests);
    }
  }, [allGrowthRequests]);
  
  const handleRequestUpdated = () => {
    console.log("Déclenchement du rafraîchissement des requêtes");
    refetchToAssign();
    refetchMyAssignments();
    refetchAllRequests();
  };
  
  const { assignRequestToMe, updateRequestWorkflowStatus } = useRequestAssignment(handleRequestUpdated);
  
  const handleOpenEditDialog = (request: Request) => {
    console.log("Ouverture du dialogue d'édition avec la requête:", request);
    console.log("Nom de la mission dans handleOpenEditDialog:", request.missionName);
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };
  
  const handleOpenCompletionDialog = (request: Request) => {
    console.log("Ouverture du dialogue de complétion avec la requête:", request);
    console.log("Nom de la mission dans handleOpenCompletionDialog:", request.missionName);
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  };
  
  const handleViewDetails = (request: Request) => {
    navigate(`/requests/${request.type}/${request.id}`);
  };
  
  // Utiliser useMemo pour filtrer les requêtes en fonction de l'onglet actif
  const filteredRequests = useMemo(() => {
    console.log("Filtrage des requêtes pour l'onglet:", activeTab, "avec", allRequests.length, "requêtes");
    console.log("État des requêtes avant filtrage (allGrowthRequests):", allGrowthRequests);
    
    let results;
    switch (activeTab) {
      case "all":
        results = allGrowthRequests; // Utiliser directement allGrowthRequests pour l'onglet "all"
        break;
      case "to_assign":
        results = toAssignRequests;
        break;
      case "my_assignments":
        results = myAssignmentsRequests;
        break;
      case "email":
        results = allRequests.filter(req => req.type === "email");
        break;
      case "database":
        results = allRequests.filter(req => req.type === "database");
        break;
      case "linkedin":
        results = allRequests.filter(req => req.type === "linkedin");
        break;
      case "pending":
        results = allRequests.filter(req => req.workflow_status === "pending_assignment");
        break;
      case "inprogress":
        results = allRequests.filter(req => req.workflow_status === "in_progress");
        break;
      case "completed":
        results = allRequests.filter(req => req.workflow_status === "completed");
        break;
      default:
        results = allGrowthRequests;
    }
    
    console.log("Résultats du filtrage pour l'onglet", activeTab, ":", results);
    if (results && results.length > 0) {
      console.log("Exemple de nom de mission après filtrage:", results[0]?.missionName);
    }
    
    return results;
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
