
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
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

  // Utiliser le hook approprié selon le contexte
  const adminDashboard = useAdminDashboard();
  const { data: directRequests = [], isLoading: directLoading, error: directError, refetch: directRefetch } = useDirectRequests();

  // Choisir les données selon le contexte
  const loading = hasAdminFilters ? adminDashboard.loading : directLoading;
  const refetch = hasAdminFilters ? adminDashboard.refetch : directRefetch;
  const activeTab = hasAdminFilters ? adminDashboard.activeTab : useState<string>("all")[0];
  const setActiveTab = hasAdminFilters ? adminDashboard.setActiveTab : useState<string>("all")[1];
  
  let allRequests, filteredRequests;
  
  if (hasAdminFilters) {
    // Mode admin avec filtres
    allRequests = adminDashboard.allRequests;
    filteredRequests = adminDashboard.filteredRequests;
    console.log("🎯 [DASHBOARD] Mode ADMIN avec filtres - Total demandes:", allRequests.length);
  } else {
    // Mode normal - conversion des DirectRequest
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

    // Filtrage normal
    filteredRequests = allRequests.filter((request) => {
      console.log(`🔍 [DASHBOARD-FILTER] Filtrage demande ${request.id} avec activeTab: ${activeTab}`);
      
      // Filtres de rôle : les SDR ne voient que leurs demandes
      let matchesRole = true;
      if (isSDR) {
        matchesRole = request.createdBy === user?.id;
        console.log(`🔍 [DASHBOARD-FILTER] SDR filter - demande ${request.id} createdBy: ${request.createdBy}, userId: ${user?.id}, match: ${matchesRole}`);
      } else if (isGrowth && !isAdmin) {
        matchesRole = request.target_role !== "sdr";
        console.log(`🔍 [DASHBOARD-FILTER] Growth filter - demande ${request.id} target_role: ${request.target_role}, match: ${matchesRole}`);
      }

      // Filtres par onglet
      let matchesTab = true;
      switch (activeTab) {
        case "all":
          matchesTab = request.workflow_status !== "completed";
          break;
        case "pending":
        case "to_assign":
          matchesTab = (!request.assigned_to || request.assigned_to === null) && request.workflow_status !== "completed";
          break;
        case "my_assignments":
          matchesTab = request.assigned_to === user?.id && request.workflow_status !== "completed";
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

      return matchesTab && matchesRole;
    });
  }

  console.log("🎯 [DASHBOARD] Demandes filtrées final:", filteredRequests.length);

  const handleStatCardClick = hasAdminFilters 
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
