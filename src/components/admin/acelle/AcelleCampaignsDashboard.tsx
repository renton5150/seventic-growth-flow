
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
}

export default function AcelleCampaignsDashboard({ accounts }: AcelleCampaignsDashboardProps) {
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);
  const [campaignsData, setCampaignsData] = useState<AcelleCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const filteredAccounts = accounts.filter(acc => acc.status === "active");
    setActiveAccounts(filteredAccounts);
  }, [accounts]);
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
    queryFn: async () => {
      setLoading(true);
      const results: AcelleCampaign[] = [];
      
      for (const account of activeAccounts) {
        try {
          const campaigns = await acelleService.getAcelleCampaigns(account);
          results.push(...campaigns);
        } catch (error) {
          console.error(`Erreur lors de la récupération des campagnes pour ${account.name}:`, error);
        }
      }
      
      setLoading(false);
      return results;
    },
    enabled: activeAccounts.length > 0,
  });
  
  useEffect(() => {
    if (data) {
      setCampaignsData(data);
    }
  }, [data]);
  
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      "new": 0,
      "queued": 0,
      "sending": 0,
      "sent": 0,
      "paused": 0,
      "failed": 0
    };
    
    campaignsData.forEach(campaign => {
      if (campaign.status in counts) {
        counts[campaign.status]++;
      }
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      status: translateStatus(status),
      count
    }));
  }, [campaignsData]);
  
  const deliveryStats = React.useMemo(() => {
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    
    campaignsData.forEach(campaign => {
      const info = campaign.delivery_info;
      if (info) {
        totalSent += info.total || 0;
        totalOpened += info.opened || 0;
        totalClicked += info.clicked || 0;
        totalBounced += (info.bounced?.soft || 0) + (info.bounced?.hard || 0);
      }
    });
    
    return [
      { name: "Envoyés", value: totalSent },
      { name: "Ouverts", value: totalOpened },
      { name: "Cliqués", value: totalClicked },
      { name: "Bounces", value: totalBounced }
    ];
  }, [campaignsData]);
  
  function translateStatus(status: string): string {
    const translations: Record<string, string> = {
      "new": "Nouveau",
      "queued": "En attente",
      "sending": "En envoi",
      "sent": "Envoyé",
      "paused": "En pause",
      "failed": "Échoué"
    };
    
    return translations[status] || status;
  }
  
  if (activeAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p>Aucun compte actif trouvé.</p>
            <p className="text-sm text-muted-foreground mt-2">Activez au moins un compte Acelle Mail pour voir les statistiques.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-red-500">Erreur lors du chargement des données</p>
            <p className="text-sm text-muted-foreground mt-2">Veuillez réessayer plus tard.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Statut des campagnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusCounts.some(item => item.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={statusCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} campagne(s)`, ""]} />
                  <Legend />
                  <Bar dataKey="count" name="Nombre" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Statistiques d'envoi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryStats.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={deliveryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value}`, ""]} />
                  <Legend />
                  <Bar dataKey="value" name="Nombre" fill="#82ca9d" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-2xl font-bold">{campaignsData.length}</p>
              <p className="text-muted-foreground">Campagnes</p>
            </div>
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-2xl font-bold">{deliveryStats[0].value}</p>
              <p className="text-muted-foreground">Emails envoyés</p>
            </div>
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-2xl font-bold">
                {deliveryStats[0].value > 0 
                  ? `${((deliveryStats[1].value / deliveryStats[0].value) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
              <p className="text-muted-foreground">Taux d'ouverture</p>
            </div>
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-2xl font-bold">
                {deliveryStats[0].value > 0 
                  ? `${((deliveryStats[2].value / deliveryStats[0].value) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
              <p className="text-muted-foreground">Taux de clic</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
