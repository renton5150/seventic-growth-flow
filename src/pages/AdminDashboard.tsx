
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminStatsSummary } from "@/components/admin/AdminStatsSummary";
import { UserStatsTableNew } from "@/components/admin/UserStatsTableNew";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
        </div>
        
        <AdminStatsSummary />
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Statistiques par utilisateur</h2>
          <UserStatsTableNew />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
