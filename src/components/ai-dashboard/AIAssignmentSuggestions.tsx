
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Request } from "@/types/types";
import AnthropicService, { AssignmentSuggestion } from "@/services/ai";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/userService";

interface AIAssignmentSuggestionsProps {
  requests: Request[];
}

export const AIAssignmentSuggestions = ({ requests }: AIAssignmentSuggestionsProps) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [assignmentResult, setAssignmentResult] = useState<AssignmentSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Fetch all users to get potential assignees
  const { data: users = [] } = useQuery({
    queryKey: ['ai-dashboard-users'],
    queryFn: getAllUsers,
  });
  
  // Filter only requests that don't have an assignee yet
  const unassignedRequests = requests.filter(r => !r.assigned_to || r.workflow_status === "pending_assignment");
  
  // Reset selection if the selected request is no longer available
  useEffect(() => {
    if (selectedRequestId && !unassignedRequests.some(r => r.id === selectedRequestId)) {
      setSelectedRequestId("");
    }
  }, [unassignedRequests, selectedRequestId]);

  const handleSuggestAssignments = async () => {
    try {
      setIsAnalyzing(true);
      setAssignmentResult(null);
      
      const selectedRequest = requests.find(r => r.id === selectedRequestId);
      if (!selectedRequest) {
        toast.error("Selected request not found");
        return;
      }
      
      // Prepare team data (all growth users)
      const growthTeamMembers = users
        .filter(user => user.role === "growth")
        .map(user => {
          // Count how many requests are assigned to this user
          const assignedCount = requests.filter(r => r.assigned_to === user.id).length;
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            currentWorkload: assignedCount,
            // You could add more properties like skills, specializations, etc.
          };
        });
      
      if (growthTeamMembers.length === 0) {
        toast.error("No growth team members found to assign requests to");
        return;
      }
      
      // Prepare request data - access properties safely from details
      const requestData = {
        id: selectedRequest.id,
        title: selectedRequest.title,
        type: selectedRequest.type,
        missionName: selectedRequest.missionName,
        details: selectedRequest.details || {},
        targeting: selectedRequest.details?.targeting || {},
        template: selectedRequest.details?.template || {},
        createdAt: selectedRequest.createdAt
      };
      
      // Send to the AI for analysis
      const result = await AnthropicService.suggestAssignments(requestData, growthTeamMembers);
      
      if (result) {
        // Enrich the result with user names if they're not provided
        if (result.topAssignments) {
          result.topAssignments = result.topAssignments.map(assignment => {
            if (!assignment.userName) {
              const user = users.find(u => u.id === assignment.userId);
              if (user) {
                assignment.userName = user.name;
              }
            }
            return assignment;
          });
        }
        
        setAssignmentResult(result);
        toast.success("Assignment suggestions generated");
      } else {
        toast.error("Failed to generate assignment suggestions");
      }
    } catch (error) {
      console.error("Error suggesting assignments:", error);
      toast.error("An error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assignment Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="font-medium">Select Unassigned Request</label>
              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a request to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedRequests.length > 0 ? (
                    unassignedRequests.map((request) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.title} - {request.type}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No unassigned requests available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleSuggestAssignments}
              disabled={isAnalyzing || !selectedRequestId || unassignedRequests.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Analyzing...
                </>
              ) : (
                "Suggest Assignments"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {assignmentResult && assignmentResult.topAssignments && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignmentResult.topAssignments.map((assignment, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-md border ${
                    index === 0 
                      ? "border-green-200 bg-green-50" 
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-lg">
                      {assignment.userName || assignment.userId}
                      {index === 0 && <span className="ml-2 text-green-600">(Best Match)</span>}
                    </h3>
                    <span className="font-bold text-lg">
                      {Math.round(assignment.matchScore)}%
                    </span>
                  </div>
                  <p className="text-gray-700">{assignment.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
