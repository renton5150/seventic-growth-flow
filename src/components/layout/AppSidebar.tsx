
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  LayoutDashboard,
  Users,
  FileText,
  Database,
  BrainCircuit,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils/permissionUtils";

export const AppSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);

  // This effect is used to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  const isSDR = user?.role === "sdr";

  return (
    <div className="h-full min-h-screen w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Avatar className="h-8 w-8 bg-seventic-500 text-white">
            <AvatarFallback>{getUserInitials("Seventic")}</AvatarFallback>
          </Avatar>
          <span className="font-bold text-lg">Seventic App</span>
        </Link>
      </div>
      {isMounted && (
        <div className="flex flex-col flex-1 p-4">
          <nav className="space-y-1">
            <div className="mb-4">
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/dashboard")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Tableau de bord
              </Link>
            </div>

            {isSDR && (
              <div className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  SDR
                </h3>
                <Link
                  to="/missions"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/missions")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Building2 className="mr-3 h-4 w-4" />
                  Missions
                </Link>
                <Link
                  to="/calendar"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/calendar")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  Calendrier
                </Link>
              </div>
            )}

            {isGrowth && (
              <div className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Growth
                </h3>
                <Link
                  to="/growth"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/growth") && !isActive("/growth/to-assign") && !isActive("/growth/my-requests")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileText className="mr-3 h-4 w-4" />
                  Toutes les demandes
                </Link>
                <Link
                  to="/growth/to-assign"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/growth/to-assign")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileText className="mr-3 h-4 w-4" />
                  À assigner
                </Link>
                <Link
                  to="/growth/my-requests"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/growth/my-requests")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileText className="mr-3 h-4 w-4" />
                  Mes demandes
                </Link>
                <Link
                  to="/databases"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/databases")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Database className="mr-3 h-4 w-4" />
                  Bases de données
                </Link>
              </div>
            )}

            {isAdmin && (
              <div className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Administration
                </h3>
                <Link
                  to="/admin/dashboard"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/admin/dashboard")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/admin/users")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Users className="mr-3 h-4 w-4" />
                  Utilisateurs
                </Link>
                <Link
                  to="/admin/missions"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/admin/missions")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Building2 className="mr-3 h-4 w-4" />
                  Missions
                </Link>
                <Link
                  to="/admin/ai-dashboard"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive("/admin/ai-dashboard")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <BrainCircuit className="mr-3 h-4 w-4" />
                  AI Insights
                </Link>
              </div>
            )}
          </nav>

          <div className="mt-auto pt-4 border-t">
            {user && (
              <div className="flex items-center px-3 py-2">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === "admin"
                      ? "Administrateur"
                      : user.role === "growth"
                        ? "Growth"
                        : "SDR"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
