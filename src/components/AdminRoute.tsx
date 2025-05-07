
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <p className="mb-4">Vérification des permissions...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Check if user is authenticated and has admin role
  if (!isAuthenticated || user?.role !== 'admin') {
    console.log("Access denied: User is not an admin");
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

export default AdminRoute;
