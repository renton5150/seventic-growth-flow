
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { AcelleAccount } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";

interface AcelleCampaignDetailsProps {
  account: AcelleAccount;
  campaignUid: string;
}

export default function AcelleCampaignDetails({ account, campaignUid }: AcelleCampaignDetailsProps) {
  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ["acelleCampaignDetails", account.id, campaignUid],
    queryFn: () => acelleService.getAcelleCampaignDetails(account, campaignUid),
  });

  const translateStatus = (status: string) => {
    switch (status) {
      case "new": return "Nouveau";
      case "queued": return "En attente";
      case "sending": return "En cours d'envoi";
      case "sent": return "Envoyé";
      case "paused": return "En pause";
      case "failed": return "Échoué";
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "secondary";
      case "queued": return "outline";
      case "sending": return "default";
      case "sent": return "success";
      case "paused": return "warning";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const renderPercentage = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erreur lors du chargement des détails de la campagne</p>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6384'];

  const deliveryData = [
    { name: "Livrés", value: campaign.delivery_info?.delivered || 0 },
    { name: "Non livrés", value: (campaign.delivery_info?.total || 0) - (campaign.delivery_info?.delivered || 0) },
  ];

  const engagementData = [
    { name: "Ouverts", value: campaign.delivery_info?.opened || 0 },
    { name: "Cliqués", value: campaign.delivery_info?.clicked || 0 },
    { name: "Non ouverts", value: (campaign.delivery_info?.delivered || 0) - (campaign.delivery_info?.opened || 0) },
  ];

  const bounceData = [
    { name: "Soft bounce", value: campaign.delivery_info?.bounced?.soft || 0 },
    { name: "Hard bounce", value: campaign.delivery_info?.bounced?.hard || 0 },
    { name: "Désabonnés", value: campaign.delivery_info?.unsubscribed || 0 },
    { name: "Plaintes", value: campaign.delivery_info?.complained || 0 },
  ];

  const barData = [
    { name: "Envoyés", value: campaign.delivery_info?.total || 0 },
    { name: "Livrés", value: campaign.delivery_info?.delivered || 0 },
    { name: "Ouverts", value: campaign.delivery_info?.opened || 0 },
    { name: "Cliqués", value: campaign.delivery_info?.clicked || 0 },
    { name: "Rebonds", value: (campaign.delivery_info?.bounced?.soft || 0) + (campaign.delivery_info?.bounced?.hard || 0) },
    { name: "Désabonnés", value: campaign.delivery_info?.unsubscribed || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>Sujet: {campaign.subject}</span>
              <Badge variant={getStatusBadgeVariant(campaign.status) as any}>
                {translateStatus(campaign.status)}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Créé le</dt>
                <dd className="text-sm">
                  {format(new Date(campaign.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Envoyé le</dt>
                <dd className="text-sm">
                  {campaign.run_at 
                    ? format(new Date(campaign.run_at), "dd/MM/yyyy HH:mm", { locale: fr }) 
                    : "Non envoyé"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Dernière mise à jour</dt>
                <dd className="text-sm">
                  {format(new Date(campaign.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tracking</dt>
                <dd className="text-sm">
                  {campaign.tracking?.open_tracking ? "Ouvertures: Activé" : "Ouvertures: Désactivé"}{", "}
                  {campaign.tracking?.click_tracking ? "Clics: Activé" : "Clics: Désactivé"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métriques clés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails envoyés</p>
                <p className="text-2xl font-bold">{campaign.delivery_info?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails livrés</p>
                <p className="text-2xl font-bold">{campaign.delivery_info?.delivered || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {renderPercentage(campaign.delivery_info?.delivery_rate)} du total
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails ouverts</p>
                <p className="text-2xl font-bold">{campaign.delivery_info?.opened || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {renderPercentage(campaign.delivery_info?.unique_open_rate)} des livrés
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails cliqués</p>
                <p className="text-2xl font-bold">{campaign.delivery_info?.clicked || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {renderPercentage(campaign.delivery_info?.click_rate)} des livrés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de la campagne</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Nombre d'emails" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Livraison</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deliveryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deliveryData.map((entry, index) => (
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
                <CardTitle>Problèmes</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bounceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {bounceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Nombre d'emails"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {engagementData.map((entry, index) => (
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
              <CardTitle>Statistiques détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Taux d'ouverture</dt>
                  <dd className="text-2xl font-bold">{renderPercentage(campaign.delivery_info?.unique_open_rate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Taux de clic</dt>
                  <dd className="text-2xl font-bold">{renderPercentage(campaign.delivery_info?.click_rate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Taux de désabonnement</dt>
                  <dd className="text-2xl font-bold">{renderPercentage(campaign.delivery_info?.unsubscribe_rate)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contenu HTML</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 h-[400px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: campaign.html || "<p>Aucun contenu HTML</p>" }} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contenu texte brut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 h-[200px] overflow-auto bg-muted">
                <pre className="text-sm">
                  {campaign.plain || "Aucun contenu texte"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
