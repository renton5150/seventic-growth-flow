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
import { toast } from "sonner";

export const CRADashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSDR, setSelectedSDR] = useState<string>(isAdmin ? "" : user?.id || "");
  const [sdrList, setSdrList] = useState<any[]>([]);
  const [missingCRAs, setMissingCRAs] = useState<any[]>([]);
  const [isLoadingMissingCRAs, setIsLoadingMissingCRAs] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadSDRList();
      loadMissingCRAs();
    }
  }, [isAdmin]);

  // Initialiser selectedSDR quand les données sont chargées
  useEffect(() => {
    if (isAdmin && sdrList.length > 0 && !selectedSDR) {
      setSelectedSDR(sdrList[0]?.id || "");
    } else if (!isAdmin && user?.id && !selectedSDR) {
      setSelectedSDR(user.id);
    }
  }, [isAdmin, sdrList, user?.id, selectedSDR]);

  const loadSDRList = async () => {
    try {
      const users = await getAllUsers();
      const sdrs = users.filter(u => u.role === 'sdr');
      setSdrList(sdrs);
      console.log("SDRs chargés:", sdrs);
    } catch (error) {
      console.error("Erreur lors du chargement des SDR:", error);
    }
  };

  const loadMissingCRAs = async () => {
    setIsLoadingMissingCRAs(true);
    try {
      console.log("🚀 Début du chargement des CRA manquants...");
      const missing = await craService.getMissingCRAReports();
      console.log("📋 CRA manquants récupérés:", missing);
      console.log("🔢 Nombre:", missing.length);
      
      setMissingCRAs(missing);
      
      if (missing.length === 0) {
        toast.success("✅ Aucun CRA manquant pour les jours ouvrables !");
        console.log("✅ Aucun CRA manquant trouvé");
      } else {
        toast.info(`⚠️ ${missing.length} CRA manquant(s) pour les jours ouvrables`);
        console.log(`⚠️ ${missing.length} CRA manquants trouvés:`, missing);
      }
    } catch (error) {
      console.error("💥 Erreur lors du chargement des CRA manquants:", error);
      toast.error("❌ Erreur lors du chargement des CRA manquants: " + (error as Error).message);
    } finally {
      setIsLoadingMissingCRAs(false);
      console.log("🏁 Fin du chargement des CRA manquants");
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
                <SelectValue placeholder="Sélectionner un SDR" />
              </SelectTrigger>
              <SelectContent>
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

          {selectedSDR ? (
            <CRATableForm 
              selectedDate={selectedDate} 
              onSave={handleCRASaved}
              sdrId={isAdmin ? selectedSDR : undefined}
            />
          ) : isAdmin ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Sélectionnez un SDR pour voir ou éditer son CRA
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Chargement...
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
                      <Button 
                        onClick={loadMissingCRAs} 
                        variant="outline"
                        disabled={isLoadingMissingCRAs}
                      >
                        {isLoadingMissingCRAs ? "Rafraîchissement..." : "Rafraîchir les CRA manquants"}
                      </Button>
                      <Button variant="outline" disabled>
                        Envoyer rappels email (à venir)
                      </Button>
                    </div>
                  </div>
                  
                  {/* Informations sur les SDR */}
                  <div>
                    <h3 className="font-semibold mb-2">SDR actifs ({sdrList.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {sdrList.map(sdr => (
                        <div key={sdr.id} className="text-sm p-2 bg-gray-50 rounded">
                          {sdr.name} ({sdr.email})
                        </div>
                      ))}
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
