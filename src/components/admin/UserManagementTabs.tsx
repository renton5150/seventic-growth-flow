
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { InviteUserDialog } from "./InviteUserDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown } from "lucide-react";
import { User, UserRole } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface UserManagementTabsProps {
  onUserDataChange?: () => void;
}

export const UserManagementTabs = ({ onUserDataChange }: UserManagementTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [inviteRole, setInviteRole] = useState<UserRole>("sdr");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    staleTime: 0, // Force TanStack Query to always check for new data
    gcTime: 0, // Don't cache results
    retry: 2,
  });

  // Moins d'appels à refetch pour éviter de surcharger l'API
  useEffect(() => {
    if (onUserDataChange) {
      console.log("UserManagementTabs monté - rafraîchissement initial");
      refetch();
    }
  }, [refetch, onUserDataChange]);

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
    
    try {
      await refetch();
      
      // Notify parent component if callback exists
      if (onUserDataChange) {
        onUserDataChange();
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données après invitation:", error);
    }
  };
  
  const handleRefresh = () => {
    console.log("Rafraîchissement manuel des utilisateurs");
    refetch();
  };

  return (
    <>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
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

          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2">
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
          <UsersTable users={filteredUsers} isLoading={isLoading} onRefresh={handleRefresh} />
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
