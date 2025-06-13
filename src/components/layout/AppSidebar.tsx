
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils/permissionUtils";
import { MenuSection } from "./sidebar/MenuSection";
import { UserProfile } from "./sidebar/UserProfile";
import { menuItems } from "./sidebar/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  const isSDR = user?.role === "sdr";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log("Tentative de déconnexion directe depuis la sidebar");
      
      // Vérifier d'abord si une session est active
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.log("Aucune session active trouvée, redirection vers la page de connexion");
        toast.info("Aucune session active, redirection vers la page de connexion");
        navigate("/login");
        return;
      }
      
      // Tenter la déconnexion
      const logoutSuccess = await logout();
      
      if (logoutSuccess) {
        toast.success("Déconnexion réussie");
        navigate("/login");
      } else {
        // Si logout échoue, forcer une déconnexion manuelle
        console.log("Échec de la déconnexion normale, tentative de déconnexion forcée");
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Erreur lors de la déconnexion forcée:", error);
          toast.error("Problème lors de la déconnexion");
        } else {
          toast.success("Déconnexion réussie");
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Organiser les items du menu par section
  const getMenuSections = () => {
    const sections: { [key: string]: any[] } = {};
    
    menuItems.forEach(item => {
      // Filtrer par rôle si nécessaire
      if (item.roles && item.roles.length > 0) {
        if (!user?.role || !item.roles.includes(user.role)) {
          return;
        }
      }
      
      const sectionName = item.section || 'GÉNÉRAL';
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      
      sections[sectionName].push({
        title: item.title,
        path: item.url,
        icon: item.icon
      });
    });
    
    return Object.entries(sections).map(([title, items]) => ({
      title,
      items
    }));
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
          <nav className="space-y-4">
            {getMenuSections().map((section) => (
              <MenuSection 
                key={section.title} 
                title={section.title} 
                items={section.items} 
              />
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t">
            <UserProfile user={user} />
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="w-full mt-2 text-muted-foreground hover:text-foreground flex items-center justify-start"
              disabled={isLoggingOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              {isLoggingOut ? 'Déconnexion en cours...' : 'Déconnexion'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
