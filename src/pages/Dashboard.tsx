
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { Toaster } from "sonner";

const Dashboard = () => {
  const { 
    requests,
    isAdmin,
    refetch
  } = useDashboardRequests();

  console.log('Dashboard rendering with requests:', requests);

  const handleRequestDeleted = () => {
    refetch();
  };

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <DashboardContent
        requests={requests}
        isAdmin={isAdmin}
        onRequestDeleted={handleRequestDeleted}
      />
    </AppLayout>
  );
};

export default Dashboard;
