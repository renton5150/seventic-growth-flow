
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { DirectRequest } from "@/services/requests/directRequestService";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const { user, isSDR, isGrowth, isAdmin } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Paramètres de filtrage admin depuis l'URL
  const createdByParam = searchParams.get('createdBy');
  const assignedToParam = searchParams.get('assignedTo');
  const showUnassignedParam = searchParams.get('showUnassigned') === 'true';
  const userNameParam = searchParams.get('userName');
  
  const hasAdminFilters = !!(createdByParam || assignedToParam || showUnassignedParam);
  
  console.log("🎯 [DASHBOARD-REFONTE] Paramètres URL admin:", {
    isAdmin,
    hasAdminFilters,
    createdBy: createdByParam,
    assignedTo: assignedToParam,
    showUnassigned: showUnassignedParam,
    userName: userNameParam
  });

  const { data: directRequests = [], isLoading: loading, error, refetch } = useDirectRequests();
  
  // État local pour les onglets
  const [activeTab, setActiveTab] = useState<string>("all");
  
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

  console.log("🎯 [DASHBOARD-REFONTE] Total demandes:", allRequests.length);

  // ÉTAPE 1: Appliquer les filtres admin spéciaux si on a des paramètres URL
  let adminFilteredRequests = allRequests;
  if (isAdmin && hasAdminFilters) {
    console.log("🎯 [DASHBOARD-REFONTE] Application des filtres admin spéciaux");
    
    adminFilteredRequests = allRequests.filter((request) => {
      let matches = true;
      
      if (createdByParam) {
        matches = matches && request.createdBy === createdByParam;
        console.log(`🔍 Admin filter createdBy - request ${request.id}: ${request.createdBy} === ${createdByParam} = ${matches}`);
      }
      
      if (assignedToParam) {
        matches = matches && request.assigned_to === assignedToParam;
        console.log(`🔍 Admin filter assignedTo - request ${request.id}: ${request.assigned_to} === ${assignedToParam} = ${matches}`);
      }
      
      if (showUnassignedParam) {
        matches = matches && (!request.assigned_to || request.assigned_to === null);
        console.log(`🔍 Admin filter unassigned - request ${request.id}: ${!request.assigned_to} = ${matches}`);
      }
      
      return matches;
    });
    
    console.log("🎯 [DASHBOARD-REFONTE] Après filtres admin:", adminFilteredRequests.length);
  }

  // ÉTAPE 2: Appliquer les filtres de rôle normaux si pas de filtres admin
  let roleFilteredRequests = adminFilteredRequests;
  if (!hasAdminFilters) {
    console.log("🎯 [DASHBOARD-REFONTE] Application des filtres de rôle normaux");
    
    roleFilteredRequests = adminFilteredRequests.filter((request) => {
      if (isSDR) {
        return request.createdBy === user?.id;
      } else if (isGrowth && !isAdmin) {
        return request.target_role !== "sdr";
      }
      // Admin voit tout par défaut
      return true;
    });
    console.log("🎯 [DASHBOARD-REFONTE] Après filtre de rôle:", roleFilteredRequests.length);
  }

  // ÉTAPE 3: Appliquer les filtres par onglet
  const finalFilteredRequests = roleFilteredRequests.filter((request) => {
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

  console.log("🎯 [DASHBOARD-REFONTE] Demandes finales après tous les filtres:", finalFilteredRequests.length);

  const handleStatCardClick = (tab: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`🎯 [DASHBOARD-REFONTE] Click sur card: ${tab}`);
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader 
          isSDR={isSDR} 
          isGrowth={isGrowth} 
          isAdmin={isAdmin}
          filterParams={{
            createdBy: createdByParam,
            assignedTo: assignedToParam,
            showUnassigned: showUnassignedParam,
            userName: userNameParam
          }}
        />
        
        <DashboardStats 
          requests={roleFilteredRequests}
          onStatClick={handleStatCardClick}
          activeFilter={activeTab}
        />

        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={finalFilteredRequests}
          isAdmin={isAdmin}
          isSDR={isSDR}
          onRequestDeleted={refetch}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
