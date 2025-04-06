
import { ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Rediriger les administrateurs vers le tableau de bord admin s'ils accèdent au tableau de bord standard
  useEffect(() => {
    if (isAdmin && window.location.pathname === "/dashboard") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAdmin, navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
