
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
import { getMissions } from "@/services/mission";
import { CreateCRARequest } from "@/types/cra.types";

interface Mission {
  id: string;
  name: string;
  client: string;
}

interface MissionTimeEntry {
  mission_id: string;
  time_percentage: number;
  mission_comment: string;
}

interface OpportunityEntry {
  mission_id: string;
  opportunity_name: string;
  opportunity_value: 5 | 10 | 20;
}

interface CRAFormProps {
  selectedDate: string;
  onSave: () => void;
}

export const CRAForm = ({ selectedDate, onSave }: CRAFormProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionTimes, setMissionTimes] = useState<MissionTimeEntry[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityEntry[]>([]);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPercentage, setTotalPercentage] = useState(0);

  useEffect(() => {
    loadMissions();
    loadExistingCRA();
  }, [selectedDate]);

  useEffect(() => {
    const total = missionTimes.reduce((sum, mt) => sum + (mt.time_percentage || 0), 0);
    setTotalPercentage(total);
  }, [missionTimes]);

  const loadMissions = async () => {
    try {
      const missionsData = await getMissions();
      setMissions(missionsData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des missions:", error);
      toast.error("Erreur lors du chargement des missions");
    }
  };

  const loadExistingCRA = async () => {
    try {
      const { report, missionTimes: existingTimes, opportunities: existingOpps } = 
        await craService.getCRAByDate(selectedDate);
      
      if (report) {
        setMissionTimes(existingTimes.map(mt => ({
          mission_id: mt.mission_id,
          time_percentage: mt.time_percentage,
          mission_comment: mt.mission_comment || ""
        })));
        setOpportunities(existingOpps.map(opp => ({
          mission_id: opp.mission_id,
          opportunity_name: opp.opportunity_name,
          opportunity_value: opp.opportunity_value
        })));
        setComments(report.comments || "");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du CRA:", error);
    }
  };

  const addMissionTime = () => {
    setMissionTimes([...missionTimes, { mission_id: "", time_percentage: 0, mission_comment: "" }]);
  };

  const updateMissionTime = (index: number, field: keyof MissionTimeEntry, value: any) => {
    const updated = [...missionTimes];
    updated[index] = { ...updated[index], [field]: value };
    setMissionTimes(updated);
  };

  const removeMissionTime = (index: number) => {
    setMissionTimes(missionTimes.filter((_, i) => i !== index));
  };

  const addOpportunity = () => {
    setOpportunities([...opportunities, { mission_id: "", opportunity_name: "", opportunity_value: 5 }]);
  };

  const updateOpportunity = (index: number, field: keyof OpportunityEntry, value: any) => {
    const updated = [...opportunities];
    updated[index] = { ...updated[index], [field]: value };
    setOpportunities(updated);
  };

  const removeOpportunity = (index: number) => {
    setOpportunities(opportunities.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (totalPercentage > 100) {
      toast.error("Le total des pourcentages ne peut pas dépasser 100%");
      return;
    }

    if (missionTimes.length === 0) {
      toast.error("Veuillez ajouter au moins une mission");
      return;
    }

    setIsLoading(true);
    try {
      const data: CreateCRARequest = {
        report_date: selectedDate,
        mission_times: missionTimes.filter(mt => mt.mission_id && mt.time_percentage > 0),
        opportunities: opportunities.filter(opp => opp.mission_id && opp.opportunity_name),
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

      {/* Temps par mission */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Temps passé par mission</CardTitle>
            <Button onClick={addMissionTime} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une mission
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {missionTimes.map((missionTime, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg">
              <div className="col-span-3">
                <Label>Mission</Label>
                <Select 
                  value={missionTime.mission_id} 
                  onValueChange={(value) => updateMissionTime(index, 'mission_id', value)}
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
              
              <div className="col-span-2">
                <Label>Temps (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={missionTime.time_percentage}
                  onChange={(e) => updateMissionTime(index, 'time_percentage', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="col-span-6">
                <Label>Commentaire (optionnel)</Label>
                <Input
                  value={missionTime.mission_comment}
                  onChange={(e) => updateMissionTime(index, 'mission_comment', e.target.value)}
                  placeholder="Commentaire sur cette mission..."
                />
              </div>
              
              <div className="col-span-1 pt-6">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeMissionTime(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {missionTimes.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucune mission ajoutée. Cliquez sur "Ajouter une mission" pour commencer.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunités */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Opportunités</CardTitle>
            <Button onClick={addOpportunity} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une opportunité
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg">
              <div className="col-span-4">
                <Label>Mission</Label>
                <Select 
                  value={opportunity.mission_id} 
                  onValueChange={(value) => updateOpportunity(index, 'mission_id', value)}
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
              
              <div className="col-span-4">
                <Label>Nom de l'opportunité</Label>
                <Input
                  value={opportunity.opportunity_name}
                  onChange={(e) => updateOpportunity(index, 'opportunity_name', e.target.value)}
                  placeholder="Nom de l'opportunité..."
                />
              </div>
              
              <div className="col-span-3">
                <Label>Valeur</Label>
                <Select 
                  value={opportunity.opportunity_value.toString()} 
                  onValueChange={(value) => updateOpportunity(index, 'opportunity_value', parseInt(value) as 5 | 10 | 20)}
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
              
              <div className="col-span-1 pt-6">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeOpportunity(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {opportunities.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              Aucune opportunité ajoutée.
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
          disabled={isLoading || missionTimes.length === 0}
          className="min-w-32"
        >
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
};
