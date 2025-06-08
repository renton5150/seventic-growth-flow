
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { craService } from "@/services/cra/craService";
import { getActiveMissions } from "@/services/cra/missionService";
import { CreateCRARequest } from "@/types/cra.types";

interface Mission {
  id: string;
  name: string;
  client: string;
}

interface MissionEntry {
  mission_id: string;
  time_percentage: number;
  mission_comment: string;
  opportunities: OpportunityEntry[];
}

interface OpportunityEntry {
  opportunity_name: string;
  opportunity_value: 5 | 10 | 20;
}

interface CRAFormProps {
  selectedDate: string;
  onSave: () => void;
}

export const CRAForm = ({ selectedDate, onSave }: CRAFormProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionEntries, setMissionEntries] = useState<MissionEntry[]>([]);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPercentage, setTotalPercentage] = useState(0);

  useEffect(() => {
    loadMissions();
    loadExistingCRA();
  }, [selectedDate]);

  useEffect(() => {
    const total = missionEntries.reduce((sum, entry) => sum + (entry.time_percentage || 0), 0);
    setTotalPercentage(total);
  }, [missionEntries]);

  const loadMissions = async () => {
    try {
      const missionsData = await getActiveMissions();
      setMissions(missionsData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des missions:", error);
      toast.error("Erreur lors du chargement des missions");
    }
  };

  const loadExistingCRA = async () => {
    try {
      const { report, missionTimes, opportunities } = 
        await craService.getCRAByDate(selectedDate);
      
      if (report) {
        // Créer un map des opportunités par mission
        const opportunitiesByMission: { [key: string]: OpportunityEntry[] } = {};
        opportunities.forEach(opp => {
          if (!opportunitiesByMission[opp.mission_id]) {
            opportunitiesByMission[opp.mission_id] = [];
          }
          opportunitiesByMission[opp.mission_id].push({
            opportunity_name: opp.opportunity_name,
            opportunity_value: opp.opportunity_value
          });
        });

        // Créer les entrées de mission avec leurs opportunités
        const entries: MissionEntry[] = missionTimes.map(mt => ({
          mission_id: mt.mission_id,
          time_percentage: mt.time_percentage,
          mission_comment: mt.mission_comment || "",
          opportunities: opportunitiesByMission[mt.mission_id] || []
        }));

        setMissionEntries(entries);
        setComments(report.comments || "");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du CRA:", error);
    }
  };

  const addMissionEntry = () => {
    setMissionEntries([...missionEntries, { 
      mission_id: "", 
      time_percentage: 0, 
      mission_comment: "",
      opportunities: []
    }]);
  };

  const updateMissionEntry = (index: number, field: keyof Omit<MissionEntry, 'opportunities'>, value: any) => {
    const updated = [...missionEntries];
    updated[index] = { ...updated[index], [field]: value };
    setMissionEntries(updated);
  };

  const removeMissionEntry = (index: number) => {
    setMissionEntries(missionEntries.filter((_, i) => i !== index));
  };

  const addOpportunity = (missionIndex: number) => {
    const updated = [...missionEntries];
    updated[missionIndex].opportunities.push({
      opportunity_name: "",
      opportunity_value: 5
    });
    setMissionEntries(updated);
  };

  const updateOpportunity = (missionIndex: number, oppIndex: number, field: keyof OpportunityEntry, value: any) => {
    const updated = [...missionEntries];
    if (field === 'opportunity_value') {
      updated[missionIndex].opportunities[oppIndex] = {
        ...updated[missionIndex].opportunities[oppIndex],
        [field]: parseInt(value) as 5 | 10 | 20
      };
    } else {
      updated[missionIndex].opportunities[oppIndex] = {
        ...updated[missionIndex].opportunities[oppIndex],
        [field]: value
      };
    }
    setMissionEntries(updated);
  };

  const removeOpportunity = (missionIndex: number, oppIndex: number) => {
    const updated = [...missionEntries];
    updated[missionIndex].opportunities = updated[missionIndex].opportunities.filter((_, i) => i !== oppIndex);
    setMissionEntries(updated);
  };

  const handleSave = async () => {
    if (totalPercentage > 100) {
      toast.error("Le total des pourcentages ne peut pas dépasser 100%");
      return;
    }

    if (missionEntries.length === 0) {
      toast.error("Veuillez ajouter au moins une mission");
      return;
    }

    setIsLoading(true);
    try {
      const data: CreateCRARequest = {
        report_date: selectedDate,
        mission_times: missionEntries
          .filter(entry => entry.mission_id && entry.time_percentage > 0)
          .map(entry => ({
            mission_id: entry.mission_id,
            time_percentage: entry.time_percentage,
            mission_comment: entry.mission_comment
          })),
        opportunities: missionEntries.flatMap(entry => 
          entry.opportunities
            .filter(opp => opp.opportunity_name.trim())
            .map(opp => ({
              mission_id: entry.mission_id,
              opportunity_name: opp.opportunity_name,
              opportunity_value: opp.opportunity_value
            }))
        ),
        comments
      };

      await craService.createOrUpdateCRA(data);
      toast.success("CRA sauvegardé avec succès");
      onSave();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde du CRA");
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentageColor = () => {
    if (totalPercentage > 100) return "text-red-600";
    if (totalPercentage === 100) return "text-green-600";
    return "text-orange-600";
  };

  const getMissionDisplayName = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    return mission ? `${mission.name} - ${mission.client}` : "Mission inconnue";
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur de statut */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              CRA du {new Date(selectedDate).toLocaleDateString('fr-FR')}
            </CardTitle>
            <div className={`flex items-center gap-2 font-semibold ${getPercentageColor()}`}>
              {totalPercentage === 100 ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {totalPercentage}% / 100%
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Missions et opportunités */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Missions travaillées</CardTitle>
            <Button onClick={addMissionEntry} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une mission
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {missionEntries.map((entry, missionIndex) => (
            <div key={missionIndex} className="border rounded-lg p-4 space-y-4">
              {/* En-tête de la mission */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Mission #{missionIndex + 1}</h4>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeMissionEntry(missionIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Sélection de mission et temps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mission</Label>
                  <Select 
                    value={entry.mission_id} 
                    onValueChange={(value) => updateMissionEntry(missionIndex, 'mission_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une mission" />
                    </SelectTrigger>
                    <SelectContent>
                      {missions.map(mission => (
                        <SelectItem key={mission.id} value={mission.id}>
                          {mission.name} - {mission.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Temps passé (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={entry.time_percentage}
                    onChange={(e) => updateMissionEntry(missionIndex, 'time_percentage', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Commentaire de mission */}
              <div>
                <Label>Commentaire sur cette mission (optionnel)</Label>
                <Input
                  value={entry.mission_comment}
                  onChange={(e) => updateMissionEntry(missionIndex, 'mission_comment', e.target.value)}
                  placeholder="Commentaire sur cette mission..."
                />
              </div>

              {/* Opportunités pour cette mission */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Opportunités réalisées</Label>
                  <Button 
                    onClick={() => addOpportunity(missionIndex)} 
                    size="sm" 
                    variant="outline"
                    disabled={!entry.mission_id}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter opportunité
                  </Button>
                </div>

                {entry.opportunities.map((opportunity, oppIndex) => (
                  <div key={oppIndex} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded">
                    <div className="col-span-6">
                      <Input
                        value={opportunity.opportunity_name}
                        onChange={(e) => updateOpportunity(missionIndex, oppIndex, 'opportunity_name', e.target.value)}
                        placeholder="Nom de l'opportunité..."
                        size="sm"
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <Select 
                        value={opportunity.opportunity_value.toString()} 
                        onValueChange={(value) => updateOpportunity(missionIndex, oppIndex, 'opportunity_value', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-3">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeOpportunity(missionIndex, oppIndex)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {entry.opportunities.length === 0 && (
                  <div className="text-center text-muted-foreground py-2 text-sm">
                    Aucune opportunité ajoutée pour cette mission.
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {missionEntries.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucune mission ajoutée. Cliquez sur "Ajouter une mission" pour commencer.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commentaires généraux */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires généraux</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Commentaires généraux sur cette journée..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || missionEntries.length === 0}
          className="min-w-32"
        >
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
};
