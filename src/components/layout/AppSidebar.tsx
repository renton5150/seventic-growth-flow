
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { CalendarDays, Layers, LineChart, LogOut, Mail, PanelLeft, User, Users, BarChart3, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";

export const AppSidebar = () => {
  const { pathname } = useLocation();
  const { logout, user, isAdmin, isGrowth, isSDR } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("Sidebar - État utilisateur:", 
      user ? `${user.name} (${user.role})` : "non connecté",
      "isAdmin:", isAdmin,
      "isGrowth:", isGrowth,
      "isSDR:", isSDR
    );
  }, [user, isAdmin, isGrowth, isSDR]);

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    
    // Couleur différente selon le rôle
    if (isAdmin) {
      return isActive ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 hover:text-blue-600";
    } else if (isGrowth) {
      return isActive ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600";
    } else {
      return isActive ? "bg-seventic-100 text-seventic-700" : "hover:bg-seventic-50 hover:text-seventic-600";
    }
  };

  return (
    <Sidebar
      className={`border-r ${
        isAdmin 
          ? "border-blue-300" 
          : isGrowth 
            ? "border-green-300" 
            : "border-seventic-300"
      }`}
    >
      <SidebarHeader>
        <h2 className="text-xl font-semibold flex items-center">
          <PanelLeft className="mr-2 h-5 w-5" />
          {isAdmin 
            ? <span className="text-blue-700">Admin</span> 
            : isGrowth 
              ? <span className="text-green-700">Growth</span>
              : <span className="text-seventic-700">SDR</span>
          }
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {/* Montrer le tableau de bord approprié selon le rôle */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={getLinkClass(isAdmin ? "/admin/dashboard" : "/dashboard")}>
              <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>
                <Layers className="h-5 w-5 mr-3" />
                {isAdmin ? "Dashboard Admin" : "Dashboard"}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Missions - accessible par tous les types d'utilisateurs */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={getLinkClass("/missions")}>
              <Link to="/missions">
                <Briefcase className="h-5 w-5 mr-3" />
                Missions
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {!isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={getLinkClass("/calendar")}>
                <Link to="/calendar">
                  <CalendarDays className="h-5 w-5 mr-3" />
                  Calendrier
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          {/* Liens pour Growth et Admin */}
          {(isAdmin || isGrowth) && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={getLinkClass("/growth")}>
                <Link to="/growth">
                  <LineChart className="h-5 w-5 mr-3" />
                  {isAdmin ? "Gestion Growth" : "Tableau de bord Growth"}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          {/* Liens pour l'administrateur */}
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={getLinkClass("/admin/dashboard")}>
                  <Link to="/admin/dashboard">
                    <BarChart3 className="h-5 w-5 mr-3" />
                    Tableau Admin
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={getLinkClass("/admin/users")}>
                  <Link to="/admin/users">
                    <Users className="h-5 w-5 mr-3" />
                    Gestion Utilisateurs
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
        <div className="mt-auto p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
