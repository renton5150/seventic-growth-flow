
import { useState } from "react";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { DirectRequest } from "@/services/requests/directRequestService";

/**
 * Hook simplifié pour le dashboard admin
 * Utilise le système DIRECT et applique les filtres URL de manière claire
 */
export const useSimpleAdminDashboard = () => {
  const { user, isSDR, isGrowth, isAdmin } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Paramètres de filtrage depuis l'URL
  const createdByParam = searchParams.get('createdBy') || undefined;
  const assignedToParam = searchParams.get('assignedTo') || undefined;
  const showUnassignedParam = searchParams.get('showUnassigned') === 'true';
  const userNameParam = searchParams.get('userName') || undefined;

  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Utiliser le système DIRECT
  const { data: directRequests = [], isLoading: loading, error, refetch } = useDirectRequests();

  console.log("🎯 [SIMPLE-ADMIN] Paramètres URL:", {
    createdBy: createdByParam,
    assignedTo: assignedToParam,
    showUnassigned: showUnassignedParam,
    userName: userNameParam,
    activeTab,
    isAdmin,
    hasAdminFilters: !!(createdByParam || assignedToParam || showUnassignedParam)
  });

  // Conversion des DirectRequest vers le format Request
  const allRequests = directRequests.map((req: DirectRequest) => ({
    id: req.id,
    title: req.title,
    type: req.type,
    status: req.status as any,
    createdBy: req.created_by,
    missionId: req.mission_id,
    missionName: req.mission_name,
    missionClient: req.mission_client,
    sdrName: req.sdr_name,
    assignedToName: req.assigned_to_name,
    dueDate: req.due_date,
    details: req.details,
    workflow_status: req.workflow_status as any,
    assigned_to: req.assigned_to,
    isLate: req.isLate,
    createdAt: new Date(req.created_at),
    lastUpdated: new Date(req.last_updated),
    target_role: 'growth'
  }));

  // Appliquer les filtres spéciaux admin en premier
  let filteredRequests = allRequests;

  // Si on a des paramètres URL spéciaux (vue admin), les appliquer
  if (isAdmin && (createdByParam || assignedToParam || showUnassignedParam)) {
    console.log("🎯 [SIMPLE-ADMIN] Application des filtres admin spéciaux");
    
    filteredRequests = allRequests.filter((request) => {
      let matches = true;
      
      if (createdByParam) {
        matches = matches && request.createdBy === createdByParam;
      }
      
      if (assignedToParam) {
        matches = matches && request.assigned_to === assignedToParam;
      }
      
      if (showUnassignedParam) {
        matches = matches && (!request.assigned_to || request.assigned_to === null);
      }
      
      return matches;
    });
  } else {
    // Sinon, appliquer les filtres de rôle normaux
    console.log("🎯 [SIMPLE-ADMIN] Application des filtres de rôle normaux");
    
    filteredRequests = allRequests.filter((request) => {
      if (isSDR) {
        return request.createdBy === user?.id;
      } else if (isGrowth && !isAdmin) {
        return request.target_role !== "sdr";
      }
      // Admin voit tout par défaut
      return true;
    });
  }

  // Ensuite, appliquer les filtres par onglet
  const finalFilteredRequests = filteredRequests.filter((request) => {
    switch (activeTab) {
      case "all":
        return request.workflow_status !== "completed";
      case "pending":
      case "to_assign":
        return (!request.assigned_to || request.assigned_to === null) && request.workflow_status !== "completed";
      case "my_assignments":
        return request.assigned_to === user?.id && request.workflow_status !== "completed";
      case "inprogress":
        return request.workflow_status === "in_progress";
      case "completed":
        return request.workflow_status === "completed";
      case "late":
        return request.isLate && request.workflow_status !== "completed";
      default:
        return true;
    }
  });

  console.log("🎯 [SIMPLE-ADMIN] Résultats finaux:", {
    total: allRequests.length,
    afterRoleFilter: filteredRequests.length,
    afterTabFilter: finalFilteredRequests.length
  });

  const handleStatCardClick = (tab: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`🎯 [SIMPLE-ADMIN] Click sur card: ${tab}`);
    setActiveTab(tab);
  };

  return {
    filteredRequests: finalFilteredRequests,
    allRequests: filteredRequests, // Pour les stats
    activeTab,
    setActiveTab,
    loading,
    refetch,
    handleStatCardClick,
    filterParams: {
      createdBy: createdByParam,
      assignedTo: assignedToParam,
      showUnassigned: showUnassignedParam,
      userName: userNameParam
    },
    hasAdminFilters: !!(createdByParam || assignedToParam || showUnassignedParam)
  };
};
