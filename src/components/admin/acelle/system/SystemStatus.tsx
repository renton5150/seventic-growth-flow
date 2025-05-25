import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { CheckCircle, XCircle, AlertCircle, Clock, Server, Database } from "lucide-react";
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";

export const SystemStatus = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const {
    isLoading,
    systemStatus,
    refreshStatus,
    acelleApiStatus,
    databaseStatus,
    cachingStatus,
    lastRefresh,
    authStatus,
    performTests
  } = useSystemStatus();

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to render status badges
  const renderStatusBadge = (isActive: boolean, label?: string) => {
    if (isActive) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          {label || "En ligne"}
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {label || "Hors ligne"}
        </Badge>
      );
    }
  };
  
  // Format dates in a human-readable way
  const formatDate = (date: Date | null | string) => {
    if (!date) return "Jamais";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy HH:mm:ss", { locale: fr });
    } catch (e) {
      return "Date invalide";
    }
  };

  // Create cache status data for display
  const cacheData = {
    emailCampaignsCache: {
      count: cachingStatus?.emailCampaignsCache?.totalRows || 0,
      lastUpdate: formatDate(cachingStatus?.emailCampaignsCache?.lastUpdate),
      status: cachingStatus?.emailCampaignsCache?.totalRows > 0 ? "active" : "empty"
    },
    campaignStatsCache: {
      count: cachingStatus?.campaignStatsCache?.totalRows || 0,
      lastUpdate: formatDate(cachingStatus?.campaignStatsCache?.lastUpdate),
      status: cachingStatus?.campaignStatsCache?.totalRows > 0 ? "active" : "empty"
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="mr-2 h-5 w-5" />
          <span>Vérification du statut du système...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">État du système</h2>
          <p className="text-muted-foreground text-sm">
            Dernière vérification: {formatDate(lastRefresh)}
          </p>
        </div>
        <Button onClick={refreshStatus} variant="outline" size="sm">
          Rafraîchir
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard 
              icon={<Server className="h-5 w-5 text-blue-500" />}
              title="API Acelle"
              status={acelleApiStatus?.isAvailable ? "online" : "offline"}
              details={`${acelleApiStatus?.activeAccountsCount || 0} comptes actifs`}
            />
            
            <StatusCard 
              icon={<Database className="h-5 w-5 text-green-500" />}
              title="Base de données"
              status={databaseStatus?.isConnected ? "online" : "offline"}
              details={`${databaseStatus?.count || 0} comptes trouvés`}
            />
            
            <StatusCard 
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              title="Cache"
              status={cachingStatus?.emailCampaignsCache?.totalRows > 0 ? "online" : "warning"}
              details={`${cachingStatus?.emailCampaignsCache?.totalRows || 0} campagnes en cache`}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Détails du système</TabsTrigger>
          <TabsTrigger value="cache">État du cache</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>État des services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <StatusRow 
                  label="Authentification" 
                  value={authStatus?.isLoggedIn ? "Connecté" : "Non connecté"}
                  status={authStatus?.isLoggedIn ? "online" : "offline"}
                />
                
                <StatusRow 
                  label="API Acelle (connexion directe)" 
                  value={acelleApiStatus?.isAvailable ? "En ligne" : "Hors ligne"} 
                  status={acelleApiStatus?.isAvailable ? "online" : "offline"}
                  details={`${acelleApiStatus?.activeAccountsCount || 0} comptes actifs sur ${acelleApiStatus?.accountsCount || 0}`}
                />
                
                <StatusRow 
                  label="Base de données" 
                  value={databaseStatus?.isConnected ? "Connectée" : "Déconnectée"}
                  status={databaseStatus?.isConnected ? "online" : "offline"}
                  details={`${databaseStatus?.count || 0} comptes Acelle enregistrés`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>État des caches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <StatusRow 
                  label="Cache des campagnes" 
                  value={`${cacheData.emailCampaignsCache.count} entrées`}
                  status={cacheData.emailCampaignsCache.status === "active" ? "online" : "warning"}
                  details={`Dernière mise à jour: ${cacheData.emailCampaignsCache.lastUpdate}`}
                />
                
                <StatusRow 
                  label="Cache des statistiques" 
                  value={`${cacheData.campaignStatsCache.count} entrées`}
                  status={cacheData.campaignStatsCache.status === "active" ? "online" : "warning"}
                  details={`Dernière mise à jour: ${cacheData.campaignStatsCache.lastUpdate}`}
                />
                
                <StatusRow 
                  label="Comptes avec cache" 
                  value={`${cachingStatus?.emailCampaignsCache?.accountsWithCache || 0} comptes`}
                  status={cachingStatus?.emailCampaignsCache?.accountsWithCache > 0 ? "online" : "warning"}
                />
                
                <StatusRow 
                  label="Taille estimée du cache" 
                  value={cachingStatus?.emailCampaignsCache?.estimatedSize || "Inconnue"}
                  status="info"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostic">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Tests de diagnostic</span>
                <Button onClick={performTests} variant="outline" size="sm">
                  Lancer les tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <StatusRow 
                  label="Connexion API Edge Function" 
                  value="Cliquez sur 'Lancer les tests'"
                  status="info"
                />
                
                <StatusRow 
                  label="Test d'authentification" 
                  value="Cliquez sur 'Lancer les tests'"
                  status="info"
                />
                
                <StatusRow 
                  label="Synchronisation du cache" 
                  value="Cliquez sur 'Lancer les tests'"
                  status="info"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  status: "online" | "offline" | "warning";
  details?: string;
}

const StatusCard = ({ icon, title, status, details }: StatusCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "online": return "text-green-500";
      case "offline": return "text-red-500";
      case "warning": return "text-amber-500";
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case "online": return <CheckCircle className={`h-5 w-5 ${getStatusColor()}`} />;
      case "offline": return <XCircle className={`h-5 w-5 ${getStatusColor()}`} />;
      case "warning": return <AlertCircle className={`h-5 w-5 ${getStatusColor()}`} />;
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          {icon}
          <h3 className="font-medium ml-2">{title}</h3>
        </div>
        {getStatusIcon()}
      </div>
      {details && <p className="text-sm text-muted-foreground">{details}</p>}
    </div>
  );
};

interface StatusRowProps {
  label: string;
  value: string;
  status: "online" | "offline" | "warning" | "info";
  details?: string;
}

const StatusRow = ({ label, value, status, details }: StatusRowProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500 hover:bg-green-600">En ligne</Badge>;
      case "offline":
        return <Badge variant="destructive">Hors ligne</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Attention</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b last:border-0">
      <div className="font-medium w-full sm:w-1/3">{label}</div>
      <div className="flex items-center justify-between w-full sm:w-2/3">
        <div>
          <div>{value}</div>
          {details && <div className="text-sm text-muted-foreground">{details}</div>}
        </div>
        {getStatusBadge()}
      </div>
    </div>
  );
};
