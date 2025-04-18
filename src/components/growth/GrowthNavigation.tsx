
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  UserSquare2,
  Calendar
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export const GrowthNavigation = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

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

      {/* Mes demandes */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname.includes("/growth/my-requests") ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/growth/my-requests" className="flex items-center gap-2 w-full">
            <UserSquare2 className="h-4 w-4" />
            <span>Mes demandes</span>
            {myRequestsCount > 0 && <CountBadge count={myRequestsCount} />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Calendrier */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={pathname.includes("/calendar") ? "bg-green-100 text-green-700" : "hover:bg-green-50 hover:text-green-600"}>
          <Link to="/calendar" className="flex items-center gap-2 w-full">
            <Calendar className="h-4 w-4" />
            <span>Calendrier</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
