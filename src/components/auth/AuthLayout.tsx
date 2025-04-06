
import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("AuthLayout: User is authenticated, redirecting");
      console.log("isAdmin:", isAdmin);
      
      // Augmenter le délai pour permettre la récupération complète du rôle
      setTimeout(() => {
        if (isAdmin) {
          console.log("Redirection admin vers /admin/dashboard");
          navigate("/admin/dashboard", { replace: true });
        } else {
          console.log("Redirection utilisateur vers /dashboard");
          navigate("/dashboard", { replace: true });
        }
      }, 800); // Délai augmenté pour garantir que le rôle soit correctement détecté
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <p>Chargement...</p>
          <div className="mt-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-seventic-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
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
