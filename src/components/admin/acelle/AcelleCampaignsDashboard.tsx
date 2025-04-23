
import React, { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DateRangePicker } from "@/components/planning/DateRangePicker";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
}

export default function AcelleCampaignsDashboard({ accounts }: AcelleCampaignsDashboardProps) {
  const [selectedMissionId, setSelectedMissionId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });

  // Regrouper les comptes par mission pour le filtre
  const missionGroups = accounts.reduce((groups, account) => {
    if (!groups[account.missionId]) {
      groups[account.missionId] = {
        id: account.missionId,
        name: account.missionName || "Mission inconnue",
        accounts: []
      };
    }
    groups[account.missionId].accounts.push(account);
    return groups;
  }, {} as Record<string, { id: string; name: string; accounts: AcelleAccount[] }>);

  // Filtrer les comptes actifs basés sur le filtre de mission
  const filteredAccounts = accounts.filter(account => 
    account.status === "active" && 
    (selectedMissionId === "all" || account.missionId === selectedMissionId)
  );

  // Récupérer les campagnes pour tous les comptes filtrés
  const campaignsQueries = useQueries({
    queries: filteredAccounts.map(account => ({
      queryKey: ["acelleCampaigns", account.id],
      queryFn: () => acelleService.getAcelleCampaigns(account),
      enabled: account.status === "active",
    })),
    combine: (results) => {
      return {
        data: results.flatMap(result => result.data || []),
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError && !result.isLoading),
      };
    }
  });

  const { data: campaigns = [], isLoading, isError } = campaignsQueries;

  // Filtrer les campagnes par date
  const filteredCampaigns = campaigns.filter(campaign => {
    if (!dateRange?.from || !dateRange?.to) return true;
    
    const campaignDate = new Date(campaign.created_at);
    return campaignDate >= dateRange.from && campaignDate <= dateRange.to;
  });

  // Données pour les graphiques
  const prepareChartData = () => {
    // Statistiques globales
    const totalSent = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.delivery_info?.total || 0), 0);
    const totalOpened = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.delivery_info?.opened || 0), 0);
    const totalClicked = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.delivery_info?.clicked || 0), 0);
    const totalBounced = filteredCampaigns.reduce((sum, campaign) => 
      sum + ((campaign.delivery_info?.bounced?.soft || 0) + (campaign.delivery_info?.bounced?.hard || 0)), 0
    );
    const totalUnsubscribed = filteredCampaigns.reduce((sum, campaign) => sum + (campaign.delivery_info?.unsubscribed || 0), 0);

    // Données pour le graphique en camembert
    const pieData = [
      { name: "Ouverts", value: totalOpened },
      { name: "Cliqués", value: totalClicked },
      { name: "Non ouverts", value: totalSent - totalOpened - totalBounced },
      { name: "Rebonds", value: totalBounced },
      { name: "Désabonnés", value: totalUnsubscribed },
    ];

    // Données pour le graphique en barres
    const barData = filteredCampaigns
      .map(campaign => ({
        name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + "..." : campaign.name,
        "Taux d'ouverture": campaign.delivery_info?.unique_open_rate ? (campaign.delivery_info.unique_open_rate * 100).toFixed(1) : 0,
        "Taux de clic": campaign.delivery_info?.click_rate ? (campaign.delivery_info.click_rate * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => parseFloat(b["Taux d'ouverture"] as string) - parseFloat(a["Taux d'ouverture"] as string))
      .slice(0, 10);

    // Regrouper par mission pour le tableau comparatif
    const missionData = Object.values(
      filteredCampaigns.reduce((acc, campaign) => {
        const account = accounts.find(a => 
          filteredAccounts.some(fa => fa.id === a.id && fa.apiEndpoint === campaign.delivery_info?.server)
        );
        
        const missionName = account?.missionName || "Inconnu";
        
        if (!acc[missionName]) {
          acc[missionName] = {
            mission: missionName,
            campaigns: 0,
            sent: 0,
            opened: 0,
            clicked: 0,
            openRate: 0,
            clickRate: 0
          };
        }
        
        acc[missionName].campaigns += 1;
        acc[missionName].sent += campaign.delivery_info?.total || 0;
        acc[missionName].opened += campaign.delivery_info?.opened || 0;
        acc[missionName].clicked += campaign.delivery_info?.clicked || 0;
        
        return acc;
      }, {} as Record<string, any>)
    ).map(item => ({
      ...item,
      openRate: item.sent > 0 ? ((item.opened / item.sent) * 100).toFixed(1) + "%" : "0%",
      clickRate: item.sent > 0 ? ((item.clicked / item.sent) * 100).toFixed(1) + "%" : "0%"
    }));

    return { pieData, barData, missionData, totalSent, totalOpened, totalClicked, totalBounced, totalUnsubscribed };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6384'];
  const chartData = prepareChartData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="w-full">
          <CardContent className="pt-6">
            <p className="text-center">Chargement des données de campagnes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-red-500">
            Une erreur est survenue lors du chargement des données de campagnes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-1/3">
          <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par mission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les missions</SelectItem>
              {Object.values(missionGroups).map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} ({group.accounts.length} comptes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/3">
          <DateRangePicker 
            date={dateRange}
            onDateChange={setDateRange}
            locale={fr}
          />
        </div>
        
        <div className="w-full md:w-1/3 flex justify-end">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter les données
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campagnes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredCampaigns.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emails envoyés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{chartData.totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {chartData.totalSent > 0 
                ? ((chartData.totalOpened / chartData.totalSent) * 100).toFixed(1) + "%" 
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de clic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {chartData.totalSent > 0 
                ? ((chartData.totalClicked / chartData.totalSent) * 100).toFixed(1) + "%" 
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="compare">Comparaison</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des emails</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Nombre d'emails"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 campagnes par taux d'ouverture</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [`${value}%`, ""]} />
                    <Legend />
                    <Bar dataKey="Taux d'ouverture" fill="#8884d8" />
                    <Bar dataKey="Taux de clic" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performances par mission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Mission</th>
                      <th className="text-left py-3 px-4 font-medium">Campagnes</th>
                      <th className="text-left py-3 px-4 font-medium">Emails envoyés</th>
                      <th className="text-left py-3 px-4 font-medium">Emails ouverts</th>
                      <th className="text-left py-3 px-4 font-medium">Taux d'ouverture</th>
                      <th className="text-left py-3 px-4 font-medium">Taux de clic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.missionData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">{item.mission}</td>
                        <td className="py-3 px-4">{item.campaigns}</td>
                        <td className="py-3 px-4">{item.sent.toLocaleString()}</td>
                        <td className="py-3 px-4">{item.opened.toLocaleString()}</td>
                        <td className="py-3 px-4">{item.openRate}</td>
                        <td className="py-3 px-4">{item.clickRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison de campagnes</CardTitle>
              <CardDescription>
                Sélectionnez des campagnes pour comparer leurs performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Fonctionnalité de comparaison à venir
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendances temporelles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Fonctionnalité d'analyse de tendances à venir
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
