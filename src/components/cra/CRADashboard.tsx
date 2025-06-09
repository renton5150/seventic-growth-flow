
import React, { useState } from "react";
import { CRACalendar } from "./CRACalendar";
import { CRAForm } from "./CRAForm";
import { CRAStatistics } from "./CRAStatistics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";

// Fonction pour obtenir le prochain jour ouvré
const getNextWorkingDay = () => {
  const today = new Date();
  
  // Si c'est un jour ouvré (lundi à vendredi), retourner aujourd'hui
  if (!isWeekend(today)) {
    return today;
  }
  
  // Sinon, trouver le prochain lundi
  const nextMonday = new Date(today);
  const daysUntilMonday = (8 - today.getDay()) % 7;
  nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  
  return nextMonday;
};

export const CRADashboard = () => {
  // Utiliser un jour ouvré par défaut
  const [selectedDate, setSelectedDate] = useState(getNextWorkingDay());
  const [activeTab, setActiveTab] = useState("form");

  const handleDateSelect = (dateString: string) => {
    console.log("handleDateSelect appelé avec:", dateString);
    const date = new Date(dateString + 'T12:00:00'); // Ajouter l'heure pour éviter les problèmes de timezone
    
    // Vérifier si c'est un weekend
    if (isWeekend(date)) {
      console.log("Date weekend ignorée:", dateString);
      return; // Ne pas permettre la sélection des weekends
    }
    
    console.log("Changement de date vers:", date);
    setSelectedDate(date);
    setActiveTab("form");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRA - Compte Rendu d'Activité</h1>
        <div className="text-sm text-gray-600">
          Date sélectionnée : {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
          {isWeekend(selectedDate) && (
            <span className="text-red-600 ml-2">(Weekend - CRA non disponible)</span>
          )}
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
          <Card>
            <CardHeader>
              <CardTitle>Statistiques CRA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>Comment lire ces statistiques :</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Taux de complétion :</strong> Pourcentage de CRA complétés sur la période</li>
                    <li><strong>Répartition des missions :</strong> Temps passé sur chaque mission en pourcentage</li>
                    <li><strong>Évolution :</strong> Progression du nombre de CRA remplis par semaine</li>
                    <li><strong>Projets par catégorie :</strong> Nombre de projets dans chaque catégorie (5%, 10%, 20%)</li>
                  </ul>
                </div>
                <CRAStatistics />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
