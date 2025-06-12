
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { DirectRequest } from "@/services/requests/directRequestService";

const Dashboard = () => {
  const { user, isSDR, isGrowth, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Utiliser le système DIRECT comme source unique
  const { data: directRequests = [], isLoading: loading, error, refetch } = useDirectRequests();

  console.log("🎯 [DASHBOARD] Système DIRECT intégré - Total demandes:", directRequests.length);
  console.log("🎯 [DASHBOARD] User info:", { userId: user?.id, role: user?.role, isSDR, isGrowth, isAdmin });

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

  console.log("🎯 [DASHBOARD] Demandes converties:", allRequests.length);

  // Filtrage intégré avec le système DIRECT
  const filteredRequests = allRequests.filter((request) => {
    console.log(`🔍 [DASHBOARD-FILTER] Filtrage demande ${request.id} avec activeTab: ${activeTab}`);
    
    // Filtres de rôle
    let matchesRole = true;
    if (isSDR && request.target_role === "growth") {
      matchesRole = false;
    }

    // Filtres par onglet
    let matchesTab = true;
    switch (activeTab) {
      case "all":
        // Total des demandes : exclure les terminées
        matchesTab = request.workflow_status !== "completed";
        console.log(`🔍 [DASHBOARD-FILTER] Demande ${request.id} - workflow_status: ${request.workflow_status}, match all: ${matchesTab}`);
        break;
      case "pending":
      case "to_assign":
        // En attente d'assignation = pas assigné ET pas terminé
        matchesTab = (!request.assigned_to || request.assigned_to === null) && request.workflow_status !== "completed";
        console.log(`🔍 [DASHBOARD-FILTER] Demande ${request.id} - assigned_to: ${request.assigned_to}, workflow_status: ${request.workflow_status}, match to_assign: ${matchesTab}`);
        break;
      case "my_assignments":
        // Mes demandes à traiter = assignées à moi ET pas terminées
        matchesTab = request.assigned_to === user?.id && request.workflow_status !== "completed";
        console.log(`🔍 [DASHBOARD-FILTER] Demande ${request.id} - assigned_to: ${request.assigned_to}, userId: ${user?.id}, workflow_status: ${request.workflow_status}, match my_assignments: ${matchesTab}`);
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

    const finalResult = matchesTab && matchesRole;
    console.log(`🔍 [DASHBOARD-FILTER] Demande ${request.id} - Résultat final: ${finalResult}`);
    
    return finalResult;
  });

  console.log("🎯 [DASHBOARD] Demandes filtrées final:", filteredRequests.length);

  const handleStatCardClick = (tab: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`🎯 [DASHBOARD] Click sur card: ${tab}`);
    
    // Mapper les nouveaux filtres Growth vers les anciens filtres
    let mappedTab = tab;
    if (tab === "to_assign") {
      mappedTab = "pending"; // En attente d'assignation
    } else if (tab === "my_assignments") {
      mappedTab = "inprogress"; // Mes demandes (on peut ajuster selon le besoin)
    }
    
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
          filterParams={{}}
        />

        {/* DIAGNOSTIC - Système DIRECT intégré */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-900 font-semibold">
            ✅ SYSTÈME DIRECT INTÉGRÉ - Interface simple restaurée
          </div>
          <div className="text-green-700 text-sm mt-2 space-y-1">
            <div><strong>Total demandes:</strong> {allRequests.length}</div>
            <div><strong>Demandes filtrées (onglet "{activeTab}"):</strong> {filteredRequests.length}</div>
            <div><strong>Utilisateur:</strong> {user?.role} (ID: {user?.id?.substring(0, 8)})</div>
          </div>
        </div>
        
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
