
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiStatusMonitor } from './ApiStatusMonitor';

export function SystemStatus() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="status" className="w-full">
        <TabsList>
          <TabsTrigger value="status">État du système</TabsTrigger>
          <TabsTrigger value="logs">Journaux</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4">
          <ApiStatusMonitor />
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Information système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Version</h3>
                    <p className="text-sm text-muted-foreground">2.0.0</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Environnement</h3>
                    <p className="text-sm text-muted-foreground">Production</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h3 className="font-medium text-sm">Services actifs</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    <li>Proxy CORS</li>
                    <li>Proxy Acelle</li>
                    <li>Service de synchronisation</li>
                    <li>Service de cache</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Journaux d'activité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cette fonctionnalité sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>Outils de diagnostic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cette fonctionnalité sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
