
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
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

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
      // Test utilisant la nouvelle fonction Edge directement
      await testEdgeFunction();
      
      // Méthode 1: Service directStats
      await testMethod1();
      
      // Méthode 2: API directe avec buildDirectApiUrl
      await testMethod2();
      
      // Méthode 3: API directe avec fetch personnalisé
      await testMethod3();
      
      // Méthode 4: Récupération depuis la base de données locale (email_campaigns_cache)
      await testMethod4();
      
      toast.success("Tests terminés avec succès");
    } catch (error) {
      console.error("Erreur lors de l'exécution des tests:", error);
      toast.error("Erreur lors de l'exécution des tests");
    } finally {
      setIsLoading(false);
    }
  };

  // Test utilisant la fonction Edge Supabase directement
  const testEdgeFunction = async () => {
    try {
      const startTime = performance.now();
      
      const supabaseUrl = "https://dupguifqyjchlmzbadav.supabase.co";
      
      // Construire l'URL pour la fonction Edge
      const functionUrl = `${supabaseUrl}/functions/v1/acelle-stats?campaignId=${campaignUid}&accountId=${account.id}&forceRefresh=true`;
      
      console.log("[Test Edge Function] URL:", functionUrl);
      
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = performance.now();
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Test Edge Function] Erreur: ${response.status} - ${errorText}`);
        
        setResults(prev => [...prev, {
          method: "edge-function",
          label: "Fonction Edge Supabase",
          data: errorText,
          success: false,
          error: `Erreur HTTP ${response.status}: ${errorText}`,
          timing: endTime - startTime
        }]);
        return;
      }
      
      const responseText = await response.text();
      console.log("[Test Edge Function] Réponse brute:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("[Test Edge Function] Erreur de parsing JSON:", e);
        setResults(prev => [...prev, {
          method: "edge-function",
          label: "Fonction Edge Supabase",
          data: responseText,
          success: false,
          error: `Erreur de parsing JSON: ${e.message}`,
          timing: endTime - startTime
        }]);
        return;
      }
      
      console.log("[Test Edge Function] Données JSON parsées:", responseData);
      
      // Extraire les statistiques de la réponse
      let stats: AcelleCampaignStatistics = createEmptyStatistics();
      
      if (responseData && responseData.data) {
        const campaignData = responseData.data;
        
        stats = {
          subscriber_count: campaignData.subscriberCount || 0,
          delivered_count: campaignData.deliveredCount || 0,
          delivered_rate: campaignData.deliveredRate || 0,
          open_count: campaignData.uniqueOpenCount || 0,
          uniq_open_count: campaignData.uniqueOpenCount || 0,
          uniq_open_rate: campaignData.openRate || 0,
          click_count: campaignData.clickCount || 0,
          click_rate: campaignData.clickRate || 0,
          bounce_count: campaignData.bounceCount || 0,
          soft_bounce_count: 0,
          hard_bounce_count: 0,
          unsubscribe_count: campaignData.unsubscribeCount || 0,
          abuse_complaint_count: campaignData.spamCount || 0
        };
        
        console.log("[Test Edge Function] Statistiques extraites:", stats);
      }
      
      setResults(prev => [...prev, {
        method: "edge-function",
        label: "Fonction Edge Supabase",
        data: responseData,
        success: true,
        timing: endTime - startTime,
        formatted: stats
      }]);
      
    } catch (error) {
      console.error("Erreur avec la fonction Edge:", error);
      setResults(prev => [...prev, {
        method: "edge-function",
        label: "Fonction Edge Supabase",
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }]);
    }
  };

  // Méthode 1: Utiliser fetchDirectStatistics depuis directStats
  const testMethod1 = async () => {
    try {
      const startTime = performance.now();
      
      // Utiliser le service directStats
      const stats = await fetchDirectStatistics(campaignUid, account);
      
      const endTime = performance.now();
      
      console.log("[Method 1] Statistiques récupérées:", stats);
      
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
      
      console.log("[Method 2] URL de l'API:", url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Récupérer le texte brut de la réponse pour le débogage
      const responseText = await response.text();
      console.log("[Method 2] Réponse brute:", responseText);
      
      if (!response.ok) {
        throw new Error(`API a retourné ${response.status}: ${responseText}`);
      }
      
      // Tenter de parser le JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("[Method 2] Données brutes de l'API:", data);
      } catch (e) {
        console.error("[Method 2] Erreur parsing JSON:", e);
        throw new Error(`Erreur parsing JSON: ${e.message} - Réponse: ${responseText}`);
      }
      
      // Créer un objet statistiques sécurisé
      const stats: AcelleCampaignStatistics = createEmptyStatistics();
      
      // Extraire manuellement les statistiques si des données sont disponibles
      if (data && typeof data === 'object') {
        console.log("[Method 2] Extraction manuelle des statistiques");
        
        // Tenter d'extraire les données de plusieurs formats possibles
        const rawStats = data.statistics || data.data || data;
        
        if (rawStats && typeof rawStats === 'object') {
          stats.subscriber_count = typeof rawStats.subscriber_count === 'number' ? rawStats.subscriber_count : 
                                 (typeof rawStats.total === 'number' ? rawStats.total : 0);
                                 
          stats.delivered_count = typeof rawStats.delivered_count === 'number' ? rawStats.delivered_count : 
                                (typeof rawStats.delivered === 'number' ? rawStats.delivered : 0);
                                
          stats.delivered_rate = typeof rawStats.delivered_rate === 'number' ? rawStats.delivered_rate : 
                               (typeof rawStats.delivery_rate === 'number' ? rawStats.delivery_rate : 0);
                               
          stats.open_count = typeof rawStats.open_count === 'number' ? rawStats.open_count : 
                           (typeof rawStats.opened === 'number' ? rawStats.opened : 0);
                           
          stats.uniq_open_count = typeof rawStats.uniq_open_count === 'number' ? rawStats.uniq_open_count : 
                                (typeof rawStats.unique_open_count === 'number' ? rawStats.unique_open_count : 
                                (typeof rawStats.opened === 'number' ? rawStats.opened : 0));
                                
          stats.uniq_open_rate = typeof rawStats.uniq_open_rate === 'number' ? rawStats.uniq_open_rate : 
                               (typeof rawStats.unique_open_rate === 'number' ? rawStats.unique_open_rate : 
                               (typeof rawStats.open_rate === 'number' ? rawStats.open_rate : 0));
                               
          stats.click_count = typeof rawStats.click_count === 'number' ? rawStats.click_count : 
                            (typeof rawStats.clicked === 'number' ? rawStats.clicked : 0);
                            
          stats.click_rate = typeof rawStats.click_rate === 'number' ? rawStats.click_rate : 0;
          
          // Gestion du bounce qui peut être un objet ou un nombre
          if (typeof rawStats.bounce_count === 'number') {
            stats.bounce_count = rawStats.bounce_count;
          } else if (typeof rawStats.bounced === 'object' && rawStats.bounced) {
            stats.bounce_count = typeof rawStats.bounced.total === 'number' ? rawStats.bounced.total : 0;
            stats.soft_bounce_count = typeof rawStats.bounced.soft === 'number' ? rawStats.bounced.soft : 0;
            stats.hard_bounce_count = typeof rawStats.bounced.hard === 'number' ? rawStats.bounced.hard : 0;
          } else if (typeof rawStats.bounced === 'number') {
            stats.bounce_count = rawStats.bounced;
          }
          
          stats.unsubscribe_count = typeof rawStats.unsubscribe_count === 'number' ? rawStats.unsubscribe_count : 
                                  (typeof rawStats.unsubscribed === 'number' ? rawStats.unsubscribed : 0);
                                  
          stats.abuse_complaint_count = typeof rawStats.abuse_complaint_count === 'number' ? rawStats.abuse_complaint_count : 
                                      (typeof rawStats.complained === 'number' ? rawStats.complained : 0);
                                      
          console.log("[Method 2] Statistiques extraites manuellement:", stats);
        }
      }
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-2",
        label: "API directe (buildDirectApiUrl)",
        data: data,
        success: !!stats,
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
      
      const apiUrl = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}?api_token=${account.api_token}`;
      
      console.log("[Method 3] URL de l'API:", apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Récupérer le texte brut de la réponse pour le débogage
      const responseText = await response.text();
      console.log("[Method 3] Réponse brute:", responseText);
      
      if (!response.ok) {
        throw new Error(`API a retourné ${response.status}: ${responseText}`);
      }
      
      // Tenter de parser le JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("[Method 3] Données brutes de l'API:", data);
      } catch (e) {
        console.error("[Method 3] Erreur parsing JSON:", e);
        throw new Error(`Erreur parsing JSON: ${e.message} - Réponse: ${responseText}`);
      }
      
      // Créer un objet statistiques sécurisé
      const stats: AcelleCampaignStatistics = createEmptyStatistics();
      
      // Extraire manuellement les statistiques
      if (data && typeof data === 'object') {
        stats.subscriber_count = Number(data.subscriber_count || data.total || 0);
        stats.delivered_count = Number(data.delivered_count || data.delivered || 0);
        stats.delivered_rate = Number(data.delivered_rate || data.delivery_rate || 0);
        stats.open_count = Number(data.open_count || data.opened || 0);
        stats.uniq_open_count = Number(data.unique_open_count || data.uniq_open_count || data.opened || 0);
        stats.uniq_open_rate = Number(data.unique_open_rate || data.uniq_open_rate || data.open_rate || 0);
        stats.click_count = Number(data.click_count || data.clicked || 0);
        stats.click_rate = Number(data.click_rate || 0);
        
        // Gérer bounced qui peut être un objet ou un nombre
        if (data.bounced !== undefined) {
          if (typeof data.bounced === 'object' && data.bounced !== null) {
            stats.bounce_count = Number(data.bounced.total || 0);
            stats.soft_bounce_count = Number(data.bounced.soft || 0);
            stats.hard_bounce_count = Number(data.bounced.hard || 0);
          } else {
            stats.bounce_count = Number(data.bounced || 0);
          }
        } else {
          stats.bounce_count = Number(data.bounce_count || 0);
          stats.soft_bounce_count = Number(data.soft_bounce_count || 0);
          stats.hard_bounce_count = Number(data.hard_bounce_count || 0);
        }
        
        stats.unsubscribe_count = Number(data.unsubscribe_count || data.unsubscribed || 0);
        stats.abuse_complaint_count = Number(data.abuse_complaint_count || data.complained || 0);
        
        console.log("[Method 3] Statistiques extraites:", stats);
      }
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-3",
        label: "API directe (fetch personnalisé)",
        data: data,
        success: !!stats,
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
      
      const deliveryInfoJson = data.delivery_info;
      
      console.log("[Method 4] Données brutes de la base:", deliveryInfoJson);
      
      // Définition d'objet stats avec valeurs par défaut
      const stats: AcelleCampaignStatistics = {
        subscriber_count: 0,
        delivered_count: 0,
        delivered_rate: 0,
        open_count: 0,
        uniq_open_count: 0,
        uniq_open_rate: 0,
        click_count: 0,
        click_rate: 0,
        bounce_count: 0,
        soft_bounce_count: 0,
        hard_bounce_count: 0,
        unsubscribe_count: 0,
        abuse_complaint_count: 0
      };

      // Afficher les données brutes pour debug
      console.log("deliveryInfoJson brut:", JSON.stringify(deliveryInfoJson));

      // Traitement manuel sans fonction externe
      if (deliveryInfoJson && typeof deliveryInfoJson === 'object' && !Array.isArray(deliveryInfoJson)) {
        console.log("[Method 4] Extracting from:", deliveryInfoJson);
        
        const di = deliveryInfoJson as Record<string, any>;
        
        // Extraction manuelle des valeurs avec des logs
        stats.subscriber_count = Number(di.total || di.subscriber_count || 0);
        stats.delivered_count = Number(di.delivered || di.delivered_count || 0);
        stats.delivered_rate = Number(di.delivery_rate || di.delivered_rate || 0);
        stats.open_count = Number(di.opened || di.open_count || 0);
        stats.uniq_open_count = Number(di.opened || di.unique_open_count || di.uniq_open_count || 0);
        stats.uniq_open_rate = Number(di.unique_open_rate || di.uniq_open_rate || di.open_rate || 0);
        stats.click_count = Number(di.clicked || di.click_count || 0);
        stats.click_rate = Number(di.click_rate || 0);
        
        // Gérer bounced qui peut être un objet ou un nombre
        if (di.bounced !== undefined) {
          if (typeof di.bounced === 'object' && di.bounced !== null) {
            stats.bounce_count = Number(di.bounced.total || 0);
            stats.soft_bounce_count = Number(di.bounced.soft || 0);
            stats.hard_bounce_count = Number(di.bounced.hard || 0);
          } else {
            stats.bounce_count = Number(di.bounced || 0);
          }
        } else {
          stats.bounce_count = Number(di.bounce_count || 0);
          stats.soft_bounce_count = Number(di.soft_bounce_count || 0);
          stats.hard_bounce_count = Number(di.hard_bounce_count || 0);
        }
        
        stats.unsubscribe_count = Number(di.unsubscribed || di.unsubscribe_count || 0);
        stats.abuse_complaint_count = Number(di.complained || di.abuse_complaint_count || 0);
        
        console.log("[Method 4] Extracted stats:", stats);
      } else {
        console.warn("[Method 4] Format de delivery_info invalide:", deliveryInfoJson);
      }
      
      const endTime = performance.now();
      
      setResults(prev => [...prev, {
        method: "method-4",
        label: "Base de données locale (email_campaigns_cache)",
        data: {
          delivery_info: deliveryInfoJson,
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

export default StatisticsMethodTester;
