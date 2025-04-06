
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { InviteUserDialog } from "./InviteUserDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { User, UserRole } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/userService";

export const UserManagementTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [inviteRole, setInviteRole] = useState<UserRole>("sdr");

  // Utiliser useQuery avec invalidation renforcée
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    // Désactiver complètement le cache pour ce composant
    staleTime: 0,
    cacheTime: 0,
    // Actualiser régulièrement les données 
    refetchInterval: 5000,
    // Réduire le délai de nouvelle tentative en cas d'échec
    retry: 2,
  });

  // Force refetch when the component mounts to ensure we have fresh data
  useEffect(() => {
    console.log("UserManagementTabs monté - actualisation des données");
    // Forcer plusieurs refetch avec délais croissants
    const fetchData = async () => {
      await refetch();
      setTimeout(() => refetch(), 300);
      setTimeout(() => refetch(), 1000);
    };
    
    fetchData();
    
    // Définir un intervalle pour refetch fréquent pendant que le composant est monté
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  const filteredUsers = users.filter(user => {
    if (activeTab === "all") return true;
    return user.role === activeTab;
  });

  const handleInviteClick = (role: UserRole) => {
    setInviteRole(role);
    setIsInviteDialogOpen(true);
  };

  const handleUserInvited = async () => {
    console.log("Actualisation de la liste des utilisateurs après invitation");
    
    // Séquence d'actualisations multiples avec délais progressifs
    await refetch();
    
    for (let i = 1; i <= 5; i++) {
      setTimeout(async () => {
        console.log(`Rafraîchissement #${i} après invitation`);
        await refetch();
      }, i * 500);
    }
    
    console.log("Nombre d'utilisateurs après invitation:", users.length);
  };

  console.log("Rendu de UserManagementTabs - Nombre d'utilisateurs:", users.length);

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

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleInviteClick("sdr")}
              className="border-seventic-300 hover:bg-seventic-50 text-seventic-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Inviter un SDR
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleInviteClick("growth")}
              className="border-green-300 hover:bg-green-50 text-green-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Inviter un Growth
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleInviteClick("admin")}
              className="border-blue-300 hover:bg-blue-50 text-blue-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Inviter un Admin
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <UsersTable users={filteredUsers} isLoading={isLoading} onRefresh={refetch} />
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
