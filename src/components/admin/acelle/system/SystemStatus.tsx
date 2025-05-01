
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { SystemHeader } from "./SystemHeader";
import { StatusTab } from "./tabs/StatusTab";
import { CacheTab } from "./tabs/CacheTab";
import { DebugTab } from "./tabs/DebugTab";
import { useSystemStatus } from "./hooks/useSystemStatus";

export const SystemStatus = () => {
  const { isAdmin } = useAuth();
  const {
    isTesting,
    endpointStatus,
    lastTestTime,
    debugInfo,
    authStatus,
    activeTab,
    setActiveTab,
    cacheInfo,
    wakeUpEdgeFunctions,
    refreshCacheInfo,
    runDiagnostics
  } = useSystemStatus();

  if (!isAdmin) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <SystemHeader 
          authStatus={authStatus} 
          isTesting={isTesting} 
          wakeUpEdgeFunctions={wakeUpEdgeFunctions} 
          runDiagnostics={runDiagnostics} 
        />
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="status">État des services</TabsTrigger>
            <TabsTrigger value="cache">Cache de campagnes</TabsTrigger>
            <TabsTrigger value="debug">Diagnostic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <StatusTab 
              authStatus={authStatus}
              endpointStatus={endpointStatus}
              cacheInfo={cacheInfo}
              lastTestTime={lastTestTime}
            />
          </TabsContent>
          
          <TabsContent value="cache">
            <CacheTab 
              cacheInfo={cacheInfo}
              refreshCacheInfo={refreshCacheInfo}
            />
          </TabsContent>
          
          <TabsContent value="debug">
            <DebugTab debugInfo={debugInfo} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
