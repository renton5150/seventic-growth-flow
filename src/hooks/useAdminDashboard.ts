
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { DirectRequest } from "@/services/requests/directRequestService";

export const useAdminDashboard = () => {
  const { user, isSDR, isGrowth, isAdmin } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Paramètres de filtrage depuis l'URL
  const createdByParam = searchParams.get('createdBy') || undefined;
  const assignedToParam = searchParams.get('assignedTo') || undefined;
  const showUnassignedParam = searchParams.get('showUnassigned') === 'true';
  const filterTypeParam = searchParams.get('filterType') || undefined;
  const userNameParam = searchParams.get('userName') || undefined;

  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Utiliser le système DIRECT
  const { data: directRequests = [], isLoading: loading, error, refetch } = useDirectRequests();

  console.log("🎯 [ADMIN-DASHBOARD] Système DIRECT - Paramètres URL:", {
    createdBy: createdByParam,
    assignedTo: assignedToParam,
    showUnassigned: showUnassignedParam,
    filterType: filterTypeParam,
    userName: userNameParam,
    activeTab
  });

  // Conversion des DirectRequest vers le format Request pour compatibilité
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
    target_role: 'growth' // Valeur par défaut
  }));

  console.log("🎯 [ADMIN-DASHBOARD] Demandes converties:", allRequests.length);

  // Filtrage spécial pour admin avec paramètres URL
  const filteredRequests = allRequests.filter((request) => {
    console.log(`🔍 [ADMIN-DASHBOARD-FILTER] Filtrage demande ${request.id} avec activeTab: ${activeTab}`);
    
    // Filtres spéciaux pour admin avec paramètres URL
    let matchesAdminFilters = true;
    
    if (createdByParam) {
      matchesAdminFilters = matchesAdminFilters && request.createdBy === createdByParam;
      console.log(`🔍 [ADMIN-FILTER] createdBy filter - demande ${request.id} createdBy: ${request.createdBy}, param: ${createdByParam}, match: ${request.createdBy === createdByParam}`);
    }
    
    if (assignedToParam) {
      matchesAdminFilters = matchesAdminFilters && request.assigned_to === assignedToParam;
      console.log(`🔍 [ADMIN-FILTER] assignedTo filter - demande ${request.id} assigned_to: ${request.assigned_to}, param: ${assignedToParam}, match: ${request.assigned_to === assignedToParam}`);
    }
    
    if (showUnassignedParam) {
      matchesAdminFilters = matchesAdminFilters && (!request.assigned_to || request.assigned_to === null);
      console.log(`🔍 [ADMIN-FILTER] showUnassigned filter - demande ${request.id} assigned_to: ${request.assigned_to}, match: ${!request.assigned_to}`);
    }

    // Filtres de rôle standards si pas d'admin ou pas de filtres URL spéciaux
    let matchesRole = true;
    if (!isAdmin || (!createdByParam && !assignedToParam && !showUnassignedParam)) {
      if (isSDR) {
        matchesRole = request.createdBy === user?.id;
        console.log(`🔍 [ADMIN-DASHBOARD-FILTER] SDR filter - demande ${request.id} createdBy: ${request.createdBy}, userId: ${user?.id}, match: ${matchesRole}`);
      } else if (isGrowth && !isAdmin) {
        matchesRole = request.target_role !== "sdr";
        console.log(`🔍 [ADMIN-DASHBOARD-FILTER] Growth filter - demande ${request.id} target_role: ${request.target_role}, match: ${matchesRole}`);
      }
    }

    // Filtres par onglet
    let matchesTab = true;
    switch (activeTab) {
      case "all":
        matchesTab = request.workflow_status !== "completed";
        console.log(`🔍 [ADMIN-DASHBOARD-FILTER] Demande ${request.id} - workflow_status: ${request.workflow_status}, match all: ${matchesTab}`);
        break;
      case "pending":
      case "to_assign":
        matchesTab = (!request.assigned_to || request.assigned_to === null) && request.workflow_status !== "completed";
        console.log(`🔍 [ADMIN-DASHBOARD-FILTER] Demande ${request.id} - assigned_to: ${request.assigned_to}, workflow_status: ${request.workflow_status}, match to_assign: ${matchesTab}`);
        break;
      case "my_assignments":
        matchesTab = request.assigned_to === user?.id && request.workflow_status !== "completed";
        console.log(`🔍 [ADMIN-DASHBOARD-FILTER] Demande ${request.id} - assigned_to: ${request.assigned_to}, userId: ${user?.id}, workflow_status: ${request.workflow_status}, match my_assignments: ${matchesTab}`);
        break;
      case "inprogress":
        matchesTab = request.workflow_status === "in_progress";
        break;
      case "completed":
        matchesTab = request.workflow_status === "completed";
        break;
      case "late":
        matchesTab = request.isLate;
        break;
    }

    const finalResult = matchesTab && matchesRole && matchesAdminFilters;
    console.log(`🔍 [ADMIN-DASHBOARD-FILTER] Demande ${request.id} - Résultat final: ${finalResult}`);
    
    return finalResult;
  });

  console.log("🎯 [ADMIN-DASHBOARD] Demandes filtrées final:", filteredRequests.length);

  const handleStatCardClick = (tab: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`🎯 [ADMIN-DASHBOARD] Click sur card: ${tab}`);
    setActiveTab(tab);
  };

  return {
    filteredRequests,
    allRequests,
    activeTab,
    setActiveTab,
    loading,
    refetch,
    handleStatCardClick,
    filterParams: {
      createdBy: createdByParam,
      assignedTo: assignedToParam,
      showUnassigned: showUnassignedParam,
      filterType: filterTypeParam,
      userName: userNameParam
    }
  };
};
