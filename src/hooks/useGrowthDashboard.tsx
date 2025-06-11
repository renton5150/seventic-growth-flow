
import { useState, useCallback, useEffect } from "react";
import { Request } from "@/types/types";
import { useRequestQueries } from "@/hooks/useRequestQueries";
import { useRequestAssignment } from "@/hooks/useRequestAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
        setActiveTab("all");
      } else if (filterType === 'sdr' && createdBy) {
        console.log(`[useGrowthDashboard] 📋 Filtrage SDR détecté pour: ${userName} (${createdBy})`);
        setSpecialFilters({ sdrFilter: createdBy });
        setActiveTab("all");
      } else if (filterType === 'growth' && assignedTo) {
        console.log(`[useGrowthDashboard] 📋 Filtrage Growth détecté pour: ${userName} (${assignedTo})`);
        setSpecialFilters({ growthFilter: assignedTo });
        setActiveTab("all");
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

  // Fonction de filtrage principale
  const getFilteredRequests = useCallback((filterType: string) => {
    console.log(`[DEBUG] Applying filter: ${filterType} for user ${user?.name || user?.email}`);
    
    // Valeur par défaut : toutes les demandes
    if (!allRequests || !filterType) return allRequests;
    
    // Détecter les demandes non assignées
    const nonAssignedRequests = allRequests.filter(req => 
      !req.assigned_to || req.assigned_to === 'Non assigné'
    );
    console.log(`[DEBUG] Non-assigned requests: ${nonAssignedRequests.length}`);
    
    // Détecter les demandes assignées à l'utilisateur courant
    const myRequests = allRequests.filter(req => 
      req.assigned_to === user?.id
    );
    console.log(`[DEBUG] My requests: ${myRequests.length}`);
    
    // Appliquer le filtre sélectionné
    switch(filterType) {
      // Cas pour "En attente d'assignation"
      case 'to_assign':
        console.log(`[DEBUG] Returning ${nonAssignedRequests.length} non-assigned requests`);
        return nonAssignedRequests;
      
      // Cas pour "Mes demandes à traiter"  
      case 'my_assignments':
        console.log(`[DEBUG] Returning ${myRequests.length} requests assigned to me`);
        return myRequests;
      
      // Autres cas existants...
      case 'all':
        return allRequests;
      
      case 'completed':
        return allRequests.filter(req => req.workflow_status === 'completed');
        
      case 'late':
        return allRequests.filter(req => req.isLate);
      
      // Cas par défaut - toutes les demandes  
      default:
        console.log(`[DEBUG] Unknown filter type: ${filterType}, returning all requests`);
        return allRequests;
    }
  }, [allRequests, user]);

  const filteredRequests = getFilteredRequests(activeTab);
  
  console.log("[useGrowthDashboard] 🔍 RÉSULTAT FINAL du filtrage:", {
    activeFilter,
    activeTab,
    totalInput: allRequests.length,
    finalOutput: filteredRequests.length,
    finalRequests: filteredRequests.slice(0, 3).map(req => ({
      id: req.id,
      title: req.title,
      assigned_to: req.assigned_to
    }))
  });

  const handleStatCardClick = useCallback((filterType: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`[useGrowthDashboard] 📊 CRITICAL - Stat card clicked: ${filterType}`);
    
    // Si on clique sur "completed", rediriger vers les archives
    if (filterType === "completed") {
      navigate("/archives");
      return;
    }
    
    // Messages de toast correspondants
    const filterMessages = {
      'to_assign': 'demandes en attente d\'assignation',
      'my_assignments': 'mes demandes à traiter',
      'completed': 'demandes terminées',
      'late': 'demandes en retard',
      'all': 'toutes les demandes',
      'pending': 'demandes en attente',
      'inprogress': 'demandes en cours'
    };
    
    // Utiliser le bon message ou un message par défaut
    const message = filterMessages[filterType] || 'demandes';
    
    // CORRECTION CRITIQUE: Synchronisation parfaite entre filtre et état
    if (activeFilter === filterType) {
      console.log(`[useGrowthDashboard] 📊 CRITICAL - Désactivation du filtre: ${filterType}`);
      setActiveFilter(null);
      setActiveTab("all");
      toast.info("Filtre désactivé");
    } else {
      console.log(`[useGrowthDashboard] 📊 CRITICAL - Activation du filtre: ${filterType}`);
      setActiveFilter(filterType);
      setActiveTab(filterType); // Important: forcer l'onglet sur le bon filtre
      toast.info(`Filtrage appliqué: ${message}`);
    }
  }, [activeFilter, navigate]);

  useEffect(() => {
    const isStatCardTab = ["all", "pending", "inprogress", "late", "to_assign", "my_assignments"].includes(activeTab);
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

  // Fonction pour supprimer les filtres spéciaux
  const clearSpecialFilters = useCallback(() => {
    setSpecialFilters({});
    setActiveTab("all");
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
    handleRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    handleStatCardClick,
    activeFilter,
    setActiveFilter,
    specialFilters,
    clearSpecialFilters,
    getFilteredRequests // exporter la fonction aussi
  };
};
