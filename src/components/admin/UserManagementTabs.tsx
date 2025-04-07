
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserTabs } from "./users/UserTabs";
import { UserInviteButtons } from "./users/UserInviteButtons";
import { useUserManagement } from "@/hooks/admin/useUserManagement";
import { UserRole } from "@/types/types";

export const UserManagementTabs = () => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [inviteRole, setInviteRole] = useState<UserRole>("sdr");
  
  const {
    activeTab,
    setActiveTab,
    filteredUsers,
    isLoading,
    refetch,
    handleUserInvited
  } = useUserManagement();

  const handleInviteClick = (role: UserRole) => {
    setInviteRole(role);
    setIsInviteDialogOpen(true);
  };

  return (
    <>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <UserTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          <UserInviteButtons onInviteClick={handleInviteClick} />
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <UsersTable 
            users={filteredUsers} 
            isLoading={isLoading} 
            onRefresh={refetch} 
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
