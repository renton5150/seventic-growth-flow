
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { craService } from "@/services/cra/craService";
import { getActiveMissions } from "@/services/cra/missionService";
import { CreateCRARequest } from "@/types/cra.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Mission {
  id: string;
  name: string;
  client: string;
}

interface MissionData {
  mission_id: string;
  time_percentage: number;
  mission_comment: string;
  opportunity_5: string;
  opportunity_10: string;
  opportunity_20: string;
}

interface CRATableFormProps {
  selectedDate: string;
  onSave: () => void;
}

export const CRATableForm = ({ selectedDate, onSave }: CRATableFormProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionData, setMissionData] = useState<{ [key: string]: MissionData }>({});
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPercentage, setTotalPercentage] = useState(0);

  useEffect(() => {
    loadMissions();
    loadExistingCRA();
  }, [selectedDate]);

  useEffect(() => {
    const total = Object.values(missionData).reduce((sum, data) => sum + (data.time_percentage || 0), 0);
    setTotalPercentage(total);
  }, [missionData]);

  const loadMissions = async () => {
    try {
      const missionsData = await getActiveMissions();
      setMissions(missionsData || []);
      
      // Initialize mission data for all missions
      const initialData: { [key: string]: MissionData } = {};
      missionsData.forEach(mission => {
        initialData[mission.id] = {
          mission_id: mission.id,
          time_percentage: 0,
          mission_comment: "",
          opportunity_5: "",
          opportunity_10: "",
          opportunity_20: ""
        };
      });
      setMissionData(initialData);
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
        setComments(report.comments || "");
        
        // Load existing data
        const existingData: { [key: string]: MissionData } = {};
        
        missionTimes.forEach(mt => {
          existingData[mt.mission_id] = {
            mission_id: mt.mission_id,
            time_percentage: mt.time_percentage,
            mission_comment: mt.mission_comment || "",
            opportunity_5: "",
            opportunity_10: "",
            opportunity_20: ""
          };
        });

        // Load opportunities and group them by value
        opportunities.forEach(opp => {
          if (existingData[opp.mission_id]) {
            const currentValue = existingData[opp.mission_id];
            if (opp.opportunity_value === 5) {
              currentValue.opportunity_5 = currentValue.opportunity_5 
                ? currentValue.opportunity_5 + "\n" + opp.opportunity_name 
                : opp.opportunity_name;
            } else if (opp.opportunity_value === 10) {
              currentValue.opportunity_10 = currentValue.opportunity_10 
                ? currentValue.opportunity_10 + "\n" + opp.opportunity_name 
                : opp.opportunity_name;
            } else if (opp.opportunity_value === 20) {
              currentValue.opportunity_20 = currentValue.opportunity_20 
                ? currentValue.opportunity_20 + "\n" + opp.opportunity_name 
                : opp.opportunity_name;
            }
          }
        });

        setMissionData(prev => ({ ...prev, ...existingData }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement du CRA:", error);
    }
  };

  const updateMissionData = (missionId: string, field: keyof MissionData, value: string | number) => {
    setMissionData(prev => ({
      ...prev,
      [missionId]: {
        ...prev[missionId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (totalPercentage > 100) {
      toast.error("Le total des pourcentages ne peut pas dépasser 100%");
      return;
    }

    const activeMissions = Object.values(missionData).filter(data => data.time_percentage > 0);
    
    if (activeMissions.length === 0) {
      toast.error("Veuillez ajouter au moins une mission avec du temps passé");
      return;
    }

    setIsLoading(true);
    try {
      const data: CreateCRARequest = {
        report_date: selectedDate,
        mission_times: activeMissions.map(data => ({
          mission_id: data.mission_id,
          time_percentage: data.time_percentage,
          mission_comment: data.mission_comment
        })),
        opportunities: activeMissions.flatMap(data => {
          const opps = [];
          
          // Split each opportunity field by newlines and create separate entries
          if (data.opportunity_5.trim()) {
            const opportunities5 = data.opportunity_5.split('\n').filter(opp => opp.trim());
            opportunities5.forEach(opp => {
              opps.push({
                mission_id: data.mission_id,
                opportunity_name: opp.trim(),
                opportunity_value: 5 as 5 | 10 | 20
              });
            });
          }
          
          if (data.opportunity_10.trim()) {
            const opportunities10 = data.opportunity_10.split('\n').filter(opp => opp.trim());
            opportunities10.forEach(opp => {
              opps.push({
                mission_id: data.mission_id,
                opportunity_name: opp.trim(),
                opportunity_value: 10 as 5 | 10 | 20
              });
            });
          }
          
          if (data.opportunity_20.trim()) {
            const opportunities20 = data.opportunity_20.split('\n').filter(opp => opp.trim());
            opportunities20.forEach(opp => {
              opps.push({
                mission_id: data.mission_id,
                opportunity_name: opp.trim(),
                opportunity_value: 20 as 5 | 10 | 20
              });
            });
          }
          
          return opps;
        }),
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

      {/* Tableau des missions */}
      <Card>
        <CardHeader>
          <CardTitle>Missions et activités</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Mission</TableHead>
                <TableHead className="w-[120px]">Temps passé (%)</TableHead>
                <TableHead className="w-[200px]">5%</TableHead>
                <TableHead className="w-[200px]">10%</TableHead>
                <TableHead className="w-[200px]">20%</TableHead>
                <TableHead>Activités</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((mission) => {
                const data = missionData[mission.id] || {
                  mission_id: mission.id,
                  time_percentage: 0,
                  mission_comment: "",
                  opportunity_5: "",
                  opportunity_10: "",
                  opportunity_20: ""
                };
                
                return (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{mission.name}</div>
                        <div className="text-sm text-muted-foreground">{mission.client}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={data.time_percentage || ""}
                        onChange={(e) => updateMissionData(mission.id, 'time_percentage', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={data.opportunity_5}
                        onChange={(e) => updateMissionData(mission.id, 'opportunity_5', e.target.value)}
                        placeholder="Opportunité 5%&#10;(une par ligne)"
                        disabled={data.time_percentage === 0}
                        rows={3}
                        className="min-h-[80px] resize-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={data.opportunity_10}
                        onChange={(e) => updateMissionData(mission.id, 'opportunity_10', e.target.value)}
                        placeholder="Opportunité 10%&#10;(une par ligne)"
                        disabled={data.time_percentage === 0}
                        rows={3}
                        className="min-h-[80px] resize-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={data.opportunity_20}
                        onChange={(e) => updateMissionData(mission.id, 'opportunity_20', e.target.value)}
                        placeholder="Opportunité 20%&#10;(une par ligne)"
                        disabled={data.time_percentage === 0}
                        rows={3}
                        className="min-h-[80px] resize-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={data.mission_comment}
                        onChange={(e) => updateMissionData(mission.id, 'mission_comment', e.target.value)}
                        placeholder="Commentaire sur cette mission..."
                        disabled={data.time_percentage === 0}
                        rows={3}
                        className="min-h-[80px] resize-none"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
};
