
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";

export const DashboardWithRedirect = () => {
  const { user } = useAuth();
  const isGrowth = user?.role === "growth";

  if (isGrowth) {
    return <Navigate to="/growth" replace />;
  }

  return <Dashboard />;
};
