
import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { InviteUserDialog } from "./InviteUserDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, RefreshCw } from "lucide-react";
import { User, UserRole } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface UserManagementTabsProps {
  onUserDataChange?: () => void;
}

export const UserManagementTabs = ({ onUserDataChange }: UserManagementTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [inviteRole, setInviteRole] = useState<UserRole>("sdr");
  const isRefreshingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    staleTime: 5000, // Augmenter le temps de fraîcheur pour réduire les requêtes
    gcTime: 60000,  // Augmenter le temps de cache
    retry: 1,       // Réduire le nombre de tentatives
  });

  // Optimized refetch with debounce
  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return;
    }
    
    isRefreshingRef.current = true;
    
    try {
      await refetch();
      
      // Notifier le composant parent après un délai
      if (onUserDataChange) {
        onUserDataChange();
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      // Limiter la fréquence des rafraîchissements
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 2000); // Attendre 2 secondes avant de permettre un nouveau rafraîchissement
    }
  }, [refetch, onUserDataChange]);

  // Premier chargement uniquement
  useEffect(() => {
    if (!initialLoadDoneRef.current && !isLoading && users.length > 0) {
      initialLoadDoneRef.current = true;
      console.log("Premier chargement des données terminé");
    }
  }, [isLoading, users]);

  const filteredUsers = users.filter(user => {
    if (activeTab === "all") return true;
    return user.role === activeTab;
  });

  const handleInviteClick = (role: UserRole) => {
    setInviteRole(role);
    setIsInviteDialogOpen(true);
  };

  const handleUserInvited = async () => {
    console.log("Utilisateur invité, rafraîchissement des données");
    
    // Attendre avant de rafraîchir pour éviter le gel
    setTimeout(() => {
      handleRefresh();
    }, 1000);
  };

  return (
    <>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <TabsList className="bg-blue-50">
            <TabsTrigger value="all" className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100">
              Tous les utilisateurs
            </TabsTrigger>
            <TabsTrigger value="sdr" className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100">
              SDR
            </TabsTrigger>
            <TabsTrigger value="growth" className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100">
              Growth
            </TabsTrigger>
            <TabsTrigger value="admin" className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100">
              Administrateurs
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshingRef.current}
              title="Rafraîchir les données"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingRef.current ? 'animate-spin' : ''}`} />
              <span className="sr-only">Rafraîchir</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2" disabled={isRefreshingRef.current}>
                  <PlusCircle className="h-4 w-4" />
                  <span>Inviter un collaborateur</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleInviteClick("sdr")}>
                  Inviter un SDR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleInviteClick("growth")}>
                  Inviter un Growth
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleInviteClick("admin")}>
                  Inviter un Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <UsersTable 
            users={filteredUsers} 
            isLoading={isLoading || isRefreshingRef.current} 
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      <InviteUserDialog 
        open={isInviteDialogOpen} 
        onOpenChange={setIsInviteDialogOpen} 
        defaultRole={inviteRole}
        onUserInvited={handleUserInvited}
      />
    </>
  );
};
