
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserManagementTabs } from "./UserManagementTabs";
import { AdminStatsSummary } from "./AdminStatsSummary";
import { TargetRoleDiagnostic } from "./TargetRoleDiagnostic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Gestion des utilisateurs et statistiques de l'application
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagementTabs />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <AdminStatsSummary />
          </TabsContent>

          <TabsContent value="diagnostic" className="space-y-6">
            <TargetRoleDiagnostic />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Section système à venir...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
