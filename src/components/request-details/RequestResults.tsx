
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";
import { DatabaseRequest, EmailCampaignRequest } from "@/types/types";
import { FileText, FileSpreadsheet } from "lucide-react";

interface RequestResultsProps {
  request: Request;
}

export const RequestResults: React.FC<RequestResultsProps> = ({ request }) => {
  const renderDatabaseResults = () => {
    const dbRequest = request as DatabaseRequest;
    const results = dbRequest.details?.results;

    if (!results) {
      return (
        <p className="text-muted-foreground text-center py-4">
          Aucun résultat disponible pour le moment
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/20 p-4 rounded-md">
            <p className="text-sm font-medium">Contacts</p>
            <p className="text-2xl font-bold">{results.contactsCount || 0}</p>
          </div>
          <div className="bg-secondary/20 p-4 rounded-md">
            <p className="text-sm font-medium">Entreprises</p>
            <p className="text-2xl font-bold">{results.companiesCount || 0}</p>
          </div>
        </div>

        {results.fileUrl && (
          <div className="border rounded-md p-4 flex items-center space-x-3">
            <FileSpreadsheet className="h-10 w-10 text-green-600" />
            <div>
              <p className="font-medium">Fichier de résultats</p>
              <a 
                href={results.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-500 hover:underline"
              >
                Télécharger le fichier
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEmailResults = () => {
    const emailRequest = request as EmailCampaignRequest;
    const results = emailRequest.details?.results;

    if (!results) {
      return (
        <p className="text-muted-foreground text-center py-4">
          Aucun résultat disponible pour le moment
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/20 p-4 rounded-md">
            <p className="text-sm font-medium">Emails envoyés</p>
            <p className="text-2xl font-bold">{results.emailsSent || 0}</p>
          </div>
          <div className="bg-secondary/20 p-4 rounded-md">
            <p className="text-sm font-medium">Taux d'ouverture</p>
            <p className="text-2xl font-bold">{results.openRate ? `${(results.openRate * 100).toFixed(1)}%` : '0%'}</p>
          </div>
          <div className="bg-secondary/20 p-4 rounded-md">
            <p className="text-sm font-medium">Taux de clic</p>
            <p className="text-2xl font-bold">{results.clickRate ? `${(results.clickRate * 100).toFixed(1)}%` : '0%'}</p>
          </div>
          <div className="bg-secondary/20 p-4 rounded-md">
            <p className="text-sm font-medium">Conversions</p>
            <p className="text-2xl font-bold">{results.conversions || 0}</p>
          </div>
        </div>

        {results.fileUrl && (
          <div className="border rounded-md p-4 flex items-center space-x-3">
            <FileText className="h-10 w-10 text-blue-600" />
            <div>
              <p className="font-medium">Rapport détaillé</p>
              <a 
                href={results.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-500 hover:underline"
              >
                Télécharger le rapport
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    switch (request.type) {
      case 'database':
        return renderDatabaseResults();
      case 'email':
        return renderEmailResults();
      default:
        return <p className="text-muted-foreground text-center py-4">Aucun résultat disponible</p>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats</CardTitle>
      </CardHeader>
      <CardContent>
        {renderResults()}
      </CardContent>
    </Card>
  );
};
