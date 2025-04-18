
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Request } from "@/types/types";
import AnthropicService, { ActivitySummary } from "@/services/ai/anthropicService";

interface AIActivitySummaryProps {
  requests: Request[];
}

export const AIActivitySummary = ({ requests }: AIActivitySummaryProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("week");
  const [summaryResult, setSummaryResult] = useState<ActivitySummary | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);
      setSummaryResult(null);
      
      // Filter requests based on the selected time period
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (selectedPeriod) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      // Filter and prepare the data
      const filteredRequests = requests.filter(r => 
        new Date(r.createdAt) >= cutoffDate
      ).map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
        sdrName: r.sdrName,
        missionName: r.missionName,
        workflow_status: r.workflow_status,
        assignedToName: r.assignedToName || null,
        lastUpdated: r.lastUpdated
      }));
      
      if (filteredRequests.length === 0) {
        toast.error(`No requests found for the selected period (${selectedPeriod})`);
        return;
      }
      
      // Group requests by mission or by SDR
      const requestsByMission: Record<string, Request[]> = {};
      const requestsBySDR: Record<string, Request[]> = {};
      
      filteredRequests.forEach(r => {
        // Group by mission
        const missionKey = r.missionName || 'Unknown Mission';
        if (!requestsByMission[missionKey]) {
          requestsByMission[missionKey] = [];
        }
        requestsByMission[missionKey].push(r);
        
        // Group by SDR
        const sdrKey = r.sdrName || 'Unknown SDR';
        if (!requestsBySDR[sdrKey]) {
          requestsBySDR[sdrKey] = [];
        }
        requestsBySDR[sdrKey].push(r);
      });
      
      // Prepare data for AI analysis
      const activityData = {
        period: selectedPeriod,
        totalRequests: filteredRequests.length,
        requestsByMission,
        requestsBySDR,
        completedCount: filteredRequests.filter(r => r.workflow_status === "completed").length,
        pendingCount: filteredRequests.filter(r => r.workflow_status === "pending_assignment").length,
        inProgressCount: filteredRequests.filter(r => r.workflow_status === "in_progress").length,
        typeDistribution: {
          email: filteredRequests.filter(r => r.type === "email").length,
          database: filteredRequests.filter(r => r.type === "database").length,
          linkedin: filteredRequests.filter(r => r.type === "linkedin").length,
        }
      };
      
      // Send to the AI for analysis
      const result = await AnthropicService.generateSummary(activityData);
      
      if (result) {
        setSummaryResult(result);
        toast.success("Summary generated successfully");
      } else {
        toast.error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("An error occurred while generating the summary");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="font-medium">Select Time Period</label>
              <div className="flex space-x-4">
                <Button 
                  variant={selectedPeriod === "week" ? "default" : "outline"} 
                  onClick={() => setSelectedPeriod("week")}
                >
                  Last Week
                </Button>
                <Button 
                  variant={selectedPeriod === "month" ? "default" : "outline"} 
                  onClick={() => setSelectedPeriod("month")}
                >
                  Last Month
                </Button>
                <Button 
                  variant={selectedPeriod === "quarter" ? "default" : "outline"} 
                  onClick={() => setSelectedPeriod("quarter")}
                >
                  Last Quarter
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Generating Summary...
                </>
              ) : (
                "Generate Activity Summary"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {summaryResult && (
        <Card>
          <CardHeader>
            <CardTitle>Summary Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Overview</h3>
                <p className="text-gray-700">{summaryResult.summary}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Key Patterns</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {summaryResult.patterns.map((pattern, index) => (
                    <li key={index} className="text-gray-700">{pattern}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Achievements</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {summaryResult.achievements.map((achievement, index) => (
                    <li key={index} className="text-gray-700">{achievement}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Bottlenecks</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {summaryResult.bottlenecks.map((bottleneck, index) => (
                    <li key={index} className="text-gray-700">{bottleneck}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Actionable Insights</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {summaryResult.insights.map((insight, index) => (
                    <li key={index} className="text-green-700 font-medium">{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
