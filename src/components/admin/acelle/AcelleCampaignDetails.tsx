
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { Badge } from "@/components/ui/badge";
import { translateStatus, getStatusBadgeVariant, generateSimulatedStats } from "@/utils/acelle/campaignStatusUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCampaignStatsDirectly } from "@/services/acelle/api/directStats";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";

interface AcelleCampaignDetailsProps {
  campaignId: string;
  account: AcelleAccount;
  onClose: () => void;
  demoMode?: boolean;
}

const AcelleCampaignDetails = ({ 
  campaignId, 
  account, 
  onClose,
  demoMode = false
}: AcelleCampaignDetailsProps) => {
  const [campaign, setCampaign] = useState<AcelleCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Chargement des détails de la campagne
  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (demoMode) {
          // En mode démo, créer une campagne factice avec des statistiques
          const demoCampaign = createDemoCampaign(campaignId);
          setCampaign(demoCampaign);
          const demoStats = generateSimulatedStats();
          
          // S'assurer que les données démo sont complètes
          demoCampaign.delivery_info = demoStats.delivery_info;
          demoCampaign.statistics = demoStats.statistics;
          
          setStats(demoStats.statistics || demoStats.delivery_info);
        } else {
          // Charger depuis le cache
          const campaigns = await fetchCampaignsFromCache([account]);
          const foundCampaign = campaigns.find(
            c => c.uid === campaignId || c.campaign_uid === campaignId
          );
          
          if (foundCampaign) {
            setCampaign(foundCampaign);
            console.log(`Campagne trouvée: ${foundCampaign.name}`, foundCampaign);
            
            // Créer une copie pour éviter les mutations accidentelles
            const campaignCopy = { ...foundCampaign };
            
            // Vérifier si nous avons des statistiques et les extraire
            let hasValidStats = false;
            
            // Essayez d'abord d'utiliser les statistiques de campaign.statistics
            if (campaignCopy.statistics && Object.keys(campaignCopy.statistics).length > 0) {
              // Vérifier si au moins une valeur est non nulle
              const hasNonZeroValue = Object.values(campaignCopy.statistics).some(
                val => typeof val === 'number' && val > 0
              );
              
              if (hasNonZeroValue) {
                console.log("Utilisation des statistiques existantes dans campaign.statistics:", campaignCopy.statistics);
                setStats(campaignCopy.statistics);
                hasValidStats = true;
              }
            }
            
            // Ensuite, essayer delivery_info si statistics n'avait pas de données valides
            if (!hasValidStats && campaignCopy.delivery_info && Object.keys(campaignCopy.delivery_info).length > 0) {
              // Vérifier si au moins une valeur est non nulle
              const hasNonZeroValue = Object.values(campaignCopy.delivery_info).some(
                val => {
                  if (typeof val === 'number') return val > 0;
                  if (typeof val === 'object' && val) {
                    return Object.values(val).some(v => typeof v === 'number' && v > 0);
                  }
                  return false;
                }
              );
              
              if (hasNonZeroValue) {
                console.log("Utilisation des statistiques existantes dans campaign.delivery_info:", campaignCopy.delivery_info);
                setStats(campaignCopy.delivery_info);
                hasValidStats = true;
              }
            }
            
            // Si nous n'avons pas encore de statistiques valides, essayer de les récupérer directement
            if (!hasValidStats) {
              try {
                console.log(`Récupération des statistiques pour la campagne ${campaignId}`);
                const freshStats = await getCampaignStatsDirectly(campaignCopy, account);
                console.log("Statistiques récupérées:", freshStats);
                
                // Mettre à jour les données de campaign avec les nouvelles statistiques
                if (freshStats && Object.keys(freshStats).length > 0) {
                  if (freshStats.statistics) {
                    campaignCopy.statistics = freshStats.statistics;
                    setStats(freshStats.statistics);
                    hasValidStats = true;
                  } 
                  else if (freshStats.delivery_info) {
                    campaignCopy.delivery_info = freshStats.delivery_info;
                    setStats(freshStats.delivery_info);
                    hasValidStats = true;
                  } 
                  else {
                    // Utilisez directement les données retournées
                    setStats(freshStats);
                    
                    // Construire un objet statistics à partir de ces données
                    const constructedStats = {
                      subscriber_count: freshStats.total || 0,
                      delivered_count: freshStats.delivered || 0,
                      delivered_rate: freshStats.delivery_rate || 0,
                      open_count: freshStats.opened || 0,
                      uniq_open_rate: freshStats.unique_open_rate || 0,
                      unique_open_rate: freshStats.unique_open_rate || 0,
                      click_count: freshStats.clicked || 0,
                      click_rate: freshStats.click_rate || 0,
                      bounce_count: typeof freshStats.bounced === 'object' ? freshStats.bounced.total : freshStats.bounced || 0,
                      soft_bounce_count: typeof freshStats.bounced === 'object' ? freshStats.bounced.soft : 0,
                      hard_bounce_count: typeof freshStats.bounced === 'object' ? freshStats.bounced.hard : 0,
                      unsubscribe_count: freshStats.unsubscribed || 0,
                      abuse_complaint_count: freshStats.complained || 0
                    };
                    
                    campaignCopy.statistics = constructedStats;
                    hasValidStats = true;
                  }
                  
                  // Mettre à jour la campagne avec les nouvelles statistiques
                  setCampaign(campaignCopy);
                }
              } catch (err) {
                console.error("Erreur lors de la récupération des statistiques:", err);
                
                // Si toutes les tentatives échouent, créer des statistiques avec des zéros
                const emptyStats = {
                  subscriber_count: 0,
                  delivered_count: 0,
                  delivered_rate: 0,
                  open_count: 0,
                  uniq_open_rate: 0,
                  click_count: 0,
                  click_rate: 0,
                  bounce_count: 0,
                  soft_bounce_count: 0,
                  hard_bounce_count: 0,
                  unsubscribe_count: 0,
                  abuse_complaint_count: 0
                };
                
                setStats(emptyStats);
                campaignCopy.statistics = emptyStats;
                setCampaign(campaignCopy);
              }
            }
          } else {
            setError("Campagne non trouvée");
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la campagne:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignDetails();
  }, [campaignId, account, demoMode]);

  // Créer une campagne fictive pour le mode démo
  const createDemoCampaign = (id: string): AcelleCampaign => {
    const now = new Date();
    
    // Générer des statistiques de démonstration réalistes
    const totalSent = 1000 + Math.floor(Math.random() * 1000);
    const delivered = totalSent - Math.floor(Math.random() * 100);
    const opened = Math.floor(delivered * (0.2 + Math.random() * 0.4)); // entre 20% et 60%
    const clicked = Math.floor(opened * (0.1 + Math.random() * 0.3)); // entre 10% et 40% des ouvertures
    const bounced = totalSent - delivered;
    const unsubscribed = Math.floor(delivered * 0.01); // environ 1%
    
    return {
      uid: id,
      campaign_uid: id,
      name: "Campagne démo détaillée",
      subject: "Sujet de la campagne démo détaillée",
      status: "sent",
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
      delivery_date: now.toISOString(),
      run_at: null,
      last_error: null,
      delivery_info: {
        total: totalSent,
        delivered,
        delivery_rate: (delivered / totalSent) * 100,
        opened,
        unique_open_rate: (opened / delivered) * 100,
        clicked,
        click_rate: (clicked / delivered) * 100,
        bounced: {
          soft: Math.floor(bounced * 0.7),
          hard: Math.floor(bounced * 0.3),
          total: bounced
        },
        unsubscribed
      },
      statistics: {
        subscriber_count: totalSent,
        delivered_count: delivered,
        delivered_rate: (delivered / totalSent) * 100,
        open_count: opened,
        uniq_open_rate: (opened / delivered) * 100,
        unique_open_rate: (opened / delivered) * 100,
        click_count: clicked,
        click_rate: (clicked / delivered) * 100,
        bounce_count: bounced,
        soft_bounce_count: Math.floor(bounced * 0.7),
        hard_bounce_count: Math.floor(bounced * 0.3),
        unsubscribe_count: unsubscribed,
        abuse_complaint_count: Math.floor(unsubscribed * 0.1)
      }
    };
  };

  // Formatage des nombres
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
  };

  // Formatage des pourcentages
  const formatPercentage = (value?: number): string => {
    if (value === undefined || value === null) return "0%";
    return `${value.toFixed(1)}%`;
  };

  // Formatage des dates
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Non définie";
    
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  useEffect(() => {
    // Log des statistiques pour le débogage
    console.log("Statistiques disponibles pour la campagne détaillée:", stats);
    console.log("Campaign object:", campaign);
  }, [stats, campaign]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Erreur: {error || "Campagne non trouvée"}</p>
      </div>
    );
  }

  // Extraction des statistiques depuis toutes les sources possibles
  const getStatValue = (key: string, defaultValue: number = 0): number => {
    // 1. Vérifier d'abord dans l'état stats local
    if (stats) {
      if (typeof stats[key] === 'number') {
        return stats[key];
      }
    }
    
    // 2. Vérifier dans campaign.statistics
    if (campaign.statistics) {
      if (typeof campaign.statistics[key] === 'number') {
        return campaign.statistics[key];
      }
    }
    
    // 3. Vérifier dans campaign.delivery_info avec mappage de noms
    if (campaign.delivery_info) {
      // Mappages alternatifs
      const mappings: Record<string, string[]> = {
        'total': ['subscriber_count', 'recipients_count'],
        'delivered': ['delivered_count'],
        'opened': ['open_count'],
        'clicked': ['click_count'],
        'delivery_rate': ['delivered_rate'],
        'unique_open_rate': ['open_rate', 'uniq_open_rate'],
        'click_rate': ['click_rate']
      };
      
      // Vérifier la clé directe d'abord
      if (typeof campaign.delivery_info[key] === 'number') {
        return campaign.delivery_info[key];
      }
      
      // Ensuite vérifier les mappages alternatifs
      if (mappings[key]) {
        for (const altKey of mappings[key]) {
          if (typeof campaign.delivery_info[altKey] === 'number') {
            return campaign.delivery_info[altKey];
          }
        }
      }
      
      // Gestion spéciale pour bounced
      if (key === 'bounced' || key === 'total_bounces') {
        if (typeof campaign.delivery_info.bounced === 'object' && campaign.delivery_info.bounced) {
          return campaign.delivery_info.bounced.total || defaultValue;
        }
        if (typeof campaign.delivery_info.bounced === 'number') {
          return campaign.delivery_info.bounced;
        }
        if (typeof campaign.delivery_info.bounce_count === 'number') {
          return campaign.delivery_info.bounce_count;
        }
      }
    }
    
    // 4. Vérifier dans stats avec mappage
    if (stats) {
      // Mappages alternatifs pour les statistiques
      const mappings: Record<string, string[]> = {
        'total': ['subscriber_count', 'recipients_count'],
        'delivered': ['delivered_count'],
        'opened': ['open_count'],
        'clicked': ['click_count'],
        'bounced': ['bounce_count'],
        'unsubscribed': ['unsubscribe_count'],
        'complained': ['complaint_count', 'abuse_complaint_count']
      };
      
      if (mappings[key]) {
        for (const altKey of mappings[key]) {
          if (typeof stats[altKey] === 'number') {
            return stats[altKey];
          }
        }
      }
      
      // Gestion spéciale pour bounced
      if (key === 'bounced' || key === 'total_bounces') {
        if (typeof stats.bounced === 'object' && stats.bounced) {
          return stats.bounced.total || defaultValue;
        }
        if (typeof stats.bounced === 'number') {
          return stats.bounced;
        }
        if (typeof stats.bounce_count === 'number') {
          return stats.bounce_count;
        }
      }
    }
    
    return defaultValue;
  };

  // Valeurs statistiques avec extraction fiable
  const total = getStatValue('total', 0);
  const delivered = getStatValue('delivered', 0);
  const opened = getStatValue('opened', 0);
  const clicked = getStatValue('clicked', 0);
  const totalBounces = getStatValue('bounced', 0);
  
  // Pour les soft/hard bounces, on a besoin d'un traitement spécial
  let softBounces = 0;
  let hardBounces = 0;
  
  // Essayer d'abord dans stats
  if (stats && stats.bounced && typeof stats.bounced === 'object') {
    softBounces = stats.bounced.soft || 0;
    hardBounces = stats.bounced.hard || 0;
  } else if (campaign.delivery_info && campaign.delivery_info.bounced && typeof campaign.delivery_info.bounced === 'object') {
    softBounces = campaign.delivery_info.bounced.soft || 0;
    hardBounces = campaign.delivery_info.bounced.hard || 0;
  }
  
  const unsubscribed = getStatValue('unsubscribed', 0);
  const complained = getStatValue('complained', 0);
  
  // Calcul des taux si nécessaire
  let delivery_rate = getStatValue('delivery_rate');
  if (delivery_rate === 0 && total > 0 && delivered > 0) {
    delivery_rate = (delivered / total) * 100;
  }
  
  let open_rate = getStatValue('unique_open_rate');
  if (open_rate === 0 && delivered > 0 && opened > 0) {
    open_rate = (opened / delivered) * 100;
  }
  
  let click_rate = getStatValue('click_rate');
  if (click_rate === 0 && delivered > 0 && clicked > 0) {
    click_rate = (clicked / delivered) * 100;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Informations générales</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nom:</span>
              <span className="font-medium">{campaign.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sujet:</span>
              <span>{campaign.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <Badge variant={getStatusBadgeVariant(campaign.status)}>
                {translateStatus(campaign.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Créée le:</span>
              <span>{formatDate(campaign.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Envoyée le:</span>
              <span>{formatDate(campaign.delivery_date)}</span>
            </div>
            {campaign.last_error && (
              <div className="flex justify-between">
                <span className="text-gray-600">Erreur:</span>
                <span className="text-red-500">{campaign.last_error}</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Statistiques globales</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Destinataires:</span>
              <span className="font-medium">{formatNumber(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Délivrés:</span>
              <span>{formatNumber(delivered)} ({formatPercentage(delivery_rate)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ouvertures:</span>
              <span>{formatNumber(opened)} ({formatPercentage(open_rate)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clics:</span>
              <span>{formatNumber(clicked)} ({formatPercentage(click_rate)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bounces:</span>
              <span>{formatNumber(totalBounces)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Désabonnements:</span>
              <span>{formatNumber(unsubscribed)}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistiques détaillées</TabsTrigger>
          <TabsTrigger value="links">Liens et clics</TabsTrigger>
          <TabsTrigger value="technical">Informations techniques</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Délivrabilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(delivery_rate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(delivered)} sur {formatNumber(total)} emails délivrés
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(open_rate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(opened)} emails ouverts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux de clic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(click_rate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(clicked)} clics enregistrés
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détail des bounces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Bounces totaux:</span>
                    <span className="font-medium">{formatNumber(totalBounces)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Soft bounces:</span>
                    <span>{formatNumber(softBounces)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hard bounces:</span>
                    <span>{formatNumber(hardBounces)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Autres métriques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Désabonnements:</span>
                    <span className="font-medium">{formatNumber(unsubscribed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plaintes:</span>
                    <span>{formatNumber(complained)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="py-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">
                Les données détaillées sur les clics ne sont pas disponibles pour le moment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Données techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {campaign.uid || campaign.campaign_uid}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière mise à jour:</span>
                  <span>{formatDate(campaign.updated_at)}</span>
                </div>
                {campaign.run_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date planifiée:</span>
                    <span>{formatDate(campaign.run_at)}</span>
                  </div>
                )}
              </div>
              
              {demoMode && (
                <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-sm rounded-md">
                  Mode démonstration activé : les données affichées sont simulées.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
