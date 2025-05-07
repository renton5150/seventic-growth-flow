
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcelleContext } from '@/contexts/AcelleContext';
import { DeliveryStatsChart } from '@/components/admin/acelle/charts/DeliveryStatsChart';
import { StatusDistributionChart } from '@/components/admin/acelle/charts/StatusDistributionChart';
import { CampaignStatusChart } from '@/components/admin/acelle/charts/CampaignStatusChart';

const AcelleEmailCampaigns = () => {
  const { selectedAccount, demoMode } = useAcelleContext();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Email Campaign Dashboard</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <DeliveryStatsChart />
            <StatusDistributionChart />
            <CampaignStatusChart />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Statistiques d'envoi global</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Mode de démonstration: {demoMode ? 'Activé' : 'Désactivé'}</p>
              {selectedAccount && (
                <p className="text-gray-500">Compte sélectionné: {selectedAccount.name}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Liste des campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fonctionnalité à venir</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Configuration à venir</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleEmailCampaigns;
