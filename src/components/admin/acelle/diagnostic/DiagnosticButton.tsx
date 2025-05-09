
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  Database,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { diagnoseCampaignStatistics } from "@/utils/acelle/campaignStatusUtils";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiagnosticButtonProps {
  account: AcelleAccount;
  campaigns?: AcelleCampaign[];
  onForceSyncStats?: () => Promise<void>;
}

export const DiagnosticButton = ({
  account,
  campaigns = [],
  onForceSyncStats
}: DiagnosticButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  
  // Exécuter un diagnostic complet
  const runDiagnostic = async () => {
    setIsLoading(true);
    
    try {
      toast.loading("Diagnostic en cours...", { id: "diagnostic" });
      
      // 1. Collecter les données des campagnes
      const campaignDiagnostics = campaigns.map(campaign => {
        return diagnoseCampaignStatistics(campaign);
      });
      
      // 2. Vérifier les différences entre les tables
      let dbDiagnostic = null;
      try {
        const { data, error } = await supabase.rpc(
          'diagnose_campaign_statistics',
          { account_id_param: account.id }
        );
        
        if (error) {
          console.error("Erreur lors de la vérification des statistiques en base:", error);
          dbDiagnostic = { error: error.message };
        } else {
          dbDiagnostic = data;
        }
      } catch (error) {
        console.error("Exception lors de la vérification en base:", error);
        dbDiagnostic = { error: String(error) };
      }
      
      // 3. Assembler les résultats
      const results = {
        timestamp: new Date().toISOString(),
        account: {
          id: account.id,
          name: account.name,
          endpoint: account.api_endpoint,
          status: account.status,
        },
        campaigns: campaignDiagnostics,
        database: dbDiagnostic,
      };
      
      setDiagnosticResults(results);
      console.log("Résultats du diagnostic:", results);
      
      toast.success("Diagnostic terminé", { id: "diagnostic" });
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      toast.error(`Erreur: ${String(error)}`, { id: "diagnostic" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Forcer la mise à jour des statistiques
  const handleForceSync = async () => {
    if (!onForceSyncStats) {
      toast.error("Fonction de synchronisation non disponible");
      return;
    }
    
    try {
      toast.loading("Synchronisation forcée en cours...", { id: "force-sync" });
      await onForceSyncStats();
      toast.success("Synchronisation terminée", { id: "force-sync" });
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      toast.error(`Erreur: ${String(error)}`, { id: "force-sync" });
    }
  };
  
  // Exécuter la fonction SQL de réparation
  const runDatabaseFix = async () => {
    try {
      toast.loading("Réparation des statistiques en cours...", { id: "fix" });
      
      // Appeler la fonction SQL de réparation
      const { data, error } = await supabase.rpc(
        'sync_campaign_statistics_manually',
        { account_id_param: account.id }
      );
      
      if (error) {
        console.error("Erreur lors de la réparation:", error);
        toast.error(`Erreur: ${error.message}`, { id: "fix" });
        return;
      }
      
      console.log("Résultat de la réparation:", data);
      
      // Correction de l'erreur TypeScript en vérifiant la structure de la réponse
      let updatedCount = 0;
      if (data && typeof data === 'object') {
        // Vérifions si la propriété existe avant d'y accéder
        const jsonData = data as Record<string, any>;
        updatedCount = jsonData.campaigns_updated || 0;
      }
      
      toast.success(`Réparation terminée: ${updatedCount} campagnes mises à jour`, { id: "fix" });
      
      // Rafraîchir le diagnostic
      runDiagnostic();
    } catch (error) {
      console.error("Exception lors de la réparation:", error);
      toast.error(`Erreur: ${String(error)}`, { id: "fix" });
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="border-amber-500 text-amber-500 hover:bg-amber-50"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Diagnostic
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Diagnostic des statistiques</DialogTitle>
            <DialogDescription>
              Analyse des problèmes potentiels avec les statistiques de campagne
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={runDiagnostic} 
                disabled={isLoading}
              >
                <Database className="h-4 w-4 mr-2" />
                Lancer le diagnostic
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleForceSync}
                disabled={isLoading || !onForceSyncStats}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Forcer la synchronisation
              </Button>
              
              <Button 
                variant="outline" 
                onClick={runDatabaseFix}
                disabled={isLoading}
                className="border-amber-500 text-amber-500 hover:bg-amber-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Réparer les statistiques
              </Button>
            </div>
            
            {diagnosticResults && (
              <Tabs defaultValue="summary">
                <TabsList>
                  <TabsTrigger value="summary">Résumé</TabsTrigger>
                  <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
                  <TabsTrigger value="database">Base de données</TabsTrigger>
                  <TabsTrigger value="raw">Données brutes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <Card>
                    <CardHeader>
                      <CardTitle>Résumé du diagnostic</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p><strong>Compte:</strong> {diagnosticResults.account.name}</p>
                          <p><strong>Statut:</strong> {diagnosticResults.account.status}</p>
                          <p><strong>Endpoint:</strong> {diagnosticResults.account.endpoint}</p>
                        </div>
                        
                        <div>
                          <p><strong>Nombre de campagnes analysées:</strong> {diagnosticResults.campaigns.length}</p>
                          <p><strong>Horodatage:</strong> {new Date(diagnosticResults.timestamp).toLocaleString()}</p>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Problèmes potentiels</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {diagnosticResults.campaigns.filter(c => 
                              c.extractedOpenRate === 0 && c.extractedClickRate === 0
                            ).length > 0 && (
                              <li className="text-amber-600">
                                {diagnosticResults.campaigns.filter(c => 
                                  c.extractedOpenRate === 0 && c.extractedClickRate === 0
                                ).length} campagnes sans statistiques
                              </li>
                            )}
                            
                            {diagnosticResults.database?.error && (
                              <li className="text-red-600">
                                Erreur lors de la vérification de la base de données: {diagnosticResults.database.error}
                              </li>
                            )}
                            
                            {!diagnosticResults.database?.error && 
                             Array.isArray(diagnosticResults.database) && 
                             diagnosticResults.database.length === 0 && (
                              <li className="text-amber-600">
                                Aucune statistique trouvée en base de données
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="campaigns">
                  <div className="space-y-4">
                    {diagnosticResults.campaigns.map((campaign: any, index: number) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{campaign.campaignName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-sm">
                            <p><strong>ID:</strong> {campaign.campaignId}</p>
                            <p><strong>Taux d'ouverture extrait:</strong> {campaign.extractedOpenRate.toFixed(2)}%</p>
                            <p><strong>Taux de clic extrait:</strong> {campaign.extractedClickRate.toFixed(2)}%</p>
                            <p><strong>Structure complète:</strong> {campaign.hasDeliveryInfo ? 'Oui' : 'Non'}</p>
                          </div>
                          
                          <details className="text-xs">
                            <summary className="cursor-pointer">Voir les champs bruts</summary>
                            <pre className="mt-2 p-2 bg-muted/10 rounded overflow-auto max-h-32">
                              {JSON.stringify(campaign.fields, null, 2)}
                            </pre>
                          </details>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="database">
                  <Card>
                    <CardHeader>
                      <CardTitle>État en base de données</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {diagnosticResults.database?.error ? (
                        <div className="p-4 text-red-600 bg-red-50 rounded">
                          {diagnosticResults.database.error}
                        </div>
                      ) : Array.isArray(diagnosticResults.database) && diagnosticResults.database.length > 0 ? (
                        <div className="overflow-auto">
                          <table className="min-w-full border">
                            <thead>
                              <tr className="bg-muted/20">
                                <th className="p-2 border text-left">Source</th>
                                <th className="p-2 border text-left">Campaign UID</th>
                                <th className="p-2 border text-left">Total</th>
                                <th className="p-2 border text-left">Délivrés</th>
                                <th className="p-2 border text-left">Ouverts</th>
                                <th className="p-2 border text-left">Taux d'ouverture</th>
                                <th className="p-2 border text-left">Taux de clic</th>
                              </tr>
                            </thead>
                            <tbody>
                              {diagnosticResults.database.map((row: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? "" : "bg-muted/10"}>
                                  <td className="p-2 border">{row.data_source}</td>
                                  <td className="p-2 border font-mono text-xs">{row.campaign_uid}</td>
                                  <td className="p-2 border">{row.subscriber_count}</td>
                                  <td className="p-2 border">{row.delivered_count}</td>
                                  <td className="p-2 border">{row.open_count}</td>
                                  <td className="p-2 border">{row.open_rate}</td>
                                  <td className="p-2 border">{row.click_rate}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 text-amber-600 bg-amber-50 rounded">
                          Aucune donnée disponible en base de données
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="raw">
                  <Card>
                    <CardHeader>
                      <CardTitle>Données brutes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted/10 p-4 rounded overflow-auto max-h-[500px] text-xs">
                        {JSON.stringify(diagnosticResults, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
