
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Mission {
  id: string;
  name: string;
  client: string;
}

interface MissionTime {
  missionId: string;
  percentage: number;
  comment: string;
}

interface Opportunity {
  name: string;
  value: number;
  missionId: string;
}

interface CRATableFormProps {
  date: string;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const CRATableForm = ({ date, onSubmit, initialData }: CRATableFormProps) => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionTimes, setMissionTimes] = useState<MissionTime[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMissions();
    if (initialData) {
      loadInitialData();
    }
  }, [initialData]);

  const fetchMissions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('id, name, client')
        .eq('sdr_id', user.id)
        .eq('status', 'En cours');
      
      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      toast.error('Erreur lors du chargement des missions');
    }
  };

  const loadInitialData = () => {
    // Charger les données existantes si disponibles
    if (initialData?.missionTimes) {
      setMissionTimes(initialData.missionTimes);
    }
    if (initialData?.opportunities) {
      setOpportunities(initialData.opportunities);
    }
    if (initialData?.comments) {
      setComments(initialData.comments);
    }
  };

  const addMissionTime = () => {
    setMissionTimes([...missionTimes, { missionId: "", percentage: 0, comment: "" }]);
  };

  const removeMissionTime = (index: number) => {
    setMissionTimes(missionTimes.filter((_, i) => i !== index));
  };

  const updateMissionTime = (index: number, field: keyof MissionTime, value: any) => {
    const updated = [...missionTimes];
    updated[index] = { ...updated[index], [field]: value };
    setMissionTimes(updated);
  };

  const addOpportunity = () => {
    setOpportunities([...opportunities, { name: "", value: 0, missionId: "" }]);
  };

  const removeOpportunity = (index: number) => {
    setOpportunities(opportunities.filter((_, i) => i !== index));
  };

  const updateOpportunity = (index: number, field: keyof Opportunity, value: any) => {
    const updated = [...opportunities];
    updated[index] = { ...updated[index], [field]: value };
    setOpportunities(updated);
  };

  const getTotalPercentage = () => {
    return missionTimes.reduce((sum, mt) => sum + (mt.percentage || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPercentage = getTotalPercentage();
    if (totalPercentage !== 100) {
      toast.error(`Le total des pourcentages doit être égal à 100% (actuellement: ${totalPercentage}%)`);
      return;
    }

    setLoading(true);
    try {
      const formData = {
        date,
        missionTimes: missionTimes.filter(mt => mt.missionId && mt.percentage > 0),
        opportunities: opportunities.filter(opp => opp.name && opp.value > 0 && opp.missionId),
        comments,
        totalPercentage
      };

      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Temps par mission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Répartition du temps par mission
            <Button type="button" onClick={addMissionTime} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une mission
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {missionTimes.map((missionTime, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4">
                <Label>Mission</Label>
                <Select
                  value={missionTime.missionId}
                  onValueChange={(value) => updateMissionTime(index, 'missionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} - {mission.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Pourcentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={missionTime.percentage || ""}
                  onChange={(e) => updateMissionTime(index, 'percentage', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="col-span-5">
                <Label>Commentaire</Label>
                <Input
                  value={missionTime.comment}
                  onChange={(e) => updateMissionTime(index, 'comment', e.target.value)}
                  placeholder=""
                />
              </div>
              
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMissionTime(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <div className={`text-sm font-medium ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {getTotalPercentage()}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Opportunités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Opportunités détectées
            <Button type="button" onClick={addOpportunity} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une opportunité
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4">
                <Label>Nom de l'opportunité</Label>
                <Input
                  value={opportunity.name}
                  onChange={(e) => updateOpportunity(index, 'name', e.target.value)}
                  placeholder=""
                />
              </div>
              
              <div className="col-span-2">
                <Label>Valeur (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={opportunity.value || ""}
                  onChange={(e) => updateOpportunity(index, 'value', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="col-span-5">
                <Label>Mission associée</Label>
                <Select
                  value={opportunity.missionId}
                  onValueChange={(value) => updateOpportunity(index, 'missionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} - {mission.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOpportunity(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section Commentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires généraux</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder=""
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Bouton de soumission */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || getTotalPercentage() !== 100}>
          {loading ? "Sauvegarde..." : "Sauvegarder le CRA"}
        </Button>
      </div>
    </form>
  );
};
