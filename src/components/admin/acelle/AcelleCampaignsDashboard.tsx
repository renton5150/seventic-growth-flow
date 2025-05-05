
import React, { useState } from "react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AcelleAccount } from "@/types/acelle.types";
import { DeliveryStatsChart } from "./charts/DeliveryStatsChart";
import { StatusDistributionChart } from "./charts/StatusDistributionChart";
import AcelleCampaignsTable from "./AcelleCampaignsTable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
  onDemoModeChange?: (isDemoMode: boolean) => void;
}

export default function AcelleCampaignsDashboard({ 
  accounts, 
  onDemoModeChange 
}: AcelleCampaignsDashboardProps) {
  const [selectedAccount, setSelectedAccount] = useState<AcelleAccount | null>(
    accounts?.length > 0 ? accounts[0] : null
  );
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Handling demo mode toggle
  const handleDemoModeToggle = (enabled: boolean) => {
    setIsDemoMode(enabled);
    if (onDemoModeChange) {
      onDemoModeChange(enabled);
    }
  };

  // If no accounts are available
  if (!accounts || accounts.length === 0) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Aucun compte Acelle n'est configuré. Veuillez d'abord créer un compte Acelle.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter only active accounts
  const activeAccounts = accounts.filter(acc => acc.status === 'active');
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tableau de bord des campagnes</h2>
        <div className="flex items-center space-x-2">
          <Switch 
            id="demo-mode" 
            checked={isDemoMode}
            onCheckedChange={handleDemoModeToggle}
          />
          <Label htmlFor="demo-mode">Mode démonstration</Label>
        </div>
      </div>
      
      {activeAccounts.length === 0 && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Aucun compte Acelle actif n'est disponible. Activez au moins un compte pour voir les données réelles.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <StatusDistributionChart accounts={activeAccounts} demoMode={isDemoMode} />
        </Card>
        <Card className="p-4">
          <DeliveryStatsChart accounts={activeAccounts} demoMode={isDemoMode} />
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analytique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4">
          {activeAccounts.map(account => (
            <div key={account.id} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{account.name}</h3>
              <AcelleCampaignsTable 
                account={account}
                onDemoMode={handleDemoModeToggle}
                demoMode={isDemoMode}
              />
            </div>
          ))}
          
          {activeAccounts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Aucun compte actif. Activez un compte pour voir les campagnes.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card className="p-4">
            <p className="text-muted-foreground">
              Les analyses détaillées seront disponibles prochainement.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
