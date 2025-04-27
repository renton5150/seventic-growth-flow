
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequestResultsProps {
  request: Request;
}

export const RequestResults: React.FC<RequestResultsProps> = ({ request }) => {
  const results = request.details?.results || {};
  
  if (request.status !== "completed" || !results || Object.keys(results).length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            Les résultats seront disponibles une fois la demande traitée.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const handleDownload = (fileUrl: string, filename: string) => {
    // Open the file URL in a new tab or download it
    window.open(fileUrl, '_blank');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {request.type === "database" && (
          <>
            {results.contactsCount !== undefined && (
              <div>
                <h3 className="text-sm font-medium mb-2">Nombre de contacts</h3>
                <p className="text-2xl font-bold">{results.contactsCount}</p>
              </div>
            )}
            
            {results.companiesCount !== undefined && (
              <div>
                <h3 className="text-sm font-medium mb-2">Nombre d'entreprises</h3>
                <p className="text-2xl font-bold">{results.companiesCount}</p>
              </div>
            )}
          </>
        )}
        
        {request.type === "email" && (
          <>
            {results.emailsSent !== undefined && (
              <div>
                <h3 className="text-sm font-medium mb-2">Emails envoyés</h3>
                <p className="text-2xl font-bold">{results.emailsSent}</p>
              </div>
            )}
            
            {results.openRate !== undefined && (
              <div>
                <h3 className="text-sm font-medium mb-2">Taux d'ouverture</h3>
                <p className="text-2xl font-bold">{results.openRate}%</p>
              </div>
            )}
            
            {results.clickRate !== undefined && (
              <div>
                <h3 className="text-sm font-medium mb-2">Taux de clics</h3>
                <p className="text-2xl font-bold">{results.clickRate}%</p>
              </div>
            )}
            
            {results.conversions !== undefined && (
              <div>
                <h3 className="text-sm font-medium mb-2">Conversions</h3>
                <p className="text-2xl font-bold">{results.conversions}</p>
              </div>
            )}
          </>
        )}
        
        {request.type === "linkedin" && results.profilesFound !== undefined && (
          <div>
            <h3 className="text-sm font-medium mb-2">Profils trouvés</h3>
            <p className="text-2xl font-bold">{results.profilesFound}</p>
          </div>
        )}
        
        {(results.fileUrl || request.details?.resultFileUrl) && (
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-2">Fichier de résultats</h3>
            <Button 
              variant="outline"
              onClick={() => handleDownload(results.fileUrl || request.details?.resultFileUrl, "resultats.xlsx")}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger les résultats
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
