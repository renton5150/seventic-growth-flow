
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestAnalysis } from "@/services/ai";

interface AnalysisResultProps {
  analysisResult: RequestAnalysis;
}

export const AnalysisResult = ({ analysisResult }: AnalysisResultProps) => {
  return (
    <Card>
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
  );
};
