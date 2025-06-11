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

  const getFilteredRequests = useCallback(() => {
    const isSDR = user?.role === 'sdr';
    const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';

    console.log("[useGrowthDashboard] 🔍 FILTRAGE - Début du filtrage avec:", {
      activeFilter,
      activeTab,
      userRole: user?.role,
      userId: user?.id,
      totalRequests: allRequests.length
    });

    // Filtrer d'abord pour exclure les demandes terminées ET annulées qui ne devraient pas apparaître ici
    const nonCompletedRequests = allRequests.filter(req => 
      req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
    );

    console.log("[useGrowthDashboard] 🔍 Après exclusion completed/canceled:", nonCompletedRequests.length);

    // CORRECTION: Gestion des filtres spéciaux depuis l'admin dashboard
    if (specialFilters.showUnassigned) {
      console.log(`[useGrowthDashboard] 🔍 Application du filtre demandes non assignées`);
      return nonCompletedRequests.filter(req => !req.assigned_to);
    }
    
    if (specialFilters.sdrFilter) {
      console.log(`[useGrowthDashboard] 🔍 Filtrage par SDR: ${specialFilters.sdrFilter}`);
      return nonCompletedRequests.filter(req => req.createdBy === specialFilters.sdrFilter);
    }
    
    if (specialFilters.growthFilter) {
      console.log(`[useGrowthDashboard] 🔍 Filtrage par Growth: ${specialFilters.growthFilter}`);
      return nonCompletedRequests.filter(req => req.assigned_to === specialFilters.growthFilter);
    }

    // Logique normale du Growth Dashboard (sans filtres spéciaux)
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
      console.log("[useGrowthDashboard] 🔍 Application du filtre activeFilter:", activeFilter);
      
      switch (activeFilter) {
        case "all":
          console.log("[useGrowthDashboard] 🔍 Filtre 'all' - toutes les demandes");
          return nonCompletedRequests;
        case "pending":
          console.log("[useGrowthDashboard] 🔍 Filtre 'pending'");
          return nonCompletedRequests.filter(req => req.workflow_status === "pending_assignment");
        case "inprogress":
          console.log("[useGrowthDashboard] 🔍 Filtre 'inprogress'");
          return nonCompletedRequests.filter(req => req.workflow_status === "in_progress");
        case "to_assign":
          // CORRECTION: Filtrer pour ne montrer que les demandes vraiment non assignées
          console.log(`[useGrowthDashboard] 🔍 Filtre "En attente d'assignation" - demandes non assignées`);
          const unassignedRequests = nonCompletedRequests.filter(req => !req.assigned_to);
          console.log(`[useGrowthDashboard] 🔍 Résultat filtre to_assign: ${unassignedRequests.length} demandes`);
          return unassignedRequests;
        case "my_assignments":
          // CORRECTION: Pour Growth, montrer SEULEMENT ses demandes assignées
          console.log(`[useGrowthDashboard] 🔍 Filtre "Mes demandes à traiter" - demandes assignées à ${user?.id}`);
          if (isGrowthOrAdmin) {
            const myAssignedRequests = nonCompletedRequests.filter(req => req.assigned_to === user?.id);
            console.log(`[useGrowthDashboard] 🔍 Résultat filtre my_assignments: ${myAssignedRequests.length} demandes`);
            return myAssignedRequests;
          } else if (isSDR) {
            return nonCompletedRequests.filter(req => req.createdBy === user?.id);
          }
          return myAssignmentsRequests.filter(req => 
            req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
          );
        case "late":
          console.log("[useGrowthDashboard] 🔍 Filtre 'late'");
          return nonCompletedRequests.filter(req => req.isLate);
        default:
          console.log("[useGrowthDashboard] 🔍 Filtre par défaut - toutes les demandes");
          return nonCompletedRequests;
      }
    }
    
    switch (activeTab) {
      case "all":
        console.log("[useGrowthDashboard] 🔍 Tab 'all'");
        // CORRECTION MAJEURE : Pour Growth, séparer les demandes non assignées et les demandes assignées
        if (user?.role === 'growth') {
          // Retourner SEULEMENT les demandes non assignées ET les demandes assignées à cet utilisateur
          const growthRequests = nonCompletedRequests.filter(req => 
            !req.assigned_to || req.assigned_to === user?.id
          );
          console.log(`[useGrowthDashboard] 🔍 Tab all pour Growth: ${growthRequests.length} demandes`);
          return growthRequests;
        }
        return nonCompletedRequests;
      case "to_assign":
        console.log("[useGrowthDashboard] 🔍 Tab 'to_assign'");
        // CORRECTION : Filtrer pour ne montrer que les demandes vraiment non assignées
        const toAssignTabRequests = nonCompletedRequests.filter(req => !req.assigned_to);
        console.log(`[useGrowthDashboard] 🔍 Tab to_assign: ${toAssignTabRequests.length} demandes`);
        return toAssignTabRequests;
      case "my_assignments":
        console.log("[useGrowthDashboard] 🔍 Tab 'my_assignments'");
        if (isSDR) {
          return nonCompletedRequests.filter(req => req.createdBy === user?.id);
        } else if (isGrowthOrAdmin) {
          // CORRECTION : Pour Growth, montrer SEULEMENT ses demandes assignées
          const myTabRequests = nonCompletedRequests.filter(req => req.assigned_to === user?.id);
          console.log(`[useGrowthDashboard] 🔍 Tab my_assignments pour Growth: ${myTabRequests.length} demandes`);
          return myTabRequests;
        }
        return myAssignmentsRequests.filter(req => 
          req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
        );
      case "inprogress":
        console.log("[useGrowthDashboard] 🔍 Tab 'inprogress'");
        return nonCompletedRequests.filter(req => req.workflow_status === "in_progress");
      case "email":
        console.log("[useGrowthDashboard] 🔍 Tab 'email'");
        return nonCompletedRequests.filter(req => req.type === "email");
      case "database":
        console.log("[useGrowthDashboard] 🔍 Tab 'database'");
        return nonCompletedRequests.filter(req => req.type === "database");
      case "linkedin":
        console.log("[useGrowthDashboard] 🔍 Tab 'linkedin'");
        return nonCompletedRequests.filter(req => req.type === "linkedin");
      default:
        console.log("[useGrowthDashboard] 🔍 Tab par défaut");
        return nonCompletedRequests;
    }
  }, [allRequests, toAssignRequests, myAssignmentsRequests, activeTab, activeFilter, user?.id, user?.role, location.pathname, specialFilters]);

  const filteredRequests = getFilteredRequests();
  
  console.log("[useGrowthDashboard] 🔍 RÉSULTAT FINAL du filtrage:", {
    activeFilter,
    activeTab,
    totalInput: allRequests.length,
    finalOutput: filteredRequests.length
  });

  const handleStatCardClick = useCallback((filterType: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`[useGrowthDashboard] 📊 Stat card clicked: ${filterType}`);
    
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
        case "to_assign":
          setActiveTab("to_assign");
          break;
        case "my_assignments":
          setActiveTab("my_assignments");
          break;
        case "late":
          setActiveTab("late");
          break;
      }
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
    clearSpecialFilters
  };
};
