
import React, { useState } from "react";
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

  const { data: campaignDetails, isLoading, isError } = useQuery({
    queryKey: ["campaignDetails", account?.id, campaignUid],
    queryFn: async () => {
      try {
        return await acelleService.fetchCampaignDetails(account, campaignUid);
      } catch (error) {
        console.error(`Error fetching campaign details: ${error}`);
        
        // Si l'UID commence par "mock-", c'est une campagne de démonstration
        if (campaignUid.startsWith('mock-')) {
          // Générer un détail de campagne fictif correspondant à l'UID
          const mockNumber = parseInt(campaignUid.replace('mock-', ''), 10) || 1;
          const mockCampaigns = generateMockCampaigns(mockNumber);
          const mockCampaign = mockCampaigns[mockNumber - 1] || mockCampaigns[0];
          
          if (mockCampaign) {
            // Attention: assurons-nous de traiter mockCampaign comme AcelleCampaignDetail
            const detailCampaign = mockCampaign as unknown as AcelleCampaignDetail;
            detailCampaign.html = `<h1>Contenu de démonstration</h1>
              <p>Ceci est un exemple de contenu HTML pour une campagne email.</p>
              <p>Les détails réels ne sont pas disponibles actuellement.</p>`;
            
            detailCampaign.plain = `Contenu de démonstration
              Les détails réels ne sont pas disponibles actuellement.`;
              
            return detailCampaign;
          }
        }
        
        // Générer une campagne demo
        const mockCampaign = generateMockCampaigns(1)[0];
        // Assurer que nous traitons mockCampaign comme un AcelleCampaignDetail
        const detailCampaign = mockCampaign as unknown as AcelleCampaignDetail;
        detailCampaign.uid = campaignUid;
        detailCampaign.campaign_uid = campaignUid;
        detailCampaign.name = "Campagne démo (donnée non disponible)";
        detailCampaign.subject = "Données de démonstration";
        detailCampaign.html = `<h1>Données de démonstration</h1>
          <p>Les détails réels ne sont pas disponibles actuellement.</p>`;
        detailCampaign.plain = "Données de démonstration\nLes détails réels ne sont pas disponibles actuellement.";
        
        return detailCampaign;
      }
    },
    enabled: !!account && !!campaignUid,
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
    meta: {
      onError: (error: any) => {
        toast.error(`Erreur lors du chargement des détails de la campagne: ${error}`);
      }
    }
  });

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

  // Données pour le graphique circulaire des statuts d'envoi
  const deliveryData = [
    { name: 'Envoyés', value: campaignDetails?.delivery_info?.delivered || campaignDetails?.statistics?.delivered_count || 0 },
    { name: 'Non livrés', value: (campaignDetails?.delivery_info?.bounced?.total || campaignDetails?.statistics?.bounce_count || 0) },
  ];

  // Données pour le graphique d'engagement
  const engagementData = [
    { name: 'Livrés', value: campaignDetails?.delivery_info?.delivered || campaignDetails?.statistics?.delivered_count || 0 },
    { name: 'Ouverts', value: campaignDetails?.delivery_info?.opened || campaignDetails?.statistics?.open_count || 0 },
    { name: 'Cliqués', value: campaignDetails?.delivery_info?.clicked || campaignDetails?.statistics?.click_count || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div>
        <h2 className="text-xl font-semibold">{campaignDetails?.name}</h2>
        <p className="text-muted-foreground">{campaignDetails?.subject}</p>
        <div className="mt-1 text-xs text-amber-500">Mode démonstration activé : certaines données peuvent être simulées</div>
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
              <p>{campaignDetails?.status === 'sent' ? 'Envoyé' : 
                  campaignDetails?.status === 'sending' ? 'En cours d\'envoi' : 
                  campaignDetails?.status === 'queued' ? 'En attente' : 
                  campaignDetails?.status === 'new' ? 'Nouveau' :
                  campaignDetails?.status === 'paused' ? 'En pause' : 
                  campaignDetails?.status}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Date d'envoi</h3>
              <p>{campaignDetails?.run_at ? new Date(campaignDetails.run_at).toLocaleDateString('fr-FR') : 'Non programmé'}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Date de création</h3>
              <p>{campaignDetails?.created_at ? new Date(campaignDetails.created_at).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Dernière mise à jour</h3>
              <p>{campaignDetails?.updated_at ? new Date(campaignDetails.updated_at).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Résumé des statistiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total envoyé</div>
                  <div className="text-2xl font-bold">
                    {campaignDetails?.statistics?.subscriber_count || 
                     campaignDetails?.delivery_info?.total || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Taux d'ouverture</div>
                  <div className="text-2xl font-bold">
                    {campaignDetails?.statistics?.uniq_open_rate?.toFixed(1) || 
                     campaignDetails?.delivery_info?.unique_open_rate?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Taux de clic</div>
                  <div className="text-2xl font-bold">
                    {campaignDetails?.statistics?.click_rate?.toFixed(1) || 
                     campaignDetails?.delivery_info?.click_rate?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Bounces</div>
                  <div className="text-2xl font-bold">
                    {campaignDetails?.statistics?.bounce_count || 
                     campaignDetails?.delivery_info?.bounced?.total || 0}
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
                    {campaignDetails?.statistics?.subscriber_count || 
                     campaignDetails?.delivery_info?.total || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Livrés</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.delivered_count || 
                     campaignDetails?.delivery_info?.delivered || 0}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({campaignDetails?.statistics?.delivered_rate?.toFixed(1) || 
                       campaignDetails?.delivery_info?.delivery_rate?.toFixed(1) || 0}%)
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Ouverts (unique)</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.open_count || 
                     campaignDetails?.delivery_info?.opened || 0}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({campaignDetails?.statistics?.uniq_open_rate?.toFixed(1) || 
                       campaignDetails?.delivery_info?.unique_open_rate?.toFixed(1) || 0}%)
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Clics</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.click_count || 
                     campaignDetails?.delivery_info?.clicked || 0}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({campaignDetails?.statistics?.click_rate?.toFixed(1) || 
                       campaignDetails?.delivery_info?.click_rate?.toFixed(1) || 0}%)
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Bounces</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.bounce_count || 
                     campaignDetails?.delivery_info?.bounced?.total || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Soft Bounces</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.soft_bounce_count || 
                     campaignDetails?.delivery_info?.bounced?.soft || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Hard Bounces</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.hard_bounce_count || 
                     campaignDetails?.delivery_info?.bounced?.hard || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Désabonnements</div>
                  <div className="text-lg">
                    {campaignDetails?.statistics?.unsubscribe_count || 
                     campaignDetails?.delivery_info?.unsubscribed || 0}
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
                  dangerouslySetInnerHTML={{ __html: (campaignDetails as AcelleCampaignDetail)?.html || '<p>Contenu HTML non disponible</p>' }}
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
                {(campaignDetails as AcelleCampaignDetail)?.plain || 'Contenu texte non disponible'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
