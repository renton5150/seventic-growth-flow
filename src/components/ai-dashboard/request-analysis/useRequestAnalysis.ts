
import { useState } from "react";
import { RequestAnalysis } from "@/services/ai";
import AnthropicService from "@/services/ai";
import { toast } from "sonner";

export const useRequestAnalysis = (requests: any[]) => {
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
        
        if (!result.error) {
          toast.success("Analysis completed", { duration: 2000 });
        } else {
          console.warn("Analysis completed with errors:", result.error);
          setAnalysisError("Analysis could not be completed at this time. Using fallback data.");
        }
      } else {
        setAnalysisError("Could not analyze request. Please try again later.");
      }
    } catch (error) {
      console.error("Error analyzing request:", error);
      setAnalysisError("An error occurred during analysis. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    selectedRequestId,
    setSelectedRequestId,
    customText,
    setCustomText,
    analysisResult,
    isAnalyzing,
    analysisMode,
    setAnalysisMode,
    analysisError,
    handleAnalyze
  };
};
