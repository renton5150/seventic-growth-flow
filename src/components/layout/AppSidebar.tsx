
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavGroup, SidebarNavLink } from "@/components/ui/sidebar";
import { CalendarDays, Database, Layers, LineChart, LogOut, Mail, PanelLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMobile } from "@/hooks/use-mobile";

export const AppSidebar = () => {
  const { pathname } = useLocation();
  const { logout, user, isAdmin, isGrowth, isSDR } = useAuth();
  const { isMobile } = useMobile();

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
      defaultCollapsed={isMobile}
      collapsed={isMobile}
      className={`border-r ${
        isAdmin 
          ? "border-blue-300" 
          : isGrowth 
            ? "border-green-300" 
            : "border-seventic-300"
      }`}
    >
      <SidebarHeader>
        <h2 className="text-lg font-semibold flex items-center">
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
        <SidebarNav>
          <SidebarNavGroup>
            <SidebarNavLink asChild className={getLinkClass("/dashboard")}>
              <Link to="/dashboard">
                <Layers className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
            </SidebarNavLink>
            <SidebarNavLink asChild className={getLinkClass("/missions")}>
              <Link to="/missions">
                <User className="h-5 w-5 mr-3" />
                Missions
              </Link>
            </SidebarNavLink>
            <SidebarNavLink asChild className={getLinkClass("/requests/email/new")}>
              <Link to="/requests/email/new">
                <Mail className="h-5 w-5 mr-3" />
                Nouvelle demande email
              </Link>
            </SidebarNavLink>
            <SidebarNavLink asChild className={getLinkClass("/calendar")}>
              <Link to="/calendar">
                <CalendarDays className="h-5 w-5 mr-3" />
                Calendrier
              </Link>
            </SidebarNavLink>
            <SidebarNavLink asChild className={getLinkClass("/databases")}>
              <Link to="/databases">
                <Database className="h-5 w-5 mr-3" />
                Bases de données
              </Link>
            </SidebarNavLink>
            {(isAdmin || isGrowth) && (
              <SidebarNavLink asChild className={getLinkClass("/growth")}>
                <Link to="/growth">
                  <LineChart className="h-5 w-5 mr-3" />
                  {isAdmin ? "Gestion Growth" : "Tableau de bord Growth"}
                </Link>
              </SidebarNavLink>
            )}
          </SidebarNavGroup>
        </SidebarNav>
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
