
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LuLayoutDashboard, LuDatabase, LuLinkedin, LuBriefcase } from "react-icons/lu";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { pathname } = useLocation();
  const { isAdmin, isGrowth, isSDR } = useAuth();

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/dashboard">
                <LuLayoutDashboard className="mr-2 h-4 w-4" />
                Tableau de bord
              </Link>
            </Button>

            <Button
              variant={pathname === "/missions" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/missions">
                <LuBriefcase className="mr-2 h-4 w-4" />
                Missions
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Demandes
          </h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/database-request" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/database-request">
                <LuDatabase className="mr-2 h-4 w-4" />
                Base de données
              </Link>
            </Button>

            <Button
              variant={pathname === "/linkedin-request" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/linkedin-request">
                <LuLinkedin className="mr-2 h-4 w-4" />
                Scraping LinkedIn
              </Link>
            </Button>
          </div>
        </div>

        {isAdmin && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Administration
            </h2>
            <div className="space-y-1">
              <Button
                variant={pathname === "/admin/dashboard" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to="/admin/dashboard">
                  <LuLayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard Admin
                </Link>
              </Button>
              
              <Button
                variant={pathname === "/admin/team" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to="/admin/team">
                  <LuBriefcase className="mr-2 h-4 w-4" />
                  Équipe
                </Link>
              </Button>
              
              <Button
                variant={pathname === "/admin/requests" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to="/admin/requests">
                  <LuDatabase className="mr-2 h-4 w-4" />
                  Toutes les demandes
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
