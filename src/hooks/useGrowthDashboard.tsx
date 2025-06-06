
import { useState, useCallback, useEffect } from "react";
import { Request } from "@/types/types";
import { useRequestQueries } from "@/hooks/useRequestQueries";
import { useRequestAssignment } from "@/hooks/useRequestAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useGrowthDashboard = (defaultTab?: string) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || "all");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { 
    toAssignRequests,
    myAssignmentsRequests,
    allGrowthRequests: allRequests = [], 
    refetchToAssign,
    refetchMyAssignments,
    refetchAllRequests: refetchRequests 
  } = useRequestQueries(user?.id);

  const handleRequestUpdated = useCallback(() => {
    refetchRequests();
    refetchToAssign();
    refetchMyAssignments();
  }, [refetchRequests, refetchToAssign, refetchMyAssignments]);

  const handleRequestDeleted = useCallback(() => {
    console.log("Demande supprimée, rafraîchissement des données...");
    
    // Forcer un rafraîchissement complet immédiatement
    queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
    queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
    
    // Forcer un rafraîchissement manuel
    setTimeout(() => {
      refetchRequests();
      refetchToAssign();
      refetchMyAssignments();
      
      // Refetch explicite pour s'assurer que les données sont à jour
      queryClient.refetchQueries({ queryKey: ['growth-all-requests'] });
    }, 300);
  }, [refetchRequests, refetchToAssign, refetchMyAssignments, queryClient]);

  const { assignRequestToMe, updateRequestWorkflowStatus } = useRequestAssignment(handleRequestUpdated);

  const getFilteredRequests = useCallback(() => {
    const isSDR = user?.role === 'sdr';
    const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';

    // Filtrer d'abord pour exclure les demandes terminées ET annulées qui ne devraient pas apparaître ici
    const nonCompletedRequests = allRequests.filter(req => 
      req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
    );

    if (location.pathname.includes("/my-requests")) {
      if (isSDR) {
        return nonCompletedRequests.filter(req => req.createdBy === user?.id);
      } else if (isGrowthOrAdmin) {
        return nonCompletedRequests.filter(req => req.assigned_to === user?.id || user?.role === "admin");
      }
    }

    if (location.pathname.includes("/to-assign")) {
      return toAssignRequests;
    }

    if (activeFilter) {
      switch (activeFilter) {
        case "all":
          return nonCompletedRequests;
        case "pending":
          return nonCompletedRequests.filter(req => req.workflow_status === "pending_assignment");
        case "inprogress":
          return nonCompletedRequests.filter(req => req.workflow_status === "in_progress");
        case "late":
          return nonCompletedRequests.filter(req => req.isLate);
        default:
          return nonCompletedRequests;
      }
    }
    
    switch (activeTab) {
      case "all":
        return nonCompletedRequests;
      case "to_assign":
        return toAssignRequests;
      case "my_assignments":
        if (isSDR) {
          return nonCompletedRequests.filter(req => req.createdBy === user?.id);
        } else if (isGrowthOrAdmin) {
          return nonCompletedRequests.filter(req => req.assigned_to === user?.id || user?.role === "admin");
        }
        return myAssignmentsRequests.filter(req => 
          req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
        );
      case "inprogress":
        return nonCompletedRequests.filter(req => req.workflow_status === "in_progress");
      case "email":
        return nonCompletedRequests.filter(req => req.type === "email");
      case "database":
        return nonCompletedRequests.filter(req => req.type === "database");
      case "linkedin":
        return nonCompletedRequests.filter(req => req.type === "linkedin");
      default:
        return nonCompletedRequests;
    }
  }, [allRequests, toAssignRequests, myAssignmentsRequests, activeTab, activeFilter, user?.id, user?.role, location.pathname]);

  const filteredRequests = getFilteredRequests();

  const handleStatCardClick = useCallback((filterType: "all" | "pending" | "completed" | "late" | "inprogress") => {
    console.log(`Stat card clicked: ${filterType}`);
    
    // Si on clique sur "completed", rediriger vers les archives
    if (filterType === "completed") {
      navigate("/archives");
      return;
    }
    
    if (activeFilter === filterType) {
      setActiveFilter(null);
      setActiveTab("all");
    } else {
      setActiveFilter(filterType);
      
      switch (filterType) {
        case "all":
          setActiveTab("all");
          break;
        case "pending":
          setActiveTab("pending");
          break;
        case "inprogress":
          setActiveTab("inprogress");
          break;
        case "late":
          setActiveTab("late");
          break;
      }
    }
  }, [activeFilter, navigate]);

  useEffect(() => {
    const isStatCardTab = ["all", "pending", "inprogress", "late"].includes(activeTab);
    if (!isStatCardTab) {
      setActiveFilter(null);
    }
  }, [activeTab]);

  const handleOpenEditDialog = useCallback((request: Request) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  }, []);

  const handleOpenCompletionDialog = useCallback((request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  }, []);

  const handleViewDetails = useCallback((request: Request) => {
    navigate(`/requests/${request.type}/${request.id}`);
  }, [navigate]);

  return {
    filteredRequests,
    allRequests,
    activeTab,
    setActiveTab,
    selectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleViewDetails,
    handleRequestUpdated,
    handleRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    handleStatCardClick,
    activeFilter,
    setActiveFilter
  };
};
