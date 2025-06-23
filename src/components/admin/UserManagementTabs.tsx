
import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { InviteUserDialog } from "./InviteUserDialog";
import AdminEmailDiagnostic from "./AdminEmailDiagnostic";
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
    staleTime: 30000, // Increase stale time to 30 seconds
    gcTime: 300000,   // Increase cache time to 5 minutes
    retry: 1,
  });

  // Optimized refetch with debounce
  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    
    try {
      await refetch();
      
      // Notify parent component after a delay
      if (onUserDataChange) {
        setTimeout(() => onUserDataChange(), 300);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      // Limit refresh frequency
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 2000);
    }
  }, [refetch, onUserDataChange]);

  // First load only
  useEffect(() => {
    if (!initialLoadDoneRef.current && !isLoading && users.length > 0) {
      initialLoadDoneRef.current = true;
    }
  }, [isLoading, users]);

  const filteredUsers = users.filter(user => {
    if (activeTab === "all") return true;
    return user.role === activeTab;
  });

  const handleInviteClick = (role: UserRole) => {
    // Set role first, then open dialog after a small delay
    setInviteRole(role);
    setTimeout(() => setIsInviteDialogOpen(true), 50);
  };

  const handleUserInvited = async () => {
    // Wait before refreshing to avoid freezing
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
            <TabsTrigger value="diagnostic" className="border-red-300 data-[state=active]:border-red-500 data-[state=active]:bg-red-100">
              Diagnostic Email
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
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Inviter un collaborateur</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleInviteClick("sdr")} className="cursor-pointer">
                  Inviter un SDR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleInviteClick("growth")} className="cursor-pointer">
                  Inviter un Growth
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleInviteClick("admin")} className="cursor-pointer">
                  Inviter un Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <UsersTable 
            users={filteredUsers} 
            isLoading={isLoading} 
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="sdr" className="mt-4">
          <UsersTable 
            users={filteredUsers} 
            isLoading={isLoading} 
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="growth" className="mt-4">
          <UsersTable 
            users={filteredUsers} 
            isLoading={isLoading} 
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <UsersTable 
            users={filteredUsers} 
            isLoading={isLoading} 
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="diagnostic" className="mt-4">
          <AdminEmailDiagnostic />
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
