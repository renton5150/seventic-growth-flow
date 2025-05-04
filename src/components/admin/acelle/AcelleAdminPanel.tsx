
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AcelleAccountsTable from "@/components/admin/acelle/AcelleAccountsTable";
import { SystemStatus } from "@/components/admin/acelle/system/SystemStatus";
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface AcelleAdminPanelProps {
  onDemoModeChange?: (isDemoMode: boolean) => void;
}

export default function AcelleAdminPanel({ onDemoModeChange }: AcelleAdminPanelProps) {
  const [accounts, setAccounts] = useState<AcelleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("accounts");

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("acelle_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Convert database rows to AcelleAccount objects with correct typing
      const typedAccounts: AcelleAccount[] = data.map(acc => ({
        id: acc.id,
        created_at: acc.created_at,
        name: acc.name,
        api_endpoint: acc.api_endpoint,
        api_token: acc.api_token,
        status: acc.status as 'active' | 'inactive' | 'error',
        last_sync_date: acc.last_sync_date,
        last_sync_error: acc.last_sync_error,
        cache_priority: acc.cache_priority || 0,
        mission_id: acc.mission_id,
        updated_at: acc.updated_at,
        cache_last_updated: acc.cache_last_updated
      }));
      
      setAccounts(typedAccounts);
    } catch (err) {
      console.error("Erreur lors de la récupération des comptes:", err);
      setError("Erreur lors de la récupération des comptes Acelle");
      toast.error("Erreur lors de la récupération des comptes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateAccount = () => {
    // Implémenter plus tard
    toast.info("La création de compte sera implémentée prochainement");
  };

  const handleEditAccount = (account: AcelleAccount) => {
    // Implémenter plus tard
    toast.info(`Édition du compte ${account.name} à implémenter`);
  };

  const handleSyncAccount = async (account: AcelleAccount) => {
    toast.info(`Synchronisation du compte ${account.name} à implémenter`);
  };

  const handleDeleteAccount = async (account: AcelleAccount) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte ${account.name} ?`)) {
      try {
        // Supprimer d'abord les caches associés
        await supabase
          .from("email_campaigns_cache")
          .delete()
          .eq("account_id", account.id);
          
        await supabase
          .from("campaign_stats_cache")
          .delete()
          .eq("account_id", account.id);

        // Puis supprimer le compte
        const { error } = await supabase
          .from("acelle_accounts")
          .delete()
          .eq("id", account.id);
        
        if (error) throw error;
        
        toast.success(`Compte ${account.name} supprimé avec succès`);
        fetchAccounts(); // Actualiser la liste
      } catch (err) {
        console.error("Erreur lors de la suppression du compte:", err);
        toast.error("Erreur lors de la suppression du compte");
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="accounts">Comptes Acelle</TabsTrigger>
          <TabsTrigger value="system">État du système</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <Card>
            <AcelleAccountsTable 
              accounts={accounts}
              isLoading={isLoading}
              error={error}
              onCreateAccount={handleCreateAccount}
              onEditAccount={handleEditAccount}
              onSyncAccount={handleSyncAccount}
              onDeleteAccount={handleDeleteAccount}
              onRefresh={fetchAccounts}
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <SystemStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
