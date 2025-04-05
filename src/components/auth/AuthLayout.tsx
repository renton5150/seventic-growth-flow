
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <h1 className="text-3xl font-bold text-seventic-500">Seventic Growth Flow</h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
