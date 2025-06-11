
import { useState, useCallback, useEffect } from "react";
import { Request } from "@/types/types";
import { useRequestQueries } from "@/hooks/useRequestQueries";
import { useRequestAssignment } from "@/hooks/useRequestAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useGrowthDashboard = (defaultTab?: string) => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State pour gérer les filtres spéciaux depuis l'admin dashboard
  const [specialFilters, setSpecialFilters] = useState<{
    showUnassigned?: boolean;
    sdrFilter?: string;
    growthFilter?: string;
  }>({});

  // Gérer l'état de navigation depuis l'admin dashboard
  useEffect(() => {
    console.log("[useGrowthDashboard] 🔄 Vérification de l'état de navigation:", location.state);
    
    if (location.state) {
      const { filterType, createdBy, assignedTo, userName, showUnassigned } = location.state as any;
      
      if (showUnassigned) {
        console.log(`[useGrowthDashboard] 📋 Filtre demandes non assignées activé`);
        setSpecialFilters({ showUnassigned: true });
      } else if (filterType === 'sdr' && createdBy) {
        console.log(`[useGrowthDashboard] 📋 Filtrage SDR détecté pour: ${userName} (${createdBy})`);
        setSpecialFilters({ sdrFilter: createdBy });
      } else if (filterType === 'growth' && assignedTo) {
        console.log(`[useGrowthDashboard] 📋 Filtrage Growth détecté pour: ${userName} (${assignedTo})`);
        setSpecialFilters({ growthFilter: assignedTo });
      }
      
      // Nettoyer l'état après utilisation
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

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

  // Fonction pour supprimer les filtres spéciaux
  const clearSpecialFilters = useCallback(() => {
    setSpecialFilters({});
  }, []);

  return {
    allRequests,
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
    specialFilters,
    clearSpecialFilters
  };
};
