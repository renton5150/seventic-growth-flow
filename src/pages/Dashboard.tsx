
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";

const Dashboard = () => {
  const { filteredRequests, activeTab, setActiveTab, isSDR, isAdmin, requests, refetch } = useDashboardRequests();

  const handleRequestDeleted = () => {
    // Recharger les données après suppression
    refetch();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats requests={requests} />
        <DashboardTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={filteredRequests}
          isAdmin={isAdmin}
          onRequestDeleted={handleRequestDeleted}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
