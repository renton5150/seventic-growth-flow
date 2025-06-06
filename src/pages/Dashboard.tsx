
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RequestsTable } from "@/components/dashboard/requests-table/RequestsTable";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";

const Dashboard = () => {
  const {
    filteredRequests,
    activeTab,
    setActiveTab,
    loading,
    handleStatCardClick,
  } = useDashboardRequests();

  console.log(`[Dashboard] 📊 Rendu avec ${filteredRequests.length} demandes filtrées`);

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader />
        
        <DashboardStats 
          requests={filteredRequests} 
          onStatClick={handleStatCardClick}
          activeFilter={activeTab}
        />
        
        <RequestsTable 
          requests={filteredRequests} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
