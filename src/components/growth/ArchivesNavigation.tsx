
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Archive,
  FileText
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export const ArchivesNavigation = () => {
  const { pathname } = useLocation();

  return (
    <SidebarMenu>
      {/* Tableau de bord */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname === "/growth" ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/growth" className="flex items-center gap-2 w-full">
            <LayoutDashboard className="h-4 w-4" />
            <span>Tableau de bord</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Archives */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname === "/archives" ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/archives" className="flex items-center gap-2 w-full">
            <Archive className="h-4 w-4" />
            <span>Archives</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {/* Requêtes */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname.includes("/requests") ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/growth" className="flex items-center gap-2 w-full">
            <FileText className="h-4 w-4" />
            <span>Requêtes</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
