
import { SystemPromptType } from "./types.ts";

const basePrompt = "You are Claude, an AI assistant integrated into Seventic, a project management application. ";

const systemPrompts: SystemPromptType = {
  "analyze-request": basePrompt + "Analyze the text of a request and extract key information: topic, category, relevant skills needed, priority level, estimated complexity (low/medium/high), and 3-5 relevant keywords. Format as JSON.",
  "generate-summary": basePrompt + "Create a concise summary of recent activities for a team or person. Highlight patterns, achievements, bottlenecks, and provide 2-3 actionable insights. Format as JSON with 'summary', 'patterns', 'achievements', 'bottlenecks', and 'insights' keys.",
  "suggest-assignments": basePrompt + "Based on team member workloads, skills, and request details, suggest optimal assignments. Consider expertise match, current workload, and past performance. Return JSON with 'topAssignments' array containing 'userId', 'matchScore', and 'reasoning'.",
  "find-similarities": basePrompt + "Compare the provided request with historical requests to find similarities and potential duplicates. Return JSON with 'similarRequests' array containing 'requestId', 'similarityScore' (0-100), and 'matchReason'.",
  "default": basePrompt + "Analyze the provided data and provide insights in JSON format."
};

export const createSystemPrompt = (analysisType: string): string => {
  return systemPrompts[analysisType] || systemPrompts.default;
};
