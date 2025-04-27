import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { DataUnavailableAlert } from "./errors/DataUnavailableAlert";

import { AcelleAccount, AcelleCampaignDetail, AcelleCampaignDeliveryInfo } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";

interface AcelleCampaignDetailsProps {
  account: AcelleAccount;
  campaignUid: string;
}

export default function AcelleCampaignDetails({ account, campaignUid }: AcelleCampaignDetailsProps) {
  const { data: campaign, isLoading, isError, error, refetch } = useQuery<AcelleCampaignDetail>({
    queryKey: ["acelleCampaignDetails", account.id, campaignUid],
    queryFn: () => acelleService.getAcelleCampaignDetails(account, campaignUid),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non disponible";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (error) {
      console.error(`Invalid date format: ${dateString}`, error);
      return "Date invalide";
    }
  };

  const isServerError = error && (
    error instanceof Error && error.message.includes("500") ||
    error instanceof Error && error.message.includes("erreur interne")
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
        <p className="text-red-500 mb-2">
          {isServerError 
            ? "Le serveur d'Acelle Mail a rencontré une erreur interne. Veuillez réessayer plus tard ou contacter l'administrateur de la plateforme Acelle Mail."
            : "Erreur lors du chargement des détails de la campagne"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Une erreur s'est produite"}
        </p>
      </div>
    );
  }

  // Affichage en mode dégradé si certaines données sont manquantes
  const hasIncompleteData = campaign && (!campaign.delivery_info || !campaign.statistics);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6384'];

  const deliveryInfo: AcelleCampaignDeliveryInfo = {
    total: campaign?.delivery_info?.total ?? 0,
    delivery_rate: campaign?.delivery_info?.delivery_rate ?? 0,
    unique_open_rate: campaign?.delivery_info?.unique_open_rate ?? 0,
    click_rate: campaign?.delivery_info?.click_rate ?? 0,
    bounce_rate: campaign?.delivery_info?.bounce_rate ?? 0,
    unsubscribe_rate: campaign?.delivery_info?.unsubscribe_rate ?? 0,
    delivered: campaign?.delivery_info?.delivered ?? 0,
    opened: campaign?.delivery_info?.opened ?? 0,
    clicked: campaign?.delivery_info?.clicked ?? 0,
    bounced: {
      soft: campaign?.delivery_info?.bounced?.soft ?? 0,
      hard: campaign?.delivery_info?.bounced?.hard ?? 0,
      total: campaign?.delivery_info?.bounced?.total ?? 0
    },
    unsubscribed: campaign?.delivery_info?.unsubscribed ?? 0,
    complained: campaign?.delivery_info?.complained ?? 0
  };

  const total = deliveryInfo.total;
  const delivered = deliveryInfo.delivered;
  const opened = deliveryInfo.opened;
  const clicked = deliveryInfo.clicked;
  const bounced = deliveryInfo.bounced.total;
  const unsubscribed = deliveryInfo.unsubscribed;

  const deliveryData = [
    { name: "Livrés", value: delivered },
    { name: "Non livrés", value: Math.max(0, total - delivered) },
  ];

  const engagementData = [
    { name: "Ouverts", value: opened },
    { name: "Cliqués", value: clicked },
    { name: "Non ouverts", value: Math.max(0, delivered - opened) },
  ];

  const bounceData = [
    { name: "Soft bounce", value: deliveryInfo.bounced.soft },
    { name: "Hard bounce", value: deliveryInfo.bounced.hard },
    { name: "Désabonnés", value: unsubscribed },
    { name: "Plaintes", value: deliveryInfo.complained },
  ];

  const barData = [
    { name: "Envoyés", value: total },
    { name: "Livrés", value: delivered },
    { name: "Ouverts", value: opened },
    { name: "Cliqués", value: clicked },
    { name: "Rebonds", value: bounced },
    { name: "Désabonnés", value: unsubscribed },
  ];

  return (
    <div className="space-y-6">
      {hasIncompleteData && (
        <DataUnavailableAlert 
          message="Certaines statistiques détaillées sont temporairement indisponibles. Les informations de base sont affichées ci-dessous." 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{campaign?.name}</CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>Sujet: {campaign?.subject}</span>
              <Badge variant={getStatusBadgeVariant(campaign?.status || "") as any}>
                {translateStatus(campaign?.status || "")}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Créé le</dt>
                <dd className="text-sm">
                  {formatDateSafely(campaign?.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Envoyé le</dt>
                <dd className="text-sm">
                  {campaign?.run_at ? formatDateSafely(campaign?.run_at) : "Non envoyé"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Dernière mise à jour</dt>
                <dd className="text-sm">
                  {formatDateSafely(campaign?.updated_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tracking</dt>
                <dd className="text-sm">
                  {campaign?.tracking?.open_tracking ? "Ouvertures: Activé" : "Ouvertures: Désactivé"}{", "}
                  {campaign?.tracking?.click_tracking ? "Clics: Activé" : "Clics: Désactivé"}
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
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails livrés</p>
                <p className="text-2xl font-bold">{delivered}</p>
                <p className="text-sm text-muted-foreground">
                  {renderPercentage(deliveryInfo.delivery_rate)} du total
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails ouverts</p>
                <p className="text-2xl font-bold">{opened}</p>
                <p className="text-sm text-muted-foreground">
                  {renderPercentage(deliveryInfo.unique_open_rate)} des livrés
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails cliqués</p>
                <p className="text-2xl font-bold">{clicked}</p>
                <p className="text-sm text-muted-foreground">
                  {renderPercentage(deliveryInfo.click_rate)} des livrés
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
                  <dd className="text-2xl font-bold">{renderPercentage(deliveryInfo.unique_open_rate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Taux de clic</dt>
                  <dd className="text-2xl font-bold">{renderPercentage(deliveryInfo.click_rate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Taux de désabonnement</dt>
                  <dd className="text-2xl font-bold">{renderPercentage(deliveryInfo.unsubscribe_rate)}</dd>
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
                <div dangerouslySetInnerHTML={{ __html: campaign?.html || "<p>Aucun contenu HTML</p>" }} />
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
                  {campaign?.plain || "Aucun contenu texte"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
