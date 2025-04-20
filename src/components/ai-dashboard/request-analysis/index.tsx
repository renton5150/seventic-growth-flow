
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";
import { useRequestAnalysis } from "./useRequestAnalysis";
import { AnalysisForm } from "./AnalysisForm";
import { AnalysisResult } from "./AnalysisResult";

interface AIRequestAnalysisProps {
  requests: Request[];
}

export const AIRequestAnalysis = ({ requests }: AIRequestAnalysisProps) => {
  const {
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
  } = useRequestAnalysis(requests);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisForm
            requests={requests}
            selectedRequestId={selectedRequestId}
            customText={customText}
            analysisMode={analysisMode}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            onAnalysisModeChange={setAnalysisMode}
            onSelectedRequestChange={setSelectedRequestId}
            onCustomTextChange={setCustomText}
            onAnalyze={handleAnalyze}
          />
        </CardContent>
      </Card>

      {analysisResult && <AnalysisResult analysisResult={analysisResult} />}
    </div>
  );
};

export default AIRequestAnalysis;
