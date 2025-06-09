
import React, { useState } from "react";
import { CRACalendar } from "./CRACalendar";
import { CRAForm } from "./CRAForm";
import { CRAStatistics } from "./CRAStatistics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const CRADashboard = () => {
  // Utiliser la date d'aujourd'hui par défaut
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("form");

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab("form");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRA - Compte Rendu d'Activité</h1>
        <div className="text-sm text-gray-600">
          Date sélectionnée : {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="form">Saisie CRA</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des CRA</CardTitle>
            </CardHeader>
            <CardContent>
              <CRACalendar 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                CRA du {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CRAForm 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <CRAStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
