
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import AcelleAccountsTable from "./AcelleAccountsTable";
import AcelleCampaignsTable from "./AcelleCampaignsTable";
import AcelleCampaignsDashboard from "./AcelleCampaignsDashboard";
import { acelleService } from "@/services/acelle/acelle-service";
import { AcelleAccount } from "@/types/acelle.types";
import { SystemStatus } from "./system/SystemStatus";
import { useAuth } from "@/contexts/AuthContext";

interface AcelleAdminPanelProps {
  onDemoModeChange?: (isDemoMode: boolean) => void;
}

export default function AcelleAdminPanel({ onDemoModeChange }: AcelleAdminPanelProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isButtonLoading, setIsButtonLoading] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { isAdmin } = useAuth();

  const { 
    data: accounts = [] as AcelleAccount[], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["acelleAccounts"],
    queryFn: acelleService.getAcelleAccounts,
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Add this useEffect to notify parent component about demo mode changes
  useEffect(() => {
    if (onDemoModeChange) {
      onDemoModeChange(isDemoMode);
    }
  }, [isDemoMode, onDemoModeChange]);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId) || accounts[0];

  const handleAccountSelect = (accountId: string) => {
    console.log("Bouton cliqué pour le compte :", accountId);
    setIsButtonLoading(accountId);
    
    setTimeout(() => {
      setSelectedAccountId(accountId);
      setIsButtonLoading(null);
      toast.success(`Compte ${accounts.find(acc => acc.id === accountId)?.name} sélectionné`);
    }, 300);
  };

  // Handle demo mode function for when API requests fail
  const handleDemoMode = (isDemo: boolean) => {
    setIsDemoMode(isDemo);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          Une erreur est survenue lors du chargement des comptes Acelle Mail.
          <Button variant="outline" onClick={() => refetch()} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && <SystemStatus />}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="accounts">Comptes</TabsTrigger>
          <TabsTrigger value="campaigns" disabled={accounts.length === 0}>
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="dashboard" disabled={accounts.length === 0}>
            Tableau de bord
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <AcelleAccountsTable />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucun compte Acelle Mail configuré. Veuillez d'abord ajouter un compte.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionner un compte</CardTitle>
                  <CardDescription>
                    Choisissez le compte Acelle Mail pour afficher ses campagnes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {accounts.map((account) => (
                      <Button
                        key={account.id}
                        variant={selectedAccountId === account.id ? "default" : "outline"}
                        onClick={() => handleAccountSelect(account.id)}
                        disabled={account.status !== "active" || isButtonLoading === account.id}
                      >
                        {isButtonLoading === account.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          account.name
                        )}
                        {account.status !== "active" && " (inactif)"}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedAccount && (
                <AcelleCampaignsTable 
                  account={selectedAccount} 
                  onDemoMode={handleDemoMode} 
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucun compte Acelle Mail configuré. Veuillez d'abord ajouter un compte.
                </p>
              </CardContent>
            </Card>
          ) : (
            <AcelleCampaignsDashboard 
              accounts={accounts} 
              onDemoMode={handleDemoMode} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
