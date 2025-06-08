
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BarChart3, Users, AlertTriangle } from "lucide-react";
import { CRATableForm } from "./CRATableForm";
import { CRAStatistics } from "./CRAStatistics";
import { CRACalendar } from "./CRACalendar";
import { useAuth } from "@/contexts/AuthContext";
import { craService } from "@/services/cra/craService";
import { getAllUsers } from "@/services/user/userQueries";

export const CRADashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSDR, setSelectedSDR] = useState<string>("");
  const [sdrList, setSdrList] = useState<any[]>([]);
  const [missingCRAs, setMissingCRAs] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadSDRList();
      loadMissingCRAs();
    }
  }, [isAdmin]);

  const loadSDRList = async () => {
    try {
      const users = await getAllUsers();
      const sdrs = users.filter(u => u.role === 'sdr');
      setSdrList(sdrs);
    } catch (error) {
      console.error("Erreur lors du chargement des SDR:", error);
    }
  };

  const loadMissingCRAs = async () => {
    try {
      const missing = await craService.getMissingCRAReports();
      setMissingCRAs(missing);
    } catch (error) {
      console.error("Erreur lors du chargement des CRA manquants:", error);
    }
  };

  const handleCRASaved = () => {
    // Rafraîchir les données si nécessaire
    if (isAdmin) {
      loadMissingCRAs();
    }
  };

  const targetSDR = selectedSDR || user?.id;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Compte Rendu d'Activité (CRA)</h1>
          <p className="text-muted-foreground">
            Gérez vos rapports quotidiens d'activité et consultez les statistiques
          </p>
        </div>

        {/* Sélecteur de SDR pour les admins */}
        {isAdmin && (
          <div className="flex items-center gap-4">
            <Select value={selectedSDR} onValueChange={setSelectedSDR}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les SDR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les SDR</SelectItem>
                {sdrList.map(sdr => (
                  <SelectItem key={sdr.id} value={sdr.id}>
                    {sdr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Alertes CRA manquants pour les admins */}
      {isAdmin && missingCRAs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              CRA manquants ({missingCRAs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {missingCRAs.map((missing, index) => (
                <div key={index} className="text-sm text-orange-700">
                  {missing.sdr_name} - {new Date(missing.missing_date).toLocaleDateString('fr-FR')}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Saisie CRA
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Administration
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une date</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-fit"
              />
            </CardContent>
          </Card>

          {!isAdmin || selectedSDR ? (
            <CRATableForm 
              selectedDate={selectedDate} 
              onSave={handleCRASaved}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Sélectionnez un SDR pour voir ou éditer son CRA
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <CRACalendar 
            sdrId={targetSDR}
            onDateSelect={setSelectedDate}
          />
        </TabsContent>

        <TabsContent value="statistics">
          <CRAStatistics sdrId={targetSDR} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Administration des CRA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Actions administratives</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button onClick={loadMissingCRAs} variant="outline">
                        Rafraîchir les CRA manquants
                      </Button>
                      <Button variant="outline" disabled>
                        Envoyer rappels email (à venir)
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
