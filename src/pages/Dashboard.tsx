
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Request } from "@/types/types";

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
  
  console.log("🎯 [DASHBOARD-FIXED] Paramètres URL admin:", {
    isAdmin,
    hasAdminFilters,
    createdBy: createdByParam,
    assignedTo: assignedToParam,
    showUnassigned: showUnassignedParam,
    userName: userNameParam,
    userRole: user?.role
  });

  // Hook simplifié pour récupérer les demandes
  const { data: allRequests = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['dashboard-requests-fixed', user?.id, hasAdminFilters, createdByParam, assignedToParam, showUnassignedParam],
    queryFn: async () => {
      if (!user?.id) {
        console.log("🎯 [DASHBOARD-FIXED] Pas d'utilisateur connecté");
        return [];
      }
      
      console.log("🎯 [DASHBOARD-FIXED] Récupération des demandes pour:", user.role);
      
      try {
        let query = supabase
          .from('requests')
          .select(`
            id,
            title,
            type,
            status,
            created_by,
            mission_id,
            assigned_to,
            due_date,
            details,
            workflow_status,
            created_at,
            updated_at,
            target_role,
            missions!inner(name, client),
            created_by_profile:profiles!requests_created_by_fkey(name),
            assigned_to_profile:profiles!requests_assigned_to_fkey(name)
          `)
          .order('created_at', { ascending: false });

        // Appliquer les filtres admin si nécessaire
        if (isAdmin && hasAdminFilters) {
          console.log("🎯 [DASHBOARD-FIXED] Application des filtres admin");
          
          if (createdByParam) {
            query = query.eq('created_by', createdByParam);
            console.log("🎯 [DASHBOARD-FIXED] Filtre par createdBy:", createdByParam);
          }
          
          if (assignedToParam) {
            query = query.eq('assigned_to', assignedToParam);
            console.log("🎯 [DASHBOARD-FIXED] Filtre par assignedTo:", assignedToParam);
          }
          
          if (showUnassignedParam) {
            query = query.is('assigned_to', null);
            console.log("🎯 [DASHBOARD-FIXED] Filtre demandes non assignées");
          }
        } else if (!isAdmin) {
          // Filtres normaux par rôle
          if (isSDR) {
            query = query.eq('created_by', user.id);
            console.log("🎯 [DASHBOARD-FIXED] Filtre SDR - mes demandes");
          } else if (isGrowth) {
            query = query.neq('target_role', 'sdr');
            console.log("🎯 [DASHBOARD-FIXED] Filtre Growth - pas de demandes SDR");
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error("🎯 [DASHBOARD-FIXED] Erreur Supabase:", error);
          throw error;
        }

        console.log("🎯 [DASHBOARD-FIXED] Demandes récupérées:", data?.length || 0);

        // Formatter les données
        const formattedRequests: Request[] = (data || []).map((req: any) => {
          const now = new Date();
          const dueDate = new Date(req.due_date);
          const isLate = dueDate < now && req.workflow_status !== 'completed';

          return {
            id: req.id,
            title: req.title,
            type: req.type,
            status: req.status,
            createdBy: req.created_by,
            missionId: req.mission_id,
            missionName: req.missions?.name || 'Sans mission',
            missionClient: req.missions?.client || '',
            sdrName: req.created_by_profile?.name || 'Inconnu',
            assignedToName: req.assigned_to_profile?.name || null,
            dueDate: req.due_date,
            details: req.details,
            workflow_status: req.workflow_status,
            assigned_to: req.assigned_to,
            isLate,
            createdAt: new Date(req.created_at),
            lastUpdated: new Date(req.updated_at),
            target_role: req.target_role || 'growth'
          };
        });

        console.log("🎯 [DASHBOARD-FIXED] Demandes formatées:", formattedRequests.length);
        return formattedRequests;
        
      } catch (error) {
        console.error("🎯 [DASHBOARD-FIXED] Erreur lors de la récupération:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 10000
  });
  
  // État local pour les onglets
  const [activeTab, setActiveTab] = useState<string>("all");
  
  console.log("🎯 [DASHBOARD-FIXED] Total demandes récupérées:", allRequests.length);

  // Appliquer les filtres par onglet
  const finalFilteredRequests = allRequests.filter((request) => {
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

  console.log("🎯 [DASHBOARD-FIXED] Demandes finales après filtre onglet:", finalFilteredRequests.length);

  const handleStatCardClick = (tab: "all" | "pending" | "completed" | "late" | "inprogress" | "to_assign" | "my_assignments") => {
    console.log(`🎯 [DASHBOARD-FIXED] Click sur card: ${tab}`);
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
          requests={allRequests}
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
