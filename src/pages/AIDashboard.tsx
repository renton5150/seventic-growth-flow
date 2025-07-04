
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { AIRequestAnalysis } from "@/components/ai-dashboard/request-analysis";
import { AIActivitySummary } from "@/components/ai-dashboard/AIActivitySummary";
import { AIAssignmentSuggestions } from "@/components/ai-dashboard/AIAssignmentSuggestions";
import { AISimilarityFinder } from "@/components/ai-dashboard/AISimilarityFinder";
import { AIChat } from "@/components/ai-dashboard/AIChat";

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState("chat");

  // Fetch all requests for analysis tools
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['ai-dashboard-requests'],
    queryFn: getAllRequests,
  });

  return (
    <AppLayout>
      <div className="py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">AI Insights Dashboard</h1>
          <p className="text-muted-foreground">
            Powered by Claude 3 Haiku from Anthropic - Chat intelligent et analyses avancées pour vos données
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="chat">Chat IA</TabsTrigger>
            <TabsTrigger value="analyze">Request Analysis</TabsTrigger>
            <TabsTrigger value="summary">Activity Summary</TabsTrigger>
            <TabsTrigger value="assignments">Assignment Suggestions</TabsTrigger>
            <TabsTrigger value="similarities">Similarity Finder</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <AIChat />
          </TabsContent>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4" />
                  <p>Loading requests data...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="analyze">
                <AIRequestAnalysis requests={requests} />
              </TabsContent>
              <TabsContent value="summary">
                <AIActivitySummary requests={requests} />
              </TabsContent>
              <TabsContent value="assignments">
                <AIAssignmentSuggestions requests={requests} />
              </TabsContent>
              <TabsContent value="similarities">
                <AISimilarityFinder requests={requests} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AIDashboard;
