
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Request } from "@/types/types";
import { AlertCircle } from "lucide-react";

interface AnalysisFormProps {
  requests: Request[];
  selectedRequestId: string;
  customText: string;
  analysisMode: "existing" | "custom";
  isAnalyzing: boolean;
  analysisError: string | null;
  onAnalysisModeChange: (mode: "existing" | "custom") => void;
  onSelectedRequestChange: (value: string) => void;
  onCustomTextChange: (value: string) => void;
  onAnalyze: () => void;
}

export const AnalysisForm = ({
  requests,
  selectedRequestId,
  customText,
  analysisMode,
  isAnalyzing,
  analysisError,
  onAnalysisModeChange,
  onSelectedRequestChange,
  onCustomTextChange,
  onAnalyze
}: AnalysisFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 mb-4">
        <label className="font-medium">Analysis Mode</label>
        <div className="flex space-x-4">
          <Button 
            variant={analysisMode === "existing" ? "default" : "outline"} 
            onClick={() => onAnalysisModeChange("existing")}
          >
            Existing Request
          </Button>
          <Button 
            variant={analysisMode === "custom" ? "default" : "outline"} 
            onClick={() => onAnalysisModeChange("custom")}
          >
            Custom Text
          </Button>
        </div>
      </div>

      {analysisMode === "existing" ? (
        <div className="flex flex-col space-y-2">
          <label className="font-medium">Select Request</label>
          <Select value={selectedRequestId} onValueChange={onSelectedRequestChange}>
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
            onChange={(e) => onCustomTextChange(e.target.value)}
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
        onClick={onAnalyze}
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
  );
};
