
import { useCallback } from "react";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/types";
import { useRequestQueries } from "./useRequestQueries";
import { useRequestAssignment } from "./useRequestAssignment";

export function useGrowthDashboard(defaultTab?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || "all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const isMyRequestsPage = location.pathname.includes("/my-requests");
  
  // Assure que la valeur par défaut de l'onglet est "all" si non spécifiée
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else {
      setActiveTab("all");
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
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };
  
  const handleOpenCompletionDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  };
  
  const handleViewDetails = (request: Request) => {
    navigate(`/requests/${request.type}/${request.id}`);
  };
  
  const handleStatCardClick = useCallback((filterType: "all" | "pending" | "completed" | "late") => {
    console.log(`Stat card clicked: ${filterType}`);
    
    // Si on clique sur le filtre déjà actif, on le désactive
    if (activeFilter === filterType) {
      setActiveFilter(null);
      toast.info("Filtres réinitialisés");
      // Réinitialiser l'onglet à "all" pour afficher toutes les requêtes
      setActiveTab("all");
    } else {
      setActiveFilter(filterType);
      
      // Appliquer le filtre correspondant
      switch (filterType) {
        case "all":
          setActiveTab("all");
          toast.info("Affichage de toutes les demandes");
          break;
        case "pending":
          setActiveTab("pending");
          toast.info("Filtrage par demandes en attente");
          break;
        case "completed":
          setActiveTab("completed");
          toast.info("Filtrage par demandes terminées");
          break;
        case "late":
          setActiveTab("late");
          toast.info("Filtrage par demandes en retard");
          break;
      }
    }
  }, [activeFilter, setActiveTab]);

  // Mise à jour du filtrage pour respecter la page courante (Mes demandes ou Tableau de bord)
  const filteredRequests = useMemo(() => {
    console.log("Applying filters - activeTab:", activeTab, "activeFilter:", activeFilter);
    
    // Base de requêtes selon la page courante
    const baseRequests = isMyRequestsPage 
      ? myAssignmentsRequests
      : allGrowthRequests || [];
    
    // Si un filtre actif est défini depuis les cartes statistiques, il prend priorité
    if (activeFilter) {
      switch (activeFilter) {
        case "all":
          return baseRequests;
        case "pending":
          return baseRequests.filter(req => req.workflow_status === "pending_assignment");
        case "completed":
          return baseRequests.filter(req => req.workflow_status === "completed");
        case "late":
          return baseRequests.filter(req => req.isLate);
      }
    }
    
    // Sinon, filtrage selon l'onglet actif
    switch (activeTab) {
      case "all":
        return baseRequests;
      case "pending":
        return baseRequests.filter(req => req.workflow_status === "pending_assignment");
      case "completed":
        return baseRequests.filter(req => req.workflow_status === "completed");
      case "late":
        return baseRequests.filter(req => req.isLate);
      case "to_assign":
        return toAssignRequests;
      case "my_assignments":
        return myAssignmentsRequests;
      case "inprogress":
        return baseRequests.filter(req => req.workflow_status === "in_progress");
      case "email":
        return baseRequests.filter(req => req.type === "email");
      case "database":
        return baseRequests.filter(req => req.type === "database");
      case "linkedin":
        return baseRequests.filter(req => req.type === "linkedin");
      default:
        return baseRequests;
    }
  }, [
    activeTab,
    activeFilter,
    allGrowthRequests, 
    toAssignRequests, 
    myAssignmentsRequests, 
    isMyRequestsPage
  ]);
  
  return {
    filteredRequests,
    allRequests: isMyRequestsPage ? myAssignmentsRequests : (allGrowthRequests || []),
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
    activeFilter,
    setActiveFilter,
    handleStatCardClick
  };
}
