
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";

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
        
        <AcelleAdminPanel />
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
