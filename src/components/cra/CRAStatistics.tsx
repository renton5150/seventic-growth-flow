
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Target, Award } from "lucide-react";
import { craService } from "@/services/cra/craService";
import { CRAStatistics as CRAStatsType } from "@/types/cra.types";

interface CRAStatisticsProps {
  sdrId?: string;
}

export const CRAStatistics = ({ sdrId }: CRAStatisticsProps) => {
  const [statistics, setStatistics] = useState<CRAStatsType[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState("custom");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [startDate, endDate, sdrId]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const stats = await craService.getCRAStatistics(startDate, endDate, sdrId);
      setStatistics(stats);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const today = new Date();
    
    switch (newPeriod) {
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case "month":
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case "quarter":
        const quarterStart = new Date(today);
        quarterStart.setMonth(today.getMonth() - 3);
        setStartDate(quarterStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case "year":
        const yearStart = new Date(today);
        yearStart.setFullYear(today.getFullYear() - 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Contrôles de période */}
      <Card>
        <CardHeader>
          <CardTitle>Période d'analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Dernière semaine</SelectItem>
                <SelectItem value="month">Dernier mois</SelectItem>
                <SelectItem value="quarter">Dernier trimestre</SelectItem>
                <SelectItem value="year">Dernière année</SelectItem>
                <SelectItem value="custom">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>
            
            {period === "custom" && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-fit"
                />
                <span>à</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-fit"
                />
              </>
            )}
            
            <Button onClick={loadStatistics} disabled={isLoading}>
              {isLoading ? "Chargement..." : "Analyser"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats statistiques */}
      {statistics.length > 0 ? (
        <div className="space-y-6">
          {statistics.map((stat, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {stat.sdr_name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {stat.total_reports} CRA sur la période ({stat.period})
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Résumé global */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="font-semibold">Rapports complétés</div>
                        <div className="text-2xl font-bold">{stat.total_reports}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Target className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="font-semibold">Missions travaillées</div>
                        <div className="text-2xl font-bold">{stat.mission_breakdown.length}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Award className="h-8 w-8 text-purple-500" />
                      <div>
                        <div className="font-semibold">Total opportunités</div>
                        <div className="text-2xl font-bold">
                          {stat.mission_breakdown.reduce((sum, mb) => sum + mb.opportunities_count, 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détail par mission */}
                  <div>
                    <h4 className="font-semibold mb-3">Répartition par mission</h4>
                    <div className="space-y-3">
                      {stat.mission_breakdown
                        .sort((a, b) => b.total_percentage - a.total_percentage)
                        .map((mission, mIndex) => (
                          <div key={mIndex} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{mission.mission_name}</div>
                                <div className="text-sm text-muted-foreground">{mission.mission_client}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg">
                                  {mission.average_percentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  moyenne par jour
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t">
                              <div>
                                <div className="text-sm text-muted-foreground">Total temps</div>
                                <div className="font-semibold">{mission.total_percentage}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Opportunités</div>
                                <div className="font-semibold">{mission.opportunities_count}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Valeur opps</div>
                                <div className="font-semibold">{mission.total_opportunity_value}%</div>
                              </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(mission.average_percentage, 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {isLoading ? "Chargement des statistiques..." : "Aucune donnée disponible pour cette période"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
