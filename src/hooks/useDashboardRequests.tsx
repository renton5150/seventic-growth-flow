import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

interface FilterParams {
  createdBy?: string;
  assignedTo?: string;
  showUnassigned?: boolean;
  filterType?: string;
  userName?: string;
}

export const useDashboardRequests = () => {
  console.log("🔍 [DASHBOARD-HOOK] Initialisation useDashboardRequests");

  const { user, isAdmin, isSDR, isGrowth } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  console.log("🔍 [DASHBOARD-HOOK] User info:", { userId: user?.id, role: user?.role, isAdmin, isSDR, isGrowth });

  // Extract parameters from URL
  const createdByParam = searchParams.get('createdBy') || undefined;
  const assignedToParam = searchParams.get('assignedTo') || undefined;
  const showUnassignedParam = searchParams.get('showUnassigned') === 'true';
  const filterTypeParam = searchParams.get('filterType') || undefined;
  const userNameParam = searchParams.get('userName') || undefined;

  const [activeTab, setActiveTab] = useState<string>("all");
  
  console.log("🔍 [DASHBOARD-HOOK] Paramètres extraits:", {
    createdBy: createdByParam,
    assignedTo: assignedToParam,
    showUnassigned: showUnassignedParam,
    filterType: filterTypeParam,
    userName: userNameParam,
    activeTab
  });

  // Récupérer toutes les demandes via l'ancien système
  const { data: allRequests = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['dashboard-requests'],
    queryFn: async () => {
      console.log("🔍 [DASHBOARD-HOOK] Début de la récupération des demandes");
      
      try {
        const { data, error } = await supabase
          .from('requests_with_missions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("❌ [DASHBOARD-HOOK] Erreur Supabase:", error);
          throw error;
        }

        console.log("✅ [DASHBOARD-HOOK] Données brutes récupérées:", data?.length || 0, "demandes");
        console.log("🔍 [DASHBOARD-HOOK] Première demande brute:", data?.[0]);

        if (!data) {
          console.warn("⚠️ [DASHBOARD-HOOK] Données nulles");
          return [];
        }

        // Formatage des demandes
        const formattedRequests = data.map((req: any) => {
          console.log(`🔍 [DASHBOARD-HOOK] Formatage demande: ${req.id}`);
          
          const dueDate = new Date(req.due_date);
          const now = new Date();
          const isLate = dueDate < now && req.workflow_status !== 'completed';

          const formatted = {
            id: req.id,
            title: req.title || 'Sans titre',
            type: req.type || 'unknown',
            status: req.status as RequestStatus,
            createdBy: req.created_by,
            missionId: req.mission_id,
            missionName: req.mission_name || 'Sans mission',
            missionClient: req.mission_client || 'Sans client',
            sdrName: req.sdr_name || 'Inconnu',
            assignedToName: req.assigned_to_name || 'Non assigné',
            dueDate: req.due_date,
            details: req.details || {},
            workflow_status: req.workflow_status as WorkflowStatus,
            assigned_to: req.assigned_to,
            isLate,
            createdAt: new Date(req.created_at),
            lastUpdated: new Date(req.last_updated || req.updated_at),
            target_role: req.target_role
          } as Request;

          console.log(`✅ [DASHBOARD-HOOK] Demande formatée: ${formatted.id} - ${formatted.title}`);
          return formatted;
        });

        console.log("🎯 [DASHBOARD-HOOK] Formatage terminé:", formattedRequests.length, "demandes");
        console.log("🔍 [DASHBOARD-HOOK] IDs des demandes formatées:", formattedRequests.map(r => r.id.substring(0, 8)));
        
        return formattedRequests;

      } catch (error) {
        console.error("💥 [DASHBOARD-HOOK] Exception:", error);
        throw error;
      }
    },
    refetchInterval: 10000,
    retry: 2,
    retryDelay: 1000
  });

  console.log("🔍 [DASHBOARD-HOOK] Après useQuery, allRequests:", allRequests.length, "demandes");

  const handleStatCardClick = (tab: string) => {
    setActiveTab(tab);
  };

  console.log("[DEBUG] useDashboardRequests - Filtrage des requêtes avec activeTab:", activeTab);
  console.log("[DEBUG] useDashboardRequests - ShowUnassigned actif:", showUnassignedParam);

  const filteredRequests = allRequests.filter((request) => {
    console.log(`[DEBUG] useDashboardRequests - Filtrage demande ${request.id}:`, {
      activeTab,
      status: request.status,
      workflow_status: request.workflow_status,
      isLate: request.isLate,
      assignedTo: request.assigned_to,
      createdBy: request.createdBy,
      showUnassigned: showUnassignedParam,
      userId: user?.id
    });

    let matchesRole = true;
    if (isSDR && request.target_role === "growth") {
      matchesRole = false;
    }

    let matchesCreatedBy = true;
    if (createdByParam) {
      matchesCreatedBy = request.createdBy === createdByParam;
    }

    let matchesAssignedTo = true;
    if (assignedToParam) {
      matchesAssignedTo = request.assigned_to === assignedToParam;
    }

    let matchesUnassigned = true;
    if (showUnassignedParam) {
      matchesUnassigned = !request.assigned_to;
    }

    let matchesTab = true;
    switch (activeTab) {
      case "pending":
        matchesTab = request.workflow_status === "pending_assignment";
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

    const finalResult = matchesTab && matchesRole && matchesCreatedBy && matchesAssignedTo && matchesUnassigned;
    
    console.log(`[DEBUG] useDashboardRequests - Résultat final pour ${request.id}:`, finalResult);
    
    return finalResult;
  });

  console.log("🎯 [DASHBOARD-HOOK] Filtrage terminé:", filteredRequests.length, "demandes filtrées");
  console.log("🔍 [DASHBOARD-HOOK] IDs des demandes filtrées:", filteredRequests.map(r => r.id.substring(0, 8)));

  return {
    filteredRequests,
    activeTab,
    setActiveTab,
    isSDR,
    isGrowth,
    isAdmin,
    loading,
    refetch,
    handleStatCardClick,
    filterParams: {
      createdBy: createdByParam,
      assignedTo: assignedToParam,
      showUnassigned: showUnassignedParam,
      filterType: filterTypeParam,
      userName: userNameParam
    },
    requests: allRequests
  };
};
