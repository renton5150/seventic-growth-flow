
import { CalendarDays, Database, Mail, User, Home, FileSpreadsheet, Settings, LogOut } from "lucide-react";
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

  return (
    <Sidebar>
      <SidebarHeader className="py-6">
        <div className="flex items-center px-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-seventic-400 text-white flex items-center justify-center font-bold text-xl">S</div>
            <h1 className="text-xl font-semibold text-white">Seventic Flow</h1>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/dashboard")}>
                  <button>
                    <Home size={20} />
                    <span>Tableau de bord</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/missions")}>
                  <button>
                    <FileSpreadsheet size={20} />
                    <span>Missions</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Demandes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/requests/email")}>
                  <button>
                    <Mail size={20} />
                    <span>Campagnes Email</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/requests/database")}>
                  <button>
                    <Database size={20} />
                    <span>Création de bases</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/requests/linkedin")}>
                  <button>
                    <User size={20} />
                    <span>Scrapping LinkedIn</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/calendar")}>
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
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate("/settings")}>
                  <button>
                    <Settings size={20} />
                    <span>Paramètres</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={handleLogout}>
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
