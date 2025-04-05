
import { CalendarDays, Database, Mail, User, Home, FileSpreadsheet, Settings, LogOut, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";
  const isSdr = user?.role === "sdr";

  // Couleurs spécifiques au rôle pour le header
  const getHeaderClass = () => {
    switch (user?.role) {
      case "admin":
        return "bg-blue-700";
      case "growth":
        return "bg-green-700";
      case "sdr":
        return "bg-seventic-400";
      default:
        return "bg-gray-700";
    }
  };

  // Couleurs spécifiques au rôle pour les boutons
  const getButtonHoverClass = () => {
    switch (user?.role) {
      case "admin":
        return "hover:bg-blue-600";
      case "growth":
        return "hover:bg-green-600";
      case "sdr":
        return "hover:bg-seventic-500";
      default:
        return "hover:bg-gray-600";
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className={`py-6 ${getHeaderClass()}`}>
        <div className="flex items-center px-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-white text-zinc-800 flex items-center justify-center font-bold text-xl">S</div>
            <h1 className="text-xl font-semibold text-white">
              {isAdmin ? "Admin" : isGrowth ? "Growth" : "SDR"} Flow
            </h1>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className={isAdmin ? "bg-blue-50" : isGrowth ? "bg-green-50" : "bg-seventic-50"}>
        <SidebarGroup>
          <SidebarGroupLabel className={isAdmin ? "text-blue-700" : isGrowth ? "text-green-700" : "text-seventic-700"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/dashboard")} className={getButtonHoverClass()}>
                  <button>
                    <Home size={20} />
                    <span>Tableau de bord</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/missions")} className={getButtonHoverClass()}>
                  <button>
                    <FileSpreadsheet size={20} />
                    <span>Missions</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(isGrowth || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={() => navigate("/growth")} className={getButtonHoverClass()}>
                    <button>
                      <BarChart size={20} />
                      <span>Dashboard Growth</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={isAdmin ? "text-blue-700" : isGrowth ? "text-green-700" : "text-seventic-700"}>
            Demandes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isSdr && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={() => navigate("/requests/email/new")} className={getButtonHoverClass()}>
                      <button>
                        <Mail size={20} />
                        <span>Campagnes Email</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={() => navigate("/requests/database/new")} className={getButtonHoverClass()}>
                      <button>
                        <Database size={20} />
                        <span>Création de bases</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={() => navigate("/requests/linkedin/new")} className={getButtonHoverClass()}>
                      <button>
                        <User size={20} />
                        <span>Scrapping LinkedIn</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/calendar")} className={getButtonHoverClass()}>
                  <button>
                    <CalendarDays size={20} />
                    <span>Calendrier</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className={isAdmin ? "bg-blue-50" : isGrowth ? "bg-green-50" : "bg-seventic-50"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/settings")} className={getButtonHoverClass()}>
                  <button>
                    <Settings size={20} />
                    <span>Paramètres</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={handleLogout} className={getButtonHoverClass()}>
                  <button>
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      
      <div className="flex items-center justify-center p-2 mb-2">
        <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
