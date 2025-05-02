
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { Alert, AlertDescription } from "@/components/ui/alert"; 
import { InfoIcon } from "lucide-react"; 

const AcelleEmailCampaigns = () => {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
        </div>
        
        <Alert variant="info" className="bg-blue-50 text-blue-700 border-blue-200">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            Mode démonstration activé : les données affichées sont temporaires en raison des problèmes actuels de connexion à l'API.
          </AlertDescription>
        </Alert>
        
        <AcelleAdminPanel />
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
