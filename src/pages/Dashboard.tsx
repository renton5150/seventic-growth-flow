
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { useSimpleAdminDashboard } from "@/hooks/useSimpleAdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { DirectRequest } from "@/services/requests/directRequestService";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const { user, isSDR, isGrowth, isAdmin } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Détecter si on est dans une vue admin avec filtres
  const hasAdminFilters = searchParams.has('createdBy') || searchParams.has('assignedTo') || searchParams.has('showUnassigned');
  
  console.log("🎯 [DASHBOARD] Vue détectée:", {
    isAdmin,
    hasAdminFilters,
    userRole: user?.role
  });

  // Choisir le hook approprié
  const adminDashboard = useSimpleAdminDashboard();
  const { data: directRequests = [], isLoading: directLoading, error: directError, refetch: directRefetch } = useDirectRequests();

  // Utiliser les données du hook admin si on a des filtres, sinon le système normal
  const loading = hasAdminFilters ? adminDashboard.loading : directLoading;
  const refetch = hasAdminFilters ? adminDashboard.refetch : directRefetch;
  
  // État local pour le mode normal
  const [normalActiveTab, setNormalActiveTab] = useState<string>("all");
  
  const activeTab = hasAdminFilters ? adminDashboard.activeTab : normalActiveTab;
  const setActiveTab = hasAdminFilters ? adminDashboard.setActiveTab : setNormalActiveTab;
  
  let allRequests, filteredRequests;
  
  if (hasAdminFilters && isAdmin) {
    // Mode admin avec filtres - utiliser le hook spécialisé
    allRequests = adminDashboard.allRequests;
    filteredRequests = adminDashboard.filteredRequests;
    console.log("🎯 [DASHBOARD] Mode ADMIN avec filtres - Total demandes:", allRequests.length);
  } else {
    // Mode normal - conversion des DirectRequest et filtrage manuel
    allRequests = directRequests.map((req: DirectRequest) => ({
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

    console.log("🎯 [DASHBOARD] Mode NORMAL - Total demandes:", allRequests.length);

    // Filtrage normal par rôle d'abord
    const roleFilteredRequests = allRequests.filter((request) => {
      if (isSDR) {
        return request.createdBy === user?.id;
      } else if (isGrowth && !isAdmin) {
        return request.target_role !== "sdr";
      }
      // Admin voit tout
      return true;
    });

    // Puis par onglet
    filteredRequests = roleFilteredRequests.filter((request) => {
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

    // Pour les stats, utiliser les demandes filtrées par rôle
    allRequests = roleFilteredRequests;
  }

  console.log("🎯 [DASHBOARD] Demandes filtrées final:", filteredRequests.length);

  const handleStatCardClick = hasAdminFilters && isAdmin
    ? adminDashboard.handleStatCardClick 
    : (tab: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
        console.log(`🎯 [DASHBOARD] Click sur card: ${tab}`);
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
          filterParams={hasAdminFilters ? adminDashboard.filterParams : {}}
        />
        
        <DashboardStats 
          requests={allRequests}
          onStatClick={handleStatCardClick}
          activeFilter={activeTab}
        />

        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={filteredRequests}
          isAdmin={isAdmin}
          isSDR={isSDR}
          onRequestDeleted={refetch}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
