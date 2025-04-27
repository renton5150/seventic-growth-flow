
import React from 'react';
import { Request, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface RequestResultsProps {
  request: Request;
}

export const RequestResults: React.FC<RequestResultsProps> = ({ request }) => {
  const getResultsData = () => {
    if (request.type === 'email') {
      const emailRequest = request as EmailCampaignRequest;
      return {
        metrics: [
          { label: 'Emails envoyés', value: emailRequest.details?.results?.emailsSent || 0 },
          { label: 'Taux d\'ouverture', value: formatPercentage(emailRequest.details?.results?.openRate) },
          { label: 'Taux de clic', value: formatPercentage(emailRequest.details?.results?.clickRate) },
          { label: 'Conversions', value: emailRequest.details?.results?.conversions || 0 },
        ],
        fileUrl: emailRequest.details?.results?.fileUrl
      };
    } else if (request.type === 'database') {
      const dbRequest = request as DatabaseRequest;
      return {
        metrics: [
          { label: 'Contacts créés', value: dbRequest.contactsCreated || dbRequest.details?.results?.contactsCount || 0 },
          { label: 'Entreprises', value: dbRequest.details?.results?.companiesCount || 0 },
        ],
        fileUrl: dbRequest.resultFileUrl || dbRequest.details?.results?.fileUrl
      };
    } else if (request.type === 'linkedin') {
      const liRequest = request as LinkedInScrapingRequest;
      return {
        metrics: [
          { label: 'Profils récupérés', value: liRequest.profilesScraped || liRequest.details?.results?.profilesFound || 0 },
        ],
        fileUrl: liRequest.resultFileUrl || liRequest.details?.results?.fileUrl
      };
    }
    return { metrics: [], fileUrl: undefined };
  };

  const { metrics, fileUrl } = getResultsData();

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return '0%';
    const percent = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(percent) ? '0%' : `${percent.toFixed(1)}%`;
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      window.open(fileUrl, '_blank');
    } else {
      // Simulate download for development
      console.log('Downloading file:', fileUrl);
      alert('Téléchargement simulé: ' + fileUrl);
    }
  };

  if (!metrics.length && !fileUrl) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium mb-2">Aucun résultat disponible</h3>
        <p className="text-muted-foreground">Les résultats seront disponibles une fois la demande traitée.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {fileUrl && (
        <div className="flex justify-center">
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Télécharger le fichier résultat
          </Button>
        </div>
      )}
    </div>
  );
};
