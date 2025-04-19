
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { InviteUserDialog } from "./InviteUserDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, RefreshCw } from "lucide-react";
import { User, UserRole } from "@/types/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  // Optimized refetch that prevents concurrent refreshes
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return;
    }
    
    const toastId = toast.loading("Rafraîchissement des données...", {
      duration: 2000
    });
    
    console.log("Rafraîchissement manuel des utilisateurs");
    setIsRefreshing(true);
    
    try {
      // Invalider les requêtes avant de rafraîchir
      queryClient.invalidateQueries({ 
        queryKey: ['admin-users'],
        refetchType: 'all'
      });
      
      // Attendre un peu pour éviter les problèmes de concurrence
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Lancer un rafraîchissement explicite
      await refetch();
      
      // Montrer un message de succès
      toast.success("Données rafraîchies", { id: toastId });
      
      // Notifier le composant parent après un délai
      if (onUserDataChange) {
        setTimeout(() => {
          onUserDataChange();
        }, 100);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      toast.error("Erreur lors du rafraîchissement", { id: toastId });
    } finally {
      // Reset l'état après un délai pour éviter les doubles clics
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [refetch, onUserDataChange, isRefreshing, queryClient]);

  // Rafraîchissement initial uniquement
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted && onUserDataChange) {
      console.log("UserManagementTabs monté - rafraîchissement initial");
      handleRefresh();
    }
    
    return () => {
      isMounted = false;
      setIsRefreshing(false);
    };
  }, [handleRefresh, onUserDataChange]);

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
    }, 300);
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
              disabled={isRefreshing}
              title="Rafraîchir les données"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Rafraîchir</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2" disabled={isRefreshing}>
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
            isLoading={isLoading || isRefreshing} 
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
