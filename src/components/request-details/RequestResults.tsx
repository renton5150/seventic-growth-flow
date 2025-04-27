
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RequestResultsProps {
  request: Request;
}

export const RequestResults: React.FC<RequestResultsProps> = ({ request }) => {
  if (request.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Résultats</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les résultats seront disponibles une fois la demande terminée.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const renderResults = () => {
    if (!request.details?.results) {
      return (
        <p>Aucun résultat disponible pour cette demande.</p>
      );
    }

    const { results } = request.details;
    
    if (request.type === "database") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Nombre total de contacts</h4>
            <p className="text-2xl font-semibold">{results.contactsCount || 0}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Entreprises touchées</h4>
            <p className="text-2xl font-semibold">{results.companiesCount || 0}</p>
          </div>
          
          {results.fileUrl && (
            <div>
              <h4 className="text-sm font-medium">Fichier de résultats</h4>
              <a 
                href={results.fileUrl} 
                className="text-blue-600 hover:underline flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <p>Résultats non disponibles pour ce type de demande.</p>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Résultats</CardTitle>
      </CardHeader>
      <CardContent>
        {renderResults()}
      </CardContent>
    </Card>
  );
};
