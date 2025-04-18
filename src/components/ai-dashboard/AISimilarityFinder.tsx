
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Request } from "@/types/types";
import AnthropicService, { SimilarityResult } from "@/services/ai/anthropicService";
import { Progress } from "@/components/ui/progress";

interface AISimilarityFinderProps {
  requests: Request[];
}

export const AISimilarityFinder = ({ requests }: AISimilarityFinderProps) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [similarityResult, setSimilarityResult] = useState<SimilarityResult | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<"existing" | "custom">("existing");

  const handleFindSimilarities = async () => {
    try {
      setIsSearching(true);
      setSimilarityResult(null);
      
      let textToSearch = "";
      let currentRequestId = "";
      
      if (searchMode === "existing") {
        const selectedRequest = requests.find(r => r.id === selectedRequestId);
        if (!selectedRequest) {
          toast.error("Selected request not found");
          return;
        }
        textToSearch = `${selectedRequest.title} ${JSON.stringify(selectedRequest.details || {})}`;
        currentRequestId = selectedRequestId;
      } else {
        textToSearch = customText;
      }
      
      if (!textToSearch.trim()) {
        toast.error("Please provide text to search for similarities");
        return;
      }
      
      // Prepare historical requests for comparison
      // Exclude the selected request from the comparison if in "existing" mode
      const historicalRequests = requests
        .filter(r => searchMode === "custom" || r.id !== currentRequestId)
        .map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          content: JSON.stringify(r.details || {}),
          missionName: r.missionName
        }));
      
      if (historicalRequests.length === 0) {
        toast.error("No requests available for comparison");
        return;
      }
      
      // Send to the AI for similarity analysis
      const result = await AnthropicService.findSimilarities(textToSearch, historicalRequests);
      
      if (result) {
        // Enrich the result with request titles if they're not provided
        if (result.similarRequests) {
          result.similarRequests = result.similarRequests.map(similar => {
            if (!similar.title) {
              const request = requests.find(r => r.id === similar.requestId);
              if (request) {
                similar.title = request.title;
              }
            }
            return similar;
          });
        }
        
        setSimilarityResult(result);
        toast.success("Similarity analysis completed");
      } else {
        toast.error("Failed to find similarities");
      }
    } catch (error) {
      console.error("Error finding similarities:", error);
      toast.error("An error occurred during analysis");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Similar Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2 mb-4">
              <label className="font-medium">Search Mode</label>
              <div className="flex space-x-4">
                <Button 
                  variant={searchMode === "existing" ? "default" : "outline"} 
                  onClick={() => setSearchMode("existing")}
                >
                  Existing Request
                </Button>
                <Button 
                  variant={searchMode === "custom" ? "default" : "outline"} 
                  onClick={() => setSearchMode("custom")}
                >
                  Custom Text
                </Button>
              </div>
            </div>

            {searchMode === "existing" ? (
              <div className="flex flex-col space-y-2">
                <label className="font-medium">Select Request</label>
                <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a request to compare" />
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
                  placeholder="Enter text to find similar requests..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleFindSimilarities}
              disabled={isSearching || (searchMode === "existing" && !selectedRequestId) || (searchMode === "custom" && !customText.trim())}
            >
              {isSearching ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Searching...
                </>
              ) : (
                "Find Similar Requests"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {similarityResult && similarityResult.similarRequests && similarityResult.similarRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Similar Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {similarityResult.similarRequests.map((similar, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-md border ${
                    similar.similarityScore > 80
                      ? "border-orange-200 bg-orange-50"
                      : similar.similarityScore > 60
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">
                      {similar.title || similar.requestId}
                    </h3>
                    <span className="font-bold">
                      {Math.round(similar.similarityScore)}%
                    </span>
                  </div>
                  <Progress value={similar.similarityScore} className="h-2 mb-2" />
                  <p className="text-gray-700 text-sm">{similar.matchReason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : similarityResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-medium">No similar requests found</p>
              <p className="text-muted-foreground">Try adjusting your search or using different text</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
