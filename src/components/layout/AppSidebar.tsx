
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Calendar, LayoutDashboard, Users, FileText, Database, BrainCircuit } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils/permissionUtils";
import { MenuSection } from "./sidebar/MenuSection";
import { UserProfile } from "./sidebar/UserProfile";
import { adminMenuItems, growthMenuItems, sdrMenuItems } from "./sidebar/config";

export const AppSidebar = () => {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Tableau de bord
              </Link>
            </div>

            {isSDR && <MenuSection title="SDR" items={sdrMenuItems} />}
            {isGrowth && <MenuSection title="Growth" items={growthMenuItems} />}
            {isAdmin && <MenuSection title="Administration" items={adminMenuItems} />}
          </nav>

          <div className="mt-auto pt-4 border-t">
            <UserProfile user={user} />
          </div>
        </div>
      )}
    </div>
  );
};
