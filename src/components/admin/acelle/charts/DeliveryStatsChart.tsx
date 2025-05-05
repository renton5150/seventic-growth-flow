
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { calculateDeliveryStats } from '@/utils/acelle/campaignStats';
import { fetchCampaignsFromCache } from '@/hooks/acelle/useCampaignFetch';

interface DeliveryStatsChartProps {
  accounts: AcelleAccount[];
  demoMode?: boolean;
}

export const DeliveryStatsChart: React.FC<DeliveryStatsChartProps> = ({ accounts, demoMode = false }) => {
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les campagnes depuis le cache
  useEffect(() => {
    const loadCampaigns = async () => {
      if (demoMode) {
        setLoading(false);
        return; // Ne pas charger les données réelles en mode démo
      }
      
      if (accounts && accounts.length > 0) {
        setLoading(true);
        try {
          // Récupérer les 5 dernières campagnes pour chaque compte
          const fetchedCampaigns = await fetchCampaignsFromCache(accounts, 1, 5, false);
          setCampaigns(fetchedCampaigns);
        } catch (error) {
          console.error("Erreur lors de la récupération des campagnes:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadCampaigns();
  }, [accounts, demoMode]);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    // Si mode démo, générer des données factices
    if (demoMode) {
      // Données de démonstration
      return [
        { name: "Campagne 1", delivered: 450, opened: 280, clicked: 150, bounced: 15, total: 500 },
        { name: "Campagne 2", delivered: 580, opened: 320, clicked: 180, bounced: 20, total: 600 },
        { name: "Campagne 3", delivered: 620, opened: 340, clicked: 210, bounced: 10, total: 650 },
        { name: "Campagne 4", delivered: 780, opened: 400, clicked: 250, bounced: 30, total: 800 },
        { name: "Campagne 5", delivered: 850, opened: 420, clicked: 280, bounced: 25, total: 900 }
      ];
    }
    
    // Si aucune campagne ou en cours de chargement
    if (!campaigns || campaigns.length === 0) {
      return [];
    }
    
    // Limiter aux 5 dernières campagnes envoyées pour une meilleure lisibilité
    const recentCampaigns = [...campaigns]
      .filter(c => c.status === 'sent' || c.status === 'sending')
      .sort((a, b) => {
        const dateA = new Date(a.delivery_date || a.created_at || 0).getTime();
        const dateB = new Date(b.delivery_date || b.created_at || 0).getTime();
        return dateB - dateA; // Tri par date décroissante
      })
      .slice(0, 5);
    
    // Créer les données pour le graphique
    return recentCampaigns.map(campaign => {
      // Extraire les statistiques
      const stats = campaign.statistics;
      const delivery = campaign.delivery_info;
      
      let total = 0, delivered = 0, opened = 0, clicked = 0, bounced = 0;
      
      // Utiliser la source la plus fiable entre statistics et delivery_info
      if (stats) {
        total = stats.subscriber_count || 0;
        delivered = stats.delivered_count || 0;
        opened = stats.open_count || 0;
        clicked = stats.click_count || 0;
        bounced = stats.bounce_count || 0;
      } else if (delivery) {
        total = delivery.total || 0;
        delivered = delivery.delivered || 0;
        opened = delivery.opened || 0;
        clicked = delivery.clicked || 0;
        
        if (typeof delivery.bounced === 'number') {
          bounced = delivery.bounced;
        } else if (typeof delivery.bounced === 'object' && delivery.bounced) {
          bounced = delivery.bounced.total || 0;
        }
      }
      
      // Formater le nom pour limiter la longueur
      const name = campaign.name && campaign.name.length > 20
        ? `${campaign.name.substring(0, 20)}...`
        : campaign.name || 'Sans nom';
      
      return {
        name,
        total,
        delivered,
        opened,
        clicked,
        bounced
      };
    });
  }, [campaigns, demoMode]);

  // Format personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow text-sm">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-green-600">Délivrés: {payload[0].value.toLocaleString()}</p>
            <p className="text-blue-600">Ouverts: {payload[1].value.toLocaleString()}</p>
            <p className="text-amber-600">Cliqués: {payload[2].value.toLocaleString()}</p>
            <p className="text-red-600">Rebonds: {payload[3].value.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Si les données agrégées pour toutes les campagnes
  const aggregatedData = useMemo(() => {
    if (demoMode || !campaigns || campaigns.length === 0) return null;
    
    const stats = calculateDeliveryStats(campaigns);
    return {
      name: "Totaux",
      total: stats.totalEmails,
      delivered: stats.totalDelivered,
      opened: stats.totalOpened,
      clicked: stats.totalClicked,
      bounced: stats.totalBounced
    };
  }, [campaigns, demoMode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performances des campagnes</CardTitle>
        <CardDescription>Statistiques des campagnes récentes</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-60">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Chargement des données...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  scale="band"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="delivered" name="Délivrés" fill="#10b981" />
                <Bar dataKey="opened" name="Ouverts" fill="#3b82f6" />
                <Bar dataKey="clicked" name="Cliqués" fill="#f59e0b" />
                <Bar dataKey="bounced" name="Rebonds" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>
        
        {aggregatedData && (
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-sm">
            <div className="bg-gray-100 p-2 rounded">
              <div className="font-medium">Total</div>
              <div>{aggregatedData.total.toLocaleString()}</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="font-medium text-green-700">Délivrés</div>
              <div>{aggregatedData.delivered.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-medium text-blue-700">Ouverts</div>
              <div>{aggregatedData.opened.toLocaleString()}</div>
            </div>
            <div className="bg-amber-50 p-2 rounded">
              <div className="font-medium text-amber-700">Cliqués</div>
              <div>{aggregatedData.clicked.toLocaleString()}</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="font-medium text-red-700">Rebonds</div>
              <div>{aggregatedData.bounced.toLocaleString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
