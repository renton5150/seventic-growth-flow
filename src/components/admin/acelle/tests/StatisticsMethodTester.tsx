import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw, AlertTriangle, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { AcelleAccount, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { fetchDirectStatistics } from "@/services/acelle/api/stats/directStats";
import { ensureValidStatistics } from "@/services/acelle/api/stats/validation";
import { buildDirectApiUrl } from "@/services/acelle/acelle-service";
import { extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

interface StatisticsMethodTesterProps {
  account: AcelleAccount;
  campaignUid: string;
}

interface TestResult {
  method: string;
  label: string;
  data: any;
  success: boolean;
  error?: string;
  timing?: number;
  formatted?: AcelleCampaignStatistics;
}

export const StatisticsMethodTester: React.FC<StatisticsMethodTesterProps> = ({
  account,
  campaignUid
}) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Lancer tous les tests automatiquement au chargement
  useEffect(() => {
    if (account && campaignUid) {
      runAllTests();
    }
  }, [account, campaignUid]);

  // Formatte un nombre en millisecondes
  const formatTiming = (ms?: number): string => {
    if (!ms) return "N/A";
    return `${ms.toFixed(0)}ms`;
  };

  // Convertit un objet statistique en chaîne lisible
  const formatStatsString = (stats: AcelleCampaignStatistics | null): string => {
    if (!stats) return "Aucune statistique";
    return `
      Total: ${stats.subscriber_count || 0}
      Délivrés: ${stats.delivered_count || 0} (${stats.delivered_rate?.toFixed(1) || 0}%)
      Ouvertures: ${stats.open_count || 0} (${stats.uniq_open_rate?.toFixed(1) || 0}%)
      Clics: ${stats.click_count || 0} (${stats.click_rate?.toFixed(1) || 0}%)
      Bounces: ${stats.bounce_count || 0}
    `;
  };

  // Extraction sécurisée des valeurs numériques
  const extractNumericValue = (obj: any, path: string): number => {
    try {
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === null || current === undefined) return 0;
        current = current[part];
      }
      
      if (typeof current === 'number') return current;
      if (typeof current === 'string') {
        const parsed = parseFloat(current);
        return isNaN(parsed) ? 0 : parsed;
      }
      
      return 0;
    } catch (e) {
      console.error(`Erreur lors de l'extraction de ${path}:`, e);
      return 0;
    }
  };

  // Fonction pour lancer tous les tests
  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    toast.loading("Exécution des tests de méthodes de récupération de statistiques...");
    
    try {
      // Méthode 1: Service directStats
      await testMethod1();
      
      // Méthode 2: API directe avec buildDirectApiUrl
      await testMethod2();
      
      // Méthode 3: API directe avec fetch personnalisé
      await testMethod3();
      
      // Méthode 4: Récupération depuis la base de données locale
      await testMethod4();
      
      // Méthode 5: table de cache des statistiques
      await testMethod5();
      
      // Méthode 6: API route stats legacy
      await testMethod6();
      
      // Méthode 7: API route stats v2
      await testMethod7();
      
      toast.success("Tests terminés avec succès");
    } catch (error) {
      console.error("Erreur lors de l'exécution des tests:", error);
      toast.error("Erreur lors de l'exécution des tests");
    } finally {
      setIsLoading(false);
    }
  };

  // Méthode 1: Utiliser fetchDirectStatistics depuis directStats
  const testMethod1 = async () => {
    try {
      const startTime = performance.now();
      
      // Utiliser le service directStats
      const stats = await fetchDirectStatistics(campaignUid, account);
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-1",
        label: "Service directStats",
        data: stats,
        success: !!stats && typeof stats === 'object',
        timing: endTime - startTime,
        formatted: stats || undefined
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 1:", error);
      setResults(prev => [...prev, {
        method: "method-1",
        label: "Service directStats",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 2: API directe avec buildDirectApiUrl
  const testMethod2 = async () => {
    try {
      const startTime = performance.now();
      
      const url = buildDirectApiUrl(
        `campaigns/${campaignUid}/statistics`, 
        account.api_endpoint,
        { api_token: account.api_token }
      );
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API a retourné ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const stats = ensureValidStatistics(data);
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-2",
        label: "API directe (buildDirectApiUrl)",
        data: data,
        success: !!stats && typeof stats === 'object',
        timing: endTime - startTime,
        formatted: stats
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 2:", error);
      setResults(prev => [...prev, {
        method: "method-2",
        label: "API directe (buildDirectApiUrl)",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 3: API directe avec fetch personnalisé
  const testMethod3 = async () => {
    try {
      const startTime = performance.now();
      
      const apiUrl = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/statistics?api_token=${account.api_token}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API a retourné ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const stats = ensureValidStatistics(data);
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-3",
        label: "API directe (fetch personnalisé)",
        data: data,
        success: !!stats && typeof stats === 'object',
        timing: endTime - startTime,
        formatted: stats
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 3:", error);
      setResults(prev => [...prev, {
        method: "method-3",
        label: "API directe (fetch personnalisé)",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 4: Récupération depuis la base de données locale (email_campaigns_cache)
  const testMethod4 = async () => {
    try {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('email_campaigns_cache')
        .select('delivery_info, cache_updated_at')
        .eq('campaign_uid', campaignUid)
        .eq('account_id', account.id)
        .single();
      
      if (error) throw error;
      
      const deliveryInfo = data.delivery_info;
      
      // Convertir delivery_info en AcelleCampaignStatistics
      const stats = extractStatisticsFromAnyFormat(deliveryInfo, true);
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-4",
        label: "Base de données locale (email_campaigns_cache)",
        data: {
          delivery_info: deliveryInfo,
          last_updated: data.cache_updated_at
        },
        success: !!stats,
        timing: endTime - startTime,
        formatted: stats
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 4:", error);
      setResults(prev => [...prev, {
        method: "method-4",
        label: "Base de données locale (email_campaigns_cache)",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 5: Récupération depuis la table de cache des statistiques
  const testMethod5 = async () => {
    try {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('campaign_stats_cache')
        .select('statistics, last_updated')
        .eq('campaign_uid', campaignUid)
        .eq('account_id', account.id)
        .single();
      
      if (error) throw error;
      
      const statistics = data.statistics;
      const stats = ensureValidStatistics(statistics);
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-5",
        label: "Table de cache des statistiques",
        data: {
          statistics,
          last_updated: data.last_updated
        },
        success: !!stats,
        timing: endTime - startTime,
        formatted: stats
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 5:", error);
      setResults(prev => [...prev, {
        method: "method-5",
        label: "Table de cache des statistiques",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 6: API route stats legacy
  const testMethod6 = async () => {
    try {
      const startTime = performance.now();
      
      const apiUrl = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/tracking-log?api_token=${account.api_token}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API a retourné ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Essayer d'extraire les statistiques
      const extractedStats = extractStatisticsFromAnyFormat(data, true);
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-6",
        label: "API route tracking-log (legacy)",
        data: data,
        success: !!extractedStats,
        timing: endTime - startTime,
        formatted: extractedStats
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 6:", error);
      setResults(prev => [...prev, {
        method: "method-6",
        label: "API route tracking-log (legacy)",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 7: API route stats v2
  const testMethod7 = async () => {
    try {
      const startTime = performance.now();
      
      const apiUrl = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/stats?api_token=${account.api_token}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API a retourné ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const endTime = performance.now();
      
      // Création sécurisée d'un objet DeliveryInfo
      const deliveryInfoJson = data.stats || data.data;
      
      // Vérifier que deliveryInfoJson est un objet et pas une primitive
      if (!deliveryInfoJson || typeof deliveryInfoJson !== 'object' || Array.isArray(deliveryInfoJson)) {
        throw new Error('Format de données invalide: les statistiques doivent être un objet');
      }
      
      // Créer un objet DeliveryInfo sécurisé
      const deliveryInfo: DeliveryInfo = {
        total: extractNumericValue(deliveryInfoJson, 'total'),
        delivered: extractNumericValue(deliveryInfoJson, 'delivered'),
        delivery_rate: extractNumericValue(deliveryInfoJson, 'delivery_rate'),
        opened: extractNumericValue(deliveryInfoJson, 'opened'),
        unique_open_rate: extractNumericValue(deliveryInfoJson, 'unique_open_rate') || extractNumericValue(deliveryInfoJson, 'open_rate'),
        clicked: extractNumericValue(deliveryInfoJson, 'clicked'),
        click_rate: extractNumericValue(deliveryInfoJson, 'click_rate')
      };
      
      // Gérer le cas spécial pour "bounced" qui peut être un nombre ou un objet
      if ('bounced' in deliveryInfoJson) {
        const bouncedValue = deliveryInfoJson.bounced;
        
        if (typeof bouncedValue === 'number') {
          deliveryInfo.bounced = bouncedValue;
        } else if (typeof bouncedValue === 'object' && bouncedValue !== null) {
          deliveryInfo.bounced = {
            soft: extractNumericValue(bouncedValue, 'soft'),
            hard: extractNumericValue(bouncedValue, 'hard'),
            total: extractNumericValue(bouncedValue, 'total')
          };
        }
      }
      
      // Ajouter d'autres propriétés
      deliveryInfo.unsubscribed = extractNumericValue(deliveryInfoJson, 'unsubscribed');
      deliveryInfo.complained = extractNumericValue(deliveryInfoJson, 'complained');
      
      // Convertir en statistiques validées en utilisant DeliveryInfo comme source
      // On utilise maintenant l'objet deliveryInfo correctement typé
      const stats = extractStatisticsFromAnyFormat(deliveryInfo);
      
      setResults(prev => [...prev, {
        method: "method-7",
        label: "API route stats v2",
        data: data,
        success: !!stats,
        timing: endTime - startTime,
        formatted: stats
      }]);
    } catch (error) {
      console.error("Erreur avec la méthode 7:", error);
      setResults(prev => [...prev, {
        method: "method-7",
        label: "API route stats v2",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Filtrer les résultats en fonction de l'onglet actif
  const filteredResults = activeTab === "all" 
    ? results 
    : activeTab === "success"
      ? results.filter(r => r.success)
      : results.filter(r => !r.success);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">Test des méthodes de statistiques</h3>
              <p className="text-muted-foreground text-sm">
                Campagne: <span className="font-mono bg-background py-0.5 px-1 rounded">{campaignUid}</span>
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Compte: {account.name} ({account.id})
              </p>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Test en cours...' : 'Relancer tous les tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({results.length})
          </TabsTrigger>
          <TabsTrigger value="success">
            Succès ({results.filter(r => r.success).length})
          </TabsTrigger>
          <TabsTrigger value="error">
            Erreurs ({results.filter(r => !r.success).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Résultats */}
      {isLoading && results.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8 mr-2" />
          <p>Exécution des tests...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {results.length === 0 
              ? "Aucun test n'a encore été exécuté" 
              : "Aucun résultat ne correspond au filtre appliqué"}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {filteredResults.map((result, index) => (
            <Card key={result.method} className={result.success ? "border-green-200" : "border-red-200"}>
              <CardHeader className={`pb-2 ${result.success ? "bg-green-50" : "bg-red-50"}`}>
                <CardTitle className="flex justify-between items-center text-base">
                  <div className="flex items-center">
                    {result.success ? (
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    )}
                    <span>
                      {index + 1}. {result.label}
                    </span>
                  </div>
                  <span className="text-xs font-normal text-muted-foreground">
                    {formatTiming(result.timing)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                {result.success ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Statistiques formatées</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto whitespace-pre-wrap">
                          {formatStatsString(result.formatted || null)}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Données brutes</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {result.error || "Erreur inconnue"}
                      </AlertDescription>
                    </Alert>
                    {result.data && (
                      <>
                        <h4 className="font-medium text-sm mt-3">Données brutes</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
