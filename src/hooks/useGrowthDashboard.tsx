
import { useState, useCallback, useEffect } from "react";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSingleRequestSource } from "./useSingleRequestSource";
import { GrowthFilterService, SpecialFilters } from "@/services/filtering/growthFilterService";
import { useGrowthDebug } from "./useGrowthDebug";

export const useGrowthDashboard = (defaultTab?: string) => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // État pour gérer les filtres spéciaux depuis l'admin dashboard
  const [specialFilters, setSpecialFilters] = useState<SpecialFilters>({});

  // SOURCE UNIQUE DE DONNÉES
  const { data: allRequests = [], refetch: refetchRequests } = useSingleRequestSource();
  
  // SERVICE DE FILTRAGE CENTRALISÉ
  const filterService = new GrowthFilterService(user?.id);
  
  // FILTRAGE UNIFIÉ avec prise en compte des filtres spéciaux
  const filteredRequests = filterService.filterRequests(currentFilter, allRequests, specialFilters);
  
  // DEBUG AUTOMATIQUE
  const debugInfo = useGrowthDebug(allRequests, filteredRequests, currentFilter, user?.id);

  // Gérer l'état de navigation depuis l'admin dashboard
  useEffect(() => {
    console.log("[useGrowthDashboard] Vérification de l'état de navigation:", location.state);
    
    if (location.state) {
      const { filterType, createdBy, assignedTo, userName, showUnassigned } = location.state as any;
      
      if (showUnassigned) {
        console.log(`[useGrowthDashboard] Filtre demandes non assignées activé`);
        setSpecialFilters({ showUnassigned: true });
      } else if (filterType === 'sdr' && createdBy) {
        console.log(`[useGrowthDashboard] Filtrage SDR détecté pour: ${userName} (${createdBy})`);
        setSpecialFilters({ sdrFilter: createdBy });
      } else if (filterType === 'growth' && assignedTo) {
        console.log(`[useGrowthDashboard] Filtrage Growth détecté pour: ${userName} (${assignedTo})`);
        setSpecialFilters({ growthFilter: assignedTo });
      }
      
      // Nettoyer l'état après utilisation
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  const handleRequestUpdated = useCallback(() => {
    refetchRequests();
  }, [refetchRequests]);

  const handleRequestDeleted = useCallback(() => {
    console.log("Demande supprimée, rafraîchissement des données...");
    
    // Forcer un rafraîchissement complet
    queryClient.invalidateQueries({ queryKey: ['growth-all-requests-unified'] });
    
    setTimeout(() => {
      refetchRequests();
    }, 300);
  }, [refetchRequests, queryClient]);

  const assignRequestToMe = useCallback(async (requestId: string): Promise<boolean> => {
    // Implementation simplifiée - à adapter selon vos besoins
    console.log("Assignation de la demande:", requestId);
    return true;
  }, []);

  const updateRequestWorkflowStatus = useCallback(async (requestId: string, newStatus: string): Promise<boolean> => {
    // Implementation simplifiée - à adapter selon vos besoins
    console.log("Mise à jour du statut workflow:", requestId, newStatus);
    return true;
  }, []);

  const handleOpenEditDialog = useCallback((request: Request) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  }, []);

  const handleOpenCompletionDialog = useCallback((request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  }, []);

  const handleViewDetails = useCallback((request: Request) => {
    // FORMAT UNIFIÉ pour la navigation
    navigate(`/request/${request.id}`);
  }, [navigate]);

  // Fonction pour supprimer les filtres spéciaux
  const clearSpecialFilters = useCallback(() => {
    setSpecialFilters({});
  }, []);

  // Gestionnaire de clic sur les statistiques avec prise en compte des filtres spéciaux
  const handleStatClick = useCallback((filterType: string) => {
    console.log(`[useGrowthDashboard] 🎯 CLIC sur filtre: "${filterType}"`);
    setCurrentFilter(filterType);
  }, []);

  return {
    allRequests,
    filteredRequests,
    currentFilter,
    setCurrentFilter,
    handleStatClick,
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
    clearSpecialFilters,
    // Debug info pour développement
    debugInfo,
  };
};
