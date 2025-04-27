
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AcelleAccount } from '@/types/acelle.types';
import * as acelleService from '@/services/acelle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/utils/dateUtils';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AcelleCampaignDetailsProps {
  account: AcelleAccount;
  campaignUid: string;
}

const AcelleCampaignDetails: React.FC<AcelleCampaignDetailsProps> = ({ account, campaignUid }) => {
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['acelleCampaignDetails', account.id, campaignUid],
    queryFn: () => acelleService.getAcelleCampaignDetails(account, campaignUid),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Une erreur est survenue lors du chargement des détails de la campagne.
        </AlertDescription>
      </Alert>
    );
  }

  if (!campaign) {
    return (
      <Alert>
        <AlertDescription>
          Aucun détail disponible pour cette campagne.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sujet</p>
              <p>{campaign.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Statut</p>
              <p>{campaign.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Créée le</p>
              <p>{formatDate(campaign.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Envoyée le</p>
              <p>{campaign.run_at ? formatDate(campaign.run_at) : "Non envoyée"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="content">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          {(campaign.html_content || campaign.html) ? (
            <Card>
              <CardHeader>
                <CardTitle>Contenu HTML</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border p-4 rounded-md h-[400px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: campaign.html_content || campaign.html || "" }}
                />
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                Aucun contenu HTML disponible pour cette campagne.
              </AlertDescription>
            </Alert>
          )}

          {(campaign.plain_content || campaign.plain) && (
            <Card>
              <CardHeader>
                <CardTitle>Contenu texte</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="border p-4 rounded-md h-[200px] overflow-y-auto whitespace-pre-wrap">
                  {campaign.plain_content || campaign.plain}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques d'envoi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Envoyés</p>
                  <p className="text-xl font-bold">{campaign.delivery_info?.total || campaign.delivery_info?.total_emails || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Livrés</p>
                  <p className="text-xl font-bold">{campaign.delivery_info?.delivered || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ouverts</p>
                  <p className="text-xl font-bold">{campaign.delivery_info?.opened || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliqués</p>
                  <p className="text-xl font-bold">{campaign.delivery_info?.clicked || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bounces</p>
                  <p className="text-xl font-bold">{campaign.delivery_info?.bounced?.total || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Désabonnements</p>
                  <p className="text-xl font-bold">{campaign.delivery_info?.unsubscribed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informations techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">ID :</span> {campaign.uid}
                </p>
                <p>
                  <span className="font-medium">Dernière mise à jour :</span> {formatDate(campaign.updated_at)}
                </p>
                {campaign.tracking && (
                  <>
                    <p>
                      <span className="font-medium">Suivi d'ouvertures :</span> {campaign.tracking.open_track ? "Activé" : "Désactivé"}
                    </p>
                    <p>
                      <span className="font-medium">Suivi de clics :</span> {campaign.tracking.click_track ? "Activé" : "Désactivé"}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
