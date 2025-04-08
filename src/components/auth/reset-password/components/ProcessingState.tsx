
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const ProcessingState: React.FC = () => {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Traitement en cours...
        </CardTitle>
        <CardDescription className="text-center">
          Nous vérifions votre lien d'authentification
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seventic-500 mb-4"></div>
        <p className="text-center text-gray-600">
          Authentification en cours, veuillez patienter...
        </p>
      </CardContent>
    </Card>
  );
};
