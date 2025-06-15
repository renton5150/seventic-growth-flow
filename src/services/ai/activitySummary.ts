
import { anthropicConfig } from './config';

interface RequestData {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  createdAt: string;
  dueDate: string | null;
  missionName: string;
  sdrName: string;
  assignedToName: string;
}

interface AnalysisData {
  requests: RequestData[];
  period: 'week' | 'month';
  totalCount: number;
}

export const generateSummary = async (data: AnalysisData) => {
  try {
    console.log("[Anthropic Service] Generating summary for activities");
    
    if (!data || !data.requests || !Array.isArray(data.requests)) {
      throw new Error("Invalid data structure: requests array is required");
    }

    if (data.requests.length === 0) {
      throw new Error("No requests data available for the selected period");
    }

    // Prepare the context for AI analysis
    const requestsSummary = data.requests.map(req => ({
      type: req.type,
      status: req.workflow_status,
      createdAt: req.createdAt,
      mission: req.missionName,
      sdr: req.sdrName,
      assignedTo: req.assignedToName
    }));

    // Calculate basic statistics
    const totalRequests = data.requests.length;
    const completedRequests = data.requests.filter(r => r.workflow_status === 'completed').length;
    const pendingRequests = data.requests.filter(r => r.workflow_status === 'pending_assignment' || r.workflow_status === 'in_progress').length;

    // Calculate request types
    const typeStats = data.requests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRequestTypes = Object.entries(typeStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const prompt = `
Analyze the following activity data for the ${data.period === 'week' ? 'last week' : 'last month'} and provide insights:

Total Requests: ${totalRequests}
Completed: ${completedRequests}
Pending: ${pendingRequests}

Request Types: ${JSON.stringify(typeStats)}

Sample Requests: ${JSON.stringify(requestsSummary.slice(0, 10))}

Please provide:
1. A brief analysis of productivity trends
2. 3-5 actionable recommendations for improvement
3. Any patterns you notice in the data

Format your response as a valid JSON object with these exact keys:
{
  "totalRequests": ${totalRequests},
  "completedRequests": ${completedRequests},
  "pendingRequests": ${pendingRequests},
  "averageCompletionTime": "calculated time or estimated",
  "topRequestTypes": ${JSON.stringify(topRequestTypes)},
  "productivityTrends": "your analysis here",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": anthropicConfig.apiKey
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Anthropic Service] API Error:", response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.content || !result.content[0] || !result.content[0].text) {
      console.error("[Anthropic Service] Invalid response structure:", result);
      throw new Error("Invalid response structure from Anthropic API");
    }

    const aiResponse = result.content[0].text;
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(aiResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error("[Anthropic Service] Failed to parse AI response as JSON:", aiResponse);
      
      // Fallback: return a basic summary with the data we have
      return {
        totalRequests,
        completedRequests,
        pendingRequests,
        averageCompletionTime: "Données non disponibles",
        topRequestTypes,
        productivityTrends: "Analyse automatique: L'équipe a traité " + totalRequests + " demandes avec un taux de completion de " + Math.round((completedRequests / totalRequests) * 100) + "%.",
        recommendations: [
          "Analyser les demandes en attente pour améliorer les délais",
          "Optimiser la répartition des tâches selon les types de demandes",
          "Mettre en place un suivi plus régulier des demandes en cours"
        ]
      };
    }

  } catch (error) {
    console.error("[Anthropic Service] Error in generateSummary:", error);
    throw error;
  }
};
