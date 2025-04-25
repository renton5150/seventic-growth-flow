
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AcelleCampaignsDashboard from "./AcelleCampaignsDashboard";
import AcelleCampaignsTable from "./AcelleCampaignsTable";
import AcelleAccountsTable from "./AcelleAccountsTable";
import { AcelleAccount } from "@/types/acelle.types";
import { useQuery } from "@tanstack/react-query";
import { acelleService } from "@/services/acelle";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AcelleAdminPanel() {
  const [selectedAccount, setSelectedAccount] = useState<AcelleAccount | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ["acelleAccounts"],
    queryFn: () => acelleService.getAcelleAccounts()
  });

  const handleAccountSelect = (account: AcelleAccount) => {
    console.log("Compte sélectionné:", account);
    setSelectedAccount(account);
    // Afficher un toast pour confirmer la sélection
    toast.success(`Compte ${account.name} sélectionné`);
  };

  // Log pour le débogage
  useEffect(() => {
    console.log("Onglet actif:", activeTab);
    console.log("Compte sélectionné:", selectedAccount);
    console.log("Comptes disponibles:", accounts);
  }, [activeTab, selectedAccount, accounts]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-500">
            Erreur lors du chargement des comptes Acelle
          </div>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
              <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
              <TabsTrigger value="accounts">Comptes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-4">
              <AcelleCampaignsDashboard accounts={accounts} />
            </TabsContent>
            
            <TabsContent value="campaigns" className="space-y-4">
              {accounts.length === 0 ? (
                <Card className="p-6">
                  <div className="text-center">
                    Aucun compte Acelle n'a été configuré
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handleAccountSelect(account)}
                        className={`
                          px-4 py-2 rounded-md transition-colors text-sm font-medium 
                          ${selectedAccount?.id === account.id 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                          active:scale-95 pointer-events-auto z-10 relative
                        `}
                      >
                        {account.name}
                      </button>
                    ))}
                  </div>
                  {selectedAccount ? (
                    <AcelleCampaignsTable account={selectedAccount} />
                  ) : (
                    <Card className="p-6">
                      <div className="text-center">
                        Veuillez sélectionner un compte pour voir ses campagnes
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="accounts">
              <AcelleAccountsTable />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
