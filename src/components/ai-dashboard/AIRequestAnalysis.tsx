
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Request } from "@/types/types";
import AnthropicService, { RequestAnalysis } from "@/services/ai/anthropicService";
import { AlertCircle } from "lucide-react";

interface AIRequestAnalysisProps {
  requests: Request[];
}

export const AIRequestAnalysis = ({ requests }: AIRequestAnalysisProps) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<RequestAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisMode, setAnalysisMode] = useState<"existing" | "custom">("existing");
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setAnalysisError(null);
      
      let textToAnalyze = "";
      
      if (analysisMode === "existing") {
        const selectedRequest = requests.find(r => r.id === selectedRequestId);
        if (!selectedRequest) {
          setAnalysisError("Selected request not found");
          return;
        }
        textToAnalyze = `Title: ${selectedRequest.title}
                        Type: ${selectedRequest.type}
                        Details: ${JSON.stringify(selectedRequest.details || {})}`;
      } else {
        textToAnalyze = customText;
      }
      
      if (!textToAnalyze.trim()) {
        setAnalysisError("Please provide text to analyze");
        return;
      }
      
      const result = await AnthropicService.analyzeRequest(textToAnalyze);
      
      if (result) {
        setAnalysisResult(result);
        
        // Only show success toast if there was no error, and do NOT show error toasts
        // This prevents intrusive error popups when there are API issues
        if (!result.error) {
          toast.success("Analysis completed", { duration: 2000 });
        } else {
          // Log the error but don't show intrusive popups
          console.warn("Analysis completed with errors:", result.error);
          setAnalysisError("Analysis could not be completed at this time. Using fallback data.");
        }
      } else {
        // Show a less intrusive error in the component instead of a toast
        setAnalysisError("Could not analyze request. Please try again later.");
      }
    } catch (error) {
      console.error("Error analyzing request:", error);
      setAnalysisError("An error occurred during analysis. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2 mb-4">
              <label className="font-medium">Analysis Mode</label>
              <div className="flex space-x-4">
                <Button 
                  variant={analysisMode === "existing" ? "default" : "outline"} 
                  onClick={() => setAnalysisMode("existing")}
                >
                  Existing Request
                </Button>
                <Button 
                  variant={analysisMode === "custom" ? "default" : "outline"} 
                  onClick={() => setAnalysisMode("custom")}
                >
                  Custom Text
                </Button>
              </div>
            </div>

            {analysisMode === "existing" ? (
              <div className="flex flex-col space-y-2">
                <label className="font-medium">Select Request</label>
                <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a request to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {requests.map((request) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.title} - {request.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <label className="font-medium">Enter Text</label>
                <Textarea
                  placeholder="Enter request text to analyze..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            )}

            {analysisError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-800 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{analysisError}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={isAnalyzing || (analysisMode === "existing" && !selectedRequestId) || (analysisMode === "custom" && !customText.trim())}
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Analyzing...
                </>
              ) : (
                "Analyze Request"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Topic</p>
                  <p>{analysisResult.topic}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Category</p>
                  <p>{analysisResult.category}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Priority Level</p>
                  <p>{analysisResult.priorityLevel}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Complexity</p>
                  <p>{analysisResult.complexity}</p>
                </div>
              </div>

              <div>
                <p className="font-medium text-sm text-muted-foreground mb-2">Relevant Skills</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.relevantSkills?.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {skill}
                    </Badge>
                  )) || <p className="text-muted-foreground">No skills data available</p>}
                </div>
              </div>

              <div>
                <p className="font-medium text-sm text-muted-foreground mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywords?.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50">
                      {keyword}
                    </Badge>
                  )) || <p className="text-muted-foreground">No keywords data available</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
