
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/types";
import { useRequestQueries } from "./useRequestQueries";
import { useRequestAssignment } from "./useRequestAssignment";

export function useGrowthDashboard(defaultTab?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || "all");
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
  
  // Updated filteredRequests logic to show all Growth requests when "all" tab is selected
  const filteredRequests = useMemo(() => {
    switch (activeTab) {
      case "all":
        return allGrowthRequests || []; // Show all requests for Growth role
      case "to_assign":
        return toAssignRequests;
      case "my_assignments":
        return myAssignmentsRequests;
      case "pending":
        return allRequests.filter(req => req.workflow_status === "pending_assignment");
      case "inprogress":
        return allRequests.filter(req => req.workflow_status === "in_progress");
      case "completed":
        return allRequests.filter(req => req.workflow_status === "completed");
      case "email":
        return allRequests.filter(req => req.type === "email");
      case "database":
        return allRequests.filter(req => req.type === "database");
      case "linkedin":
        return allRequests.filter(req => req.type === "linkedin");
      default:
        return allGrowthRequests || [];
    }
  }, [activeTab, allRequests, toAssignRequests, myAssignmentsRequests, allGrowthRequests]);
  
  return {
    filteredRequests,
    allRequests: allGrowthRequests,
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
