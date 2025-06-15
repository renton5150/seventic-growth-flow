
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, FileText, Loader2 } from "lucide-react";
import { Request } from "@/types/types";
import AnthropicService from "@/services/ai";

interface AIActivitySummaryProps {
  requests: Request[];
}

interface ActivitySummaryData {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  averageCompletionTime: string;
  topRequestTypes: Array<{ type: string; count: number }>;
  productivityTrends: string;
  recommendations: string[];
}

export const AIActivitySummary = ({ requests = [] }: AIActivitySummaryProps) => {
  const [summary, setSummary] = useState<ActivitySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  const generateSummary = async () => {
    if (!requests || requests.length === 0) {
      setError("Aucune donnée de demandes disponible pour générer le résumé");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[AI Activity Summary] Generating summary with data:", {
        requestsCount: requests.length,
        selectedPeriod,
        sampleRequest: requests[0]
      });

      // Filter requests based on selected period
      const now = new Date();
      const periodStart = new Date();
      if (selectedPeriod === 'week') {
        periodStart.setDate(now.getDate() - 7);
      } else {
        periodStart.setMonth(now.getMonth() - 1);
      }

      const filteredRequests = requests.filter(request => {
        const requestDate = new Date(request.createdAt);
        return requestDate >= periodStart;
      });

      console.log("[AI Activity Summary] Filtered requests:", {
        originalCount: requests.length,
        filteredCount: filteredRequests.length,
        period: selectedPeriod
      });

      if (filteredRequests.length === 0) {
        setError(`Aucune demande trouvée pour la période sélectionnée (${selectedPeriod === 'week' ? 'dernière semaine' : 'dernier mois'})`);
        return;
      }

      // Prepare data for AI analysis with proper validation and date handling
      const analysisData = {
        requests: filteredRequests.map(req => ({
          id: req.id || 'unknown',
          title: req.title || 'Sans titre',
          type: req.type || 'unknown',
          status: req.status || 'unknown',
          workflow_status: req.workflow_status || 'unknown',
          createdAt: req.createdAt instanceof Date ? req.createdAt.toISOString() : (req.createdAt || new Date().toISOString()),
          dueDate: req.dueDate ? (req.dueDate instanceof Date ? req.dueDate.toISOString() : req.dueDate) : null,
          missionName: req.missionName || 'Sans mission',
          sdrName: req.sdrName || 'Inconnu',
          assignedToName: req.assignedToName || 'Non assigné'
        })),
        period: selectedPeriod,
        totalCount: filteredRequests.length
      };

      const result = await AnthropicService.generateSummary(analysisData);
      
      if (result && typeof result === 'object') {
        setSummary(result);
      } else {
        throw new Error("Format de réponse invalide de l'IA");
      }
    } catch (err) {
      console.error("[AI Activity Summary] Error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la génération du résumé");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('week')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Last Week
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Last Month
              </Button>
            </div>

            <Button
              onClick={generateSummary}
              disabled={isLoading || !requests || requests.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Activity Summary
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {!requests || requests.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  Aucune donnée de demandes disponible. Assurez-vous que les données sont chargées.
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <Badge variant="secondary">{summary.totalRequests}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <Badge variant="default">{summary.completedRequests}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <Badge variant="outline">{summary.pendingRequests}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Completion Time:</span>
                  <span className="text-sm font-medium">{summary.averageCompletionTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Request Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.topRequestTypes && summary.topRequestTypes.length > 0 ? (
                  summary.topRequestTypes.map((type, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="capitalize">{type.type}</span>
                      <Badge variant="outline">{type.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun type de demande disponible</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Productivity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{summary.productivityTrends}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.recommendations && summary.recommendations.length > 0 ? (
                  summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">Aucune recommandation disponible</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
