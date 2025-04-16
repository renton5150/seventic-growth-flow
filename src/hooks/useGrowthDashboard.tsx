
import { useState, useEffect } from "react";
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
  
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  const { 
    toAssignRequests, 
    myAssignmentsRequests, 
    refetchToAssign, 
    refetchMyAssignments,
    getRequestDetails
  } = useRequestQueries(user?.id);
  
  const handleRequestUpdated = () => {
    refetchToAssign();
    refetchMyAssignments();
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
  
  const filteredRequests = activeTab === "to_assign" ? toAssignRequests : 
                          activeTab === "my_assignments" ? myAssignmentsRequests : 
                          [];
  
  return {
    filteredRequests,
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
