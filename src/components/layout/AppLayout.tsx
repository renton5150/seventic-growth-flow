
import { ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    console.log("AppLayout - État utilisateur:", 
      user ? `${user.name} (${user.role})` : "non connecté",
      "isAdmin:", isAdmin,
      "Chemin actuel:", location.pathname
    );
    
    // Rediriger les administrateurs vers le tableau de bord admin s'ils accèdent au tableau de bord standard
    // MAIS ne pas rediriger s'ils accèdent à d'autres pages comme le planning
    if (isAdmin && location.pathname === "/dashboard") {
      console.log("Redirection vers le tableau de bord administrateur");
      toast.info("Redirection vers le tableau de bord administrateur");
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAdmin, navigate, location.pathname, user]);

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
}
