
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoCircle, WarningCircle } from "lucide-react";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { fetchDirectStatistics } from "@/services/acelle/api/stats/directStats";
import { enrichCampaignsWithStats } from "@/services/acelle/api/stats/directStats";
import { buildDirectApiUrl } from "@/services/acelle/acelle-service";
import { ensureValidStatistics } from "@/services/acelle/api/stats/validation";

type TestMethod = {
  id: string;
  name: string;
  description: string;
  execute: (campaign: AcelleCampaign, account: AcelleAccount) => Promise<any>;
};

interface StatisticsMethodTesterProps {
  account: AcelleAccount;
  campaignUid: string;
}

export const StatisticsMethodTester = ({ account, campaignUid }: StatisticsMethodTesterProps) => {
  const [campaign, setCampaign] = useState<AcelleCampaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("method-1");
  const [results, setResults] = useState<Record<string, any>>({});
  const [rawResponses, setRawResponses] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});

  // Définition des différentes méthodes de test
  const testMethods: TestMethod[] = [
    {
      id: "method-1",
      name: "Méthode directe API",
      description: "Appel direct à l'API Acelle pour récupérer les statistiques",
      execute: async (campaign, account) => {
        // Utiliser la méthode fetchDirectStatistics existante
        return await fetchDirectStatistics(campaign.uid || campaign.campaign_uid || "", account);
      }
    },
    {
      id: "method-2",
      name: "Méthode enrichissement",
      description: "Enrichir la campagne avec toutes les statistiques",
      execute: async (campaign, account) => {
        // Utiliser enrichCampaignsWithStats avec forceRefresh
        const enriched = await enrichCampaignsWithStats([campaign], account, { forceRefresh: true });
        return enriched[0]?.statistics || null;
      }
    },
    {
      id: "method-3",
      name: "API Campaign Get",
      description: "Récupération via API /api/campaigns/{uid}",
      execute: async (campaign, account) => {
        const campaignUrl = buildDirectApiUrl(`campaigns/${campaign.uid || campaign.campaign_uid}`, account.api_endpoint, { 
          api_token: account.api_token 
        });
        
        const response = await fetch(campaignUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setRawResponses(prev => ({ ...prev, "method-3": data }));
        
        // Extraire les statistiques du résultat
        if (data && data.campaign) {
          return {
            subscriber_count: data.campaign.subscriber_count || data.campaign.total || 0,
            delivered_count: data.campaign.delivered_count || data.campaign.delivered || 0,
            open_count: data.campaign.open_count || data.campaign.opened || 0,
            click_count: data.campaign.click_count || data.campaign.clicked || 0,
            bounce_count: data.campaign.bounce_count || (data.campaign.bounced ? 
              (typeof data.campaign.bounced === 'object' ? data.campaign.bounced.total : data.campaign.bounced) : 0),
            uniq_open_rate: data.campaign.unique_open_rate || data.campaign.open_rate || 0,
            click_rate: data.campaign.click_rate || 0,
            delivered_rate: data.campaign.delivery_rate || 0
          };
        }
        
        return null;
      }
    },
    {
      id: "method-4",
      name: "API Reports",
      description: "Récupération via API /api/reports/campaign/{uid}",
      execute: async (campaign, account) => {
        const reportsUrl = buildDirectApiUrl(`reports/campaign/${campaign.uid || campaign.campaign_uid}`, account.api_endpoint, { 
          api_token: account.api_token 
        });
        
        try {
          const response = await fetch(reportsUrl, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          setRawResponses(prev => ({ ...prev, "method-4": data }));
          
          // Extraire les statistiques des rapports
          if (data) {
            return {
              subscriber_count: data.total || 0,
              delivered_count: data.delivered || 0,
              open_count: data.opened || 0,
              click_count: data.clicked || 0,
              bounce_count: data.bounced ? 
                (typeof data.bounced === 'object' ? data.bounced.total : data.bounced) : 0,
              uniq_open_rate: data.open_rate || data.unique_open_rate || 0,
              click_rate: data.click_rate || 0,
              delivered_rate: data.delivery_rate || 0
            };
          }
        } catch (error) {
          console.error("Erreur API Reports:", error);
          throw error;
        }
        
        return null;
      }
    },
    {
      id: "method-5",
      name: "API TrackingLog",
      description: "Récupération via API /api/campaigns/{uid}/tracking_log",
      execute: async (campaign, account) => {
        const trackingUrl = buildDirectApiUrl(
          `campaigns/${campaign.uid || campaign.campaign_uid}/tracking_log`, 
          account.api_endpoint, 
          { api_token: account.api_token }
        );
        
        try {
          const response = await fetch(trackingUrl, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          setRawResponses(prev => ({ ...prev, "method-5": data }));
          
          // Calculer les statistiques à partir des logs
          if (data && data.tracking_logs) {
            const logs = data.tracking_logs;
            const stats = {
              subscriber_count: logs.length,
              delivered_count: logs.filter(log => log.status === 'delivered').length,
              open_count: logs.filter(log => log.open_log).length,
              click_count: logs.filter(log => log.click_log).length,
              bounce_count: logs.filter(log => log.status === 'bounced').length,
              uniq_open_rate: 0,
              click_rate: 0,
              delivered_rate: 0
            };
            
            // Calculer les taux
            if (stats.subscriber_count > 0) {
              stats.delivered_rate = (stats.delivered_count / stats.subscriber_count) * 100;
              if (stats.delivered_count > 0) {
                stats.uniq_open_rate = (stats.open_count / stats.delivered_count) * 100;
                stats.click_rate = (stats.click_count / stats.delivered_count) * 100;
              }
            }
            
            return stats;
          }
        } catch (error) {
          console.error("Erreur API TrackingLog:", error);
          throw error;
        }
        
        return null;
      }
    },
    {
      id: "method-6",
      name: "Direct Cache DB",
      description: "Récupération directe depuis la table de cache en DB",
      execute: async (campaign, account) => {
        // Récupérer les statistiques directement depuis la table campaign_stats_cache
        const { data: cacheData, error: cacheError } = await supabase
          .from('campaign_stats_cache')
          .select('statistics')
          .eq('campaign_uid', campaign.uid || campaign.campaign_uid)
          .eq('account_id', account.id)
          .single();
          
        if (cacheError) {
          console.error("Error fetching from cache:", cacheError);
          throw cacheError;
        }
        
        setRawResponses(prev => ({ ...prev, "method-6": cacheData }));
        
        if (cacheData && cacheData.statistics) {
          return cacheData.statistics;
        }
        
        return null;
      }
    },
    {
      id: "method-7",
      name: "DeliveryInfo DB",
      description: "Récupération depuis delivery_info dans email_campaigns_cache",
      execute: async (campaign, account) => {
        // Récupérer les statistiques directement depuis le champ delivery_info
        const { data: campaignData, error: campaignError } = await supabase
          .from('email_campaigns_cache')
          .select('delivery_info')
          .eq('campaign_uid', campaign.uid || campaign.campaign_uid)
          .eq('account_id', account.id)
          .single();
          
        if (campaignError) {
          console.error("Error fetching from campaigns cache:", campaignError);
          throw campaignError;
        }
        
        setRawResponses(prev => ({ ...prev, "method-7": campaignData }));
        
        if (campaignData && campaignData.delivery_info) {
          // Convertir le format delivery_info en format statistics
          const deliveryInfo = campaignData.delivery_info;
          
          return {
            subscriber_count: deliveryInfo.total || 0,
            delivered_count: deliveryInfo.delivered || 0,
            delivered_rate: deliveryInfo.delivery_rate || 0,
            open_count: deliveryInfo.opened || 0,
            uniq_open_rate: deliveryInfo.unique_open_rate || 0,
            click_count: deliveryInfo.clicked || 0,
            click_rate: deliveryInfo.click_rate || 0,
            bounce_count: deliveryInfo.bounced ? 
              (typeof deliveryInfo.bounced === 'object' ? deliveryInfo.bounced.total : deliveryInfo.bounced) : 0,
            soft_bounce_count: deliveryInfo.bounced && typeof deliveryInfo.bounced === 'object' ? 
              deliveryInfo.bounced.soft : 0,
            hard_bounce_count: deliveryInfo.bounced && typeof deliveryInfo.bounced === 'object' ? 
              deliveryInfo.bounced.hard : 0,
            unsubscribe_count: deliveryInfo.unsubscribed || 0,
            abuse_complaint_count: deliveryInfo.complained || 0
          };
        }
        
        return null;
      }
    }
  ];

  // Récupérer les informations de base de la campagne
  useEffect(() => {
    const fetchCampaignInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer la campagne depuis email_campaigns_cache
        const { data, error } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Campagne non trouvée');
        }
        
        const campaignData: AcelleCampaign = {
          uid: data.campaign_uid,
          campaign_uid: data.campaign_uid,
          name: data.name || '',
          subject: data.subject || '',
          status: data.status || '',
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
          delivery_date: data.delivery_date || null,
          run_at: data.run_at || null,
          last_error: data.last_error || '',
          delivery_info: data.delivery_info || {}
        };
        
        setCampaign(campaignData);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations de la campagne:', error);
        setError('Impossible de récupérer les informations de la campagne');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignInfo();
  }, [account, campaignUid]);

  // Exécuter une méthode de test
  const runTestMethod = async (methodId: string) => {
    try {
      if (!campaign) return;
      
      setIsExecuting(prev => ({ ...prev, [methodId]: true }));
      
      const method = testMethods.find(m => m.id === methodId);
      if (!method) return;
      
      const startTime = performance.now();
      const result = await method.execute(campaign, account);
      const endTime = performance.now();
      
      // Valider et normaliser les statistiques si elles existent
      const validatedStats = result ? ensureValidStatistics(result) : null;
      
      setResults(prev => ({
        ...prev,
        [methodId]: {
          stats: validatedStats,
          executionTime: Math.round(endTime - startTime),
          success: !!validatedStats,
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log(`Résultat méthode ${method.name}:`, validatedStats);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la méthode ${methodId}:`, error);
      
      setResults(prev => ({
        ...prev,
        [methodId]: {
          stats: null,
          executionTime: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setIsExecuting(prev => ({ ...prev, [methodId]: false }));
    }
  };

  // Formatter un nombre
  const formatNumber = (value?: number | null): string => {
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
  };

  // Formatter un pourcentage
  const formatPercentage = (value?: number | null): string => {
    if (value === undefined || value === null) return "0%";
    return `${value.toFixed(1)}%`;
  };

  // Si chargement en cours
  if (loading) {
    return (
      <Card className="my-4">
        <CardContent className="py-8 flex items-center justify-center">
          <Spinner className="h-8 w-8 mr-2" />
          <p>Chargement des informations de la campagne...</p>
        </CardContent>
      </Card>
    );
  }

  // Si erreur
  if (error || !campaign) {
    return (
      <Alert variant="destructive" className="my-4">
        <WarningCircle className="h-5 w-5" />
        <AlertDescription>
          {error || "Campagne non trouvée"}
        </AlertDescription>
      </Alert>
    );
  }

  // Afficher l'interface de test
  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle>Test des méthodes de récupération de statistiques</CardTitle>
        <p className="text-muted-foreground">
          Campagne: {campaign.name} (UID: {campaign.campaign_uid || campaign.uid})
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            {testMethods.slice(0, 4).map(method => (
              <TabsTrigger key={method.id} value={method.id}>
                {method.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="grid grid-cols-2 md:grid-cols-3 mb-4">
            {testMethods.slice(4).map(method => (
              <TabsTrigger key={method.id} value={method.id}>
                {method.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {testMethods.map(method => (
            <TabsContent key={method.id} value={method.id}>
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => runTestMethod(method.id)} 
                    disabled={isExecuting[method.id]}
                  >
                    {isExecuting[method.id] ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Exécution...
                      </>
                    ) : (
                      'Tester cette méthode'
                    )}
                  </Button>
                </div>
                
                {results[method.id] && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">
                        {results[method.id].success ? 'Résultats obtenus' : 'Échec de la récupération'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {results[method.id].executionTime}ms
                      </p>
                    </div>
                    
                    {results[method.id].success ? (
                      <div className="rounded-md border p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Destinataires</p>
                            <p className="text-xl font-semibold">
                              {formatNumber(results[method.id].stats?.subscriber_count)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Délivrés</p>
                            <p className="text-xl font-semibold">
                              {formatNumber(results[method.id].stats?.delivered_count)}
                              <span className="text-xs ml-1 text-muted-foreground">
                                ({formatPercentage(results[method.id].stats?.delivered_rate)})
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Ouvertures</p>
                            <p className="text-xl font-semibold">
                              {formatNumber(results[method.id].stats?.open_count)}
                              <span className="text-xs ml-1 text-muted-foreground">
                                ({formatPercentage(results[method.id].stats?.uniq_open_rate)})
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Clics</p>
                            <p className="text-xl font-semibold">
                              {formatNumber(results[method.id].stats?.click_count)}
                              <span className="text-xs ml-1 text-muted-foreground">
                                ({formatPercentage(results[method.id].stats?.click_rate)})
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Bounces</p>
                            <p className="text-xl font-semibold">
                              {formatNumber(results[method.id].stats?.bounce_count)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Désabonnements</p>
                            <p className="text-xl font-semibold">
                              {formatNumber(results[method.id].stats?.unsubscribe_count)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <WarningCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {results[method.id].error || "Aucune donnée récupérée"}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        Afficher les données brutes
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded overflow-auto max-h-[300px] text-xs">
                        <pre>{JSON.stringify(rawResponses[method.id] || results[method.id], null, 2)}</pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
