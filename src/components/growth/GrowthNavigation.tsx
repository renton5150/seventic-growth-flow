
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { 
  LayoutDashboard, 
  ListTodo, 
  UserSquare2,
  Briefcase,
  Calendar,
  ListChecks 
} from "lucide-react";

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
    <NavigationMenu orientation="vertical" className="w-full max-w-none">
      <NavigationMenuList className="flex-col items-start w-full space-y-1">
        <NavigationMenuItem className="w-full">
          <Link to="/growth" className={getLinkClass("/growth")}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Tableau de bord</span>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem className="w-full">
          <NavigationMenuTrigger className="w-full justify-start gap-2">
            <ListChecks className="h-4 w-4" />
            <span>Demandes</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-48 p-2 space-y-1">
              <Link 
                to="/growth/to-assign" 
                className={getLinkClass("/growth/to-assign")}
              >
                <ListTodo className="h-4 w-4" />
                <span>À affecter</span>
                <CountBadge count={pendingCount} />
              </Link>
              <Link 
                to="/growth/my-requests" 
                className={getLinkClass("/growth/my-requests")}
              >
                <UserSquare2 className="h-4 w-4" />
                <span>Mes demandes</span>
                <CountBadge count={myRequestsCount} />
              </Link>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem className="w-full">
          <Link to="/missions" className={getLinkClass("/missions")}>
            <Briefcase className="h-4 w-4" />
            <span>Missions</span>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem className="w-full">
          <Link to="/calendar" className={getLinkClass("/calendar")}>
            <Calendar className="h-4 w-4" />
            <span>Calendrier</span>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
