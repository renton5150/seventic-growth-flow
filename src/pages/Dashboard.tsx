
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NewDashboardFilters } from "@/components/dashboard/NewDashboardFilters";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useState } from "react";
import { Toaster } from "sonner";

const Dashboard = () => {
  const [filterType, setFilterType] = useState<string | null>(null);
  
  const { 
    requests,
    filteredRequests, 
    activeTab,
    setActiveTab, 
    isSDR, 
    isAdmin,
    refetch,
  } = useDashboardRequests();

  const pendingCount = requests.filter(r => 
    r.status === "pending" || r.workflow_status === "pending_assignment"
  ).length;

  const completedCount = requests.filter(r => 
    r.workflow_status === "completed"
  ).length;

  const lateCount = requests.filter(r => r.isLate).length;

  const getFilteredData = () => {
    if (!requests) return [];
    if (!filterType) return requests;
    
    return requests.filter(request => {
      switch (filterType) {
        case 'all':
          return true;
        case 'pending':
          return request.status === "pending" || request.workflow_status === "pending_assignment";
        case 'completed':
          return request.workflow_status === "completed";
        case 'late':
          return request.isLate;
        default:
          return true;
      }
    });
  };

  const handleRequestDeleted = () => {
    refetch();
  };

  const handleFilterChange = (newFilterType: string | null) => {
    setFilterType(newFilterType);
    setActiveTab(newFilterType || "all");
  };

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <NewDashboardFilters 
          allRequests={requests}
          onFilterChange={handleFilterChange}
          pendingCount={pendingCount}
          completedCount={completedCount}
          overdueCount={lateCount}
        />
        <DashboardTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={getFilteredData()}
          isAdmin={isAdmin}
          onRequestDeleted={handleRequestDeleted}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
