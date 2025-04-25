import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Info, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AcelleCampaignDetail, AcelleAccount } from '@/types/acelle.types';
import { DataUnavailableAlert } from './errors/DataUnavailableAlert';
import { acelleService } from '@/services/acelle/acelle-service';

// Add a props interface to properly type the component
interface AcelleCampaignDetailsProps {
  account: AcelleAccount;
  campaignUid: string;
}

export default function AcelleCampaignDetails({ account, campaignUid }: AcelleCampaignDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { data: campaign, isLoading, error, refetch } = useQuery({
    queryKey: ['acelleEmailCampaign', account.id, campaignUid],
    queryFn: async () => {
      if (!account || !campaignUid) return null;
      
      try {
        // Use getAcelleCampaigns instead of getAcelleCampaignDetails since the latter doesn't exist
        const campaigns = await acelleService.getAcelleCampaigns(account);
        const campaign = campaigns.find(c => c.uid === campaignUid);
        
        if (!campaign) throw new Error('Campaign not found');
        return campaign as AcelleCampaignDetail;
      } catch (error) {
        console.error("Error fetching campaign:", error);
        throw error;
      }
    }
  });

  function CampaignLoading() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild disabled>
              <Link to={`/admin/email-campaigns`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Link>
            </Button>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
  
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(null).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
  
        <div className="border rounded-md">
          <Skeleton className="h-10 w-full" />
          <div className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <CampaignLoading />;
  }

  if (error || !campaign) {
    return <DataUnavailableAlert message="Les détails de la campagne sont indisponibles" />;
  }

  // Format the campaign data for display
  const statusColors = {
    ready: 'bg-blue-100 text-blue-800',
    sending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    paused: 'bg-gray-100 text-gray-800',
    queuing: 'bg-purple-100 text-purple-800',
    queued: 'bg-indigo-100 text-indigo-800',
    scheduled: 'bg-cyan-100 text-cyan-800',
    processing: 'bg-amber-100 text-amber-800',
    done: 'bg-emerald-100 text-emerald-800',
  };

  const statusLabels = {
    ready: 'Prêt',
    sending: 'En cours d\'envoi',
    sent: 'Envoyé',
    failed: 'Échoué',
    paused: 'En pause',
    queuing: 'En file d\'attente',
    queued: 'En attente',
    scheduled: 'Programmé',
    processing: 'En cours',
    done: 'Terminé',
  };

  const statusColor = statusColors[campaign.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  const statusLabel = statusLabels[campaign.status as keyof typeof statusLabels] || campaign.status;

  // Pie chart data
  const chartData = [
    { name: 'Ouverts', value: campaign.statistics?.open_count || 0 },
    { name: 'Clics', value: campaign.statistics?.click_count || 0 },
    { name: 'Rebonds', value: campaign.statistics?.bounce_count || 0 },
    { name: 'Désabonnés', value: campaign.statistics?.unsubscribe_count || 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const refreshCampaign = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success('Données de la campagne mises à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des données');
      console.error('Error refreshing campaign:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/email-campaigns`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshCampaign}
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Rafraîchir
        </Button>
      </div>

      {/* Campaign statistics summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.statistics?.uniq_open_rate ? 
                `${(campaign.statistics.uniq_open_rate * 100).toFixed(1)}%` : 
                '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.statistics?.open_count || 0} ouvertures
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de clic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.statistics?.click_rate ? 
                `${(campaign.statistics.click_rate * 100).toFixed(1)}%` : 
                '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.statistics?.click_count || 0} clics
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de rebond</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.delivery_info?.bounce_rate ? 
                `${(campaign.delivery_info.bounce_rate * 100).toFixed(1)}%` : 
                '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.statistics?.bounce_count || 0} rebonds
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de désabonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.delivery_info?.unsubscribe_rate ? 
                `${(campaign.delivery_info.unsubscribe_rate * 100).toFixed(1)}%` : 
                '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.statistics?.unsubscribe_count || 0} désabonnements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Sujet</dt>
                    <dd>{campaign.subject}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Date d'envoi</dt>
                    <dd>{campaign.delivery_date ? format(new Date(campaign.delivery_date), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Non définie'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Statut</dt>
                    <dd><Badge className={statusColor}>{statusLabel}</Badge></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Date de création</dt>
                    <dd>{format(new Date(campaign.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Dernière modification</dt>
                    <dd>{format(new Date(campaign.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques d'envoi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détails de livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Métrique</TableHead>
                      <TableHead className="text-right">Valeur</TableHead>
                      <TableHead className="text-right">Pourcentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Destinataires</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.total || 0}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Livrés</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.delivered || 0}</TableCell>
                      <TableCell className="text-right">
                        {campaign.delivery_info?.delivery_rate ? 
                          `${(campaign.delivery_info.delivery_rate * 100).toFixed(1)}%` : 
                          '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ouvertures uniques</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.opened || 0}</TableCell>
                      <TableCell className="text-right">
                        {campaign.delivery_info?.unique_open_rate ? 
                          `${(campaign.delivery_info.unique_open_rate * 100).toFixed(1)}%` : 
                          '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Clics</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.clicked || 0}</TableCell>
                      <TableCell className="text-right">
                        {campaign.delivery_info?.click_rate ? 
                          `${(campaign.delivery_info.click_rate * 100).toFixed(1)}%` : 
                          '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Rebonds</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.bounced?.total || 0}</TableCell>
                      <TableCell className="text-right">
                        {campaign.delivery_info?.bounce_rate ? 
                          `${(campaign.delivery_info.bounce_rate * 100).toFixed(1)}%` : 
                          '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Désabonnements</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.unsubscribed || 0}</TableCell>
                      <TableCell className="text-right">
                        {campaign.delivery_info?.unsubscribe_rate ? 
                          `${(campaign.delivery_info.unsubscribe_rate * 100).toFixed(1)}%` : 
                          '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Plaintes</TableCell>
                      <TableCell className="text-right">{campaign.delivery_info?.complained || 0}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de la campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <Info className="h-10 w-10 mx-auto mb-4" />
                <p>Les graphiques détaillés de performance seront disponibles prochainement.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contenu de l'email</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.html ? (
                <div 
                  className="border rounded-md p-4 bg-white max-h-[800px] overflow-auto"
                  dangerouslySetInnerHTML={{ __html: campaign.html }}
                />
              ) : campaign.plain ? (
                <pre className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap max-h-[800px] overflow-auto">
                  {campaign.plain}
                </pre>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Info className="h-10 w-10 mx-auto mb-4" />
                  <p>Le contenu de l'email n'est pas disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de la campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Suivi des ouvertures</dt>
                  <dd>{campaign.tracking?.open_tracking === true ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" /> Activé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-4 w-4 mr-1" /> Désactivé
                    </Badge>
                  )}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Suivi des clics</dt>
                  <dd>{campaign.tracking?.click_tracking === true ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" /> Activé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-4 w-4 mr-1" /> Désactivé
                    </Badge>
                  )}</dd>
                </div>
              </dl>
              
              {campaign.status === 'failed' && campaign.last_error && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Erreur détectée</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {campaign.last_error}
                  </AlertDescription>
                </Alert>
              )}
              
              {campaign.run_at && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Planification</h4>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Exécution prévue: {format(new Date(campaign.run_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
