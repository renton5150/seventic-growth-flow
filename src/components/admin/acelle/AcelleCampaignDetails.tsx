
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AcelleAccount, AcelleCampaignDetail } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { DataUnavailableAlert } from "./errors/DataUnavailableAlert";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { generateMockCampaigns } from "@/services/acelle/api/mockData";
import { supabase } from "@/integrations/supabase/client";

// Définition des couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a163f7'];

// Define the interface for component props
interface AcelleCampaignDetailsProps {
  account: AcelleAccount;
  campaignUid: string;
}

// Update function to accept props
const AcelleCampaignDetails: React.FC<AcelleCampaignDetailsProps> = ({ account, campaignUid }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Get access token on mount
  useEffect(() => {
    const getAccessToken = async () => {
      try {
        console.log("Fetching auth token for campaign details");
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          console.log("Auth token obtained successfully");
          setAccessToken(sessionData.session.access_token);
        } else {
          console.error("No access token found in session");
        }
      } catch (error) {
        console.error("Error getting access token:", error);
      }
    };
    
    getAccessToken();
  }, []);

  const { data: campaignDetails, isLoading, isError } = useQuery({
    queryKey: ["campaignDetails", account?.id, campaignUid, accessToken],
    queryFn: async () => {
      try {
        console.log(`Fetching details for campaign ${campaignUid} with token: ${accessToken ? 'present' : 'absent'}`);
        return await acelleService.fetchCampaignDetails(account, campaignUid, accessToken);
      } catch (error) {
        console.error(`Error fetching campaign details: ${error}`);
        toast.error(`Erreur lors du chargement des détails de la campagne: ${error}`);
        throw error;
      }
    },
    enabled: !!account && !!campaignUid && !!accessToken,
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });

  if (!accessToken) {
    return (
      <div className="py-8 text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p>Authentification en cours...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p>Chargement des détails de la campagne...</p>
      </div>
    );
  }

  if (isError && !campaignDetails) {
    return <DataUnavailableAlert message="Impossible de charger les détails de cette campagne" />;
  }

  const campaignDetail = campaignDetails as AcelleCampaignDetail;

  // Données pour le graphique circulaire des statuts d'envoi
  const deliveryData = [
    { name: 'Envoyés', value: campaignDetail?.delivery_info?.delivered || campaignDetail?.statistics?.delivered_count || 0 },
    { name: 'Non livrés', value: (campaignDetail?.delivery_info?.bounced?.total || campaignDetail?.statistics?.bounce_count || 0) },
  ];

  // Données pour le graphique d'engagement
  const engagementData = [
    { name: 'Livrés', value: campaignDetail?.delivery_info?.delivered || campaignDetail?.statistics?.delivered_count || 0 },
    { name: 'Ouverts', value: campaignDetail?.delivery_info?.opened || campaignDetail?.statistics?.open_count || 0 },
    { name: 'Cliqués', value: campaignDetail?.delivery_info?.clicked || campaignDetail?.statistics?.click_count || 0 }
  ];

  const isDemoMode = campaignUid.startsWith('mock-');

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div>
        <h2 className="text-xl font-semibold">{campaignDetail?.name}</h2>
        <p className="text-muted-foreground">{campaignDetail?.subject}</p>
        {isDemoMode && (
          <div className="mt-1 text-xs text-amber-500">Mode démonstration activé : les données sont simulées</div>
        )}
      </div>
      
      {/* Campaign details tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Display campaign overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <p>{campaignDetail?.status === 'sent' ? 'Envoyé' : 
                  campaignDetail?.status === 'sending' ? 'En cours d\'envoi' : 
                  campaignDetail?.status === 'queued' ? 'En attente' : 
                  campaignDetail?.status === 'new' ? 'Nouveau' :
                  campaignDetail?.status === 'paused' ? 'En pause' : 
                  campaignDetail?.status}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Date d'envoi</h3>
              <p>{campaignDetail?.run_at ? new Date(campaignDetail.run_at).toLocaleDateString('fr-FR') : 'Non programmé'}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Date de création</h3>
              <p>{campaignDetail?.created_at ? new Date(campaignDetail.created_at).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Dernière mise à jour</h3>
              <p>{campaignDetail?.updated_at ? new Date(campaignDetail.updated_at).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Résumé des statistiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total envoyé</div>
                  <div className="text-2xl font-bold">
                    {campaignDetail?.statistics?.subscriber_count || 
                     campaignDetail?.delivery_info?.total || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Taux d'ouverture</div>
                  <div className="text-2xl font-bold">
                    {campaignDetail?.statistics?.uniq_open_rate?.toFixed(1) || 
                     campaignDetail?.delivery_info?.unique_open_rate?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Taux de clic</div>
                  <div className="text-2xl font-bold">
                    {campaignDetail?.statistics?.click_rate?.toFixed(1) || 
                     campaignDetail?.delivery_info?.click_rate?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Bounces</div>
                  <div className="text-2xl font-bold">
                    {campaignDetail?.statistics?.bounce_count || 
                     campaignDetail?.delivery_info?.bounced?.total || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribution d'envoi</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {deliveryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} emails`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Engagement</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={engagementData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} emails`, ""]} />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" name="Nombre" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Détails des statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Envoyés</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.subscriber_count || 
                     campaignDetail?.delivery_info?.total || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Livrés</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.delivered_count || 
                     campaignDetail?.delivery_info?.delivered || 0}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({campaignDetail?.statistics?.delivered_rate?.toFixed(1) || 
                       campaignDetail?.delivery_info?.delivery_rate?.toFixed(1) || 0}%)
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Ouverts (unique)</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.open_count || 
                     campaignDetail?.delivery_info?.opened || 0}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({campaignDetail?.statistics?.uniq_open_rate?.toFixed(1) || 
                       campaignDetail?.delivery_info?.unique_open_rate?.toFixed(1) || 0}%)
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Clics</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.click_count || 
                     campaignDetail?.delivery_info?.clicked || 0}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({campaignDetail?.statistics?.click_rate?.toFixed(1) || 
                       campaignDetail?.delivery_info?.click_rate?.toFixed(1) || 0}%)
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Bounces</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.bounce_count || 
                     campaignDetail?.delivery_info?.bounced?.total || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Soft Bounces</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.soft_bounce_count || 
                     campaignDetail?.delivery_info?.bounced?.soft || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Hard Bounces</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.hard_bounce_count || 
                     campaignDetail?.delivery_info?.bounced?.hard || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Désabonnements</div>
                  <div className="text-lg">
                    {campaignDetail?.statistics?.unsubscribe_count || 
                     campaignDetail?.delivery_info?.unsubscribed || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contenu HTML</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-white">
                <div className="prose max-w-full"
                  dangerouslySetInnerHTML={{ __html: campaignDetail?.html || '<p>Contenu HTML non disponible</p>' }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Version Texte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-slate-50 whitespace-pre-line font-mono text-sm">
                {campaignDetail?.plain || 'Contenu texte non disponible'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
