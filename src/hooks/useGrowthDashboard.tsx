
import { useState, useCallback, useEffect } from "react";
import { Request } from "@/types/types";
import { useRequestQueries } from "@/hooks/useRequestQueries";
import { useRequestAssignment } from "@/hooks/useRequestAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

export const useGrowthDashboard = (defaultTab?: string) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || "all");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Fetch requests data
  const { 
    allGrowthRequests: allRequests = [], 
    refetchAllRequests: refetchRequests 
  } = useRequestQueries(user?.id);

  // Create the onRequestUpdated callback before passing it to useRequestAssignment
  const handleRequestUpdated = useCallback(() => {
    refetchRequests();
  }, [refetchRequests]);

  const { assignRequestToMe, updateRequestWorkflowStatus } = useRequestAssignment(handleRequestUpdated);

  // Filter requests based on activeTab and activeFilter
  const getFilteredRequests = useCallback(() => {
    // First, filter to only show growth requests on the my-requests page
    let requests = allRequests;
    
    // Si on est sur la page my-requests, ne montrer que les demandes assignées à l'utilisateur connecté
    if (location.pathname.includes("/my-requests") && user?.role === "growth") {
      requests = allRequests.filter(req => req.assigned_to === user?.id);
    }

    // If we have an activeFilter from stat cards, it takes precedence
    if (activeFilter) {
      switch (activeFilter) {
        case "all":
          return requests;
        case "pending":
          return requests.filter(req => req.workflow_status === "pending_assignment");
        case "completed":
          return requests.filter(req => req.workflow_status === "completed");
        case "late":
          return requests.filter(req => req.isLate);
        default:
          return requests;
      }
    }
    
    // Otherwise, filter by the activeTab
    switch (activeTab) {
      case "all":
        return requests;
      case "to_assign":
        return requests.filter(req => req.workflow_status === "pending_assignment");
      case "my_assignments":
        return user?.role === "growth" 
          ? requests.filter(req => req.assigned_to === user?.id)
          : requests; // Admin voit tout
      case "inprogress":
        return requests.filter(req => req.workflow_status === "in_progress");
      case "completed":
        return requests.filter(req => req.workflow_status === "completed");
      case "email":
        return requests.filter(req => req.type === "email");
      case "database":
        return requests.filter(req => req.type === "database");
      case "linkedin":
        return requests.filter(req => req.type === "linkedin");
      default:
        return requests;
    }
  }, [allRequests, activeTab, activeFilter, user?.id, user?.role, location.pathname]);

  // Get filtered requests based on active tab
  const filteredRequests = getFilteredRequests();

  // Handle stat card clicks for filtering
  const handleStatCardClick = useCallback((filterType: "all" | "pending" | "completed" | "late") => {
    console.log(`Stat card clicked: ${filterType}`);
    
    // If clicking on the active filter, deactivate it
    if (activeFilter === filterType) {
      setActiveFilter(null);
      // Reset to default tab
      setActiveTab("all");
    } else {
      setActiveFilter(filterType);
      
      // Apply corresponding filter without toast
      switch (filterType) {
        case "all":
          setActiveTab("all");
          break;
        case "pending":
          setActiveTab("pending");
          break;
        case "completed":
          setActiveTab("completed");
          break;
        case "late":
          setActiveTab("late");
          break;
      }
    }
  }, [activeFilter]);

  // Reset activeFilter when activeTab changes (except when changed by the stat card)
  useEffect(() => {
    // Only reset if activeTab wasn't set by the stat card
    const isStatCardTab = ["all", "pending", "completed", "late"].includes(activeTab);
    if (!isStatCardTab) {
      setActiveFilter(null);
    }
  }, [activeTab]);

  // Dialog handlers
  const handleOpenEditDialog = useCallback((request: Request) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  }, []);

  const handleOpenCompletionDialog = useCallback((request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  }, []);

  const handleViewDetails = useCallback((request: Request) => {
    // Implement navigation to details page
    console.log("View details for request:", request);
  }, []);

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
    assignRequestToMe,
    updateRequestWorkflowStatus,
    handleStatCardClick,
    activeFilter,
    setActiveFilter
  };
};
