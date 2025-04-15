
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  ListTodo, 
  UserSquare2,
  Briefcase,
  Calendar,
  ListChecks 
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export const GrowthNavigation = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Query for pending assignments count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['growth-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('workflow_status', 'pending_assignment')
        .eq('target_role', 'growth');
      
      if (error) {
        console.error('Error fetching pending count:', error);
        return 0;
      }
      return count || 0;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Query for my assignments count
  const { data: myRequestsCount = 0 } = useQuery({
    queryKey: ['growth-my-requests-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id);
      
      if (error) {
        console.error('Error fetching my requests count:', error);
        return 0;
      }
      return count || 0;
    },
    refetchInterval: 30000
  });

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-2 w-full p-2 rounded-md transition-colors ${
      isActive 
        ? "bg-green-100 text-green-700" 
        : "hover:bg-green-50 hover:text-green-600"
    }`;
  };

  const CountBadge = ({ count }: { count: number }) => (
    <span className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
      {count}
    </span>
  );

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

      {/* Demandes avec sous-menu */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={
          pathname === "/growth/to-assign" || pathname === "/growth/my-requests"
            ? "bg-green-100 text-green-700" 
            : "hover:bg-green-50 hover:text-green-600"
        }>
          <Link to="#" className="flex items-center gap-2 w-full">
            <ListChecks className="h-4 w-4" />
            <span>Demandes</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Sous-menu pour Demandes */}
      <SidebarMenuItem className="pl-6">
        <SidebarMenuButton asChild className={pathname === "/growth/to-assign" ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/growth/to-assign" className="flex items-center gap-2 w-full">
            <ListTodo className="h-4 w-4" />
            <span>À affecter</span>
            <CountBadge count={pendingCount} />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem className="pl-6">
        <SidebarMenuButton asChild className={pathname === "/growth/my-requests" ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/growth/my-requests" className="flex items-center gap-2 w-full">
            <UserSquare2 className="h-4 w-4" />
            <span>Mes demandes</span>
            <CountBadge count={myRequestsCount} />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Missions */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname === "/missions" ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/missions" className="flex items-center gap-2 w-full">
            <Briefcase className="h-4 w-4" />
            <span>Missions</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Calendrier */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname === "/calendar" ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/calendar" className="flex items-center gap-2 w-full">
            <Calendar className="h-4 w-4" />
            <span>Calendrier</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
