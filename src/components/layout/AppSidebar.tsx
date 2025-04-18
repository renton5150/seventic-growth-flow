
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils/permissionUtils";
import { MenuSection } from "./sidebar/MenuSection";
import { UserProfile } from "./sidebar/UserProfile";
import { adminMenuItems, growthMenuItems, sdrMenuItems } from "./sidebar/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  const isSDR = user?.role === "sdr";

  const handleLogout = async () => {
    try {
      const success = await logout();
      if (success) {
        toast.success("Déconnexion réussie");
        navigate("/login");
      } else {
        toast.error("Échec de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur inattendue lors de la déconnexion");
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive("/dashboard")
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Tableau de bord
              </Link>
            </div>

            {/* Élément de menu Planning pour tous les utilisateurs */}
            <div className="mb-4">
              <Link
                to="/planning"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive("/planning")
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <CalendarDays className="mr-3 h-4 w-4" />
                Planning
              </Link>
            </div>

            {isSDR && <MenuSection title="SDR" items={sdrMenuItems} />}
            {isGrowth && <MenuSection title="Growth" items={growthMenuItems} />}
            {isAdmin && <MenuSection title="Administration" items={adminMenuItems} />}
          </nav>

          <div className="mt-auto pt-4 border-t">
            <UserProfile user={user} />
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="w-full mt-2 text-muted-foreground hover:text-foreground flex items-center justify-start"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
