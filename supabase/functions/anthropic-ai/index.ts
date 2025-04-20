
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Models available (using the most capable one as default)
const MODELS = {
  OPUS: "claude-3-opus-20240229",
  SONNET: "claude-3-sonnet-20240229",
  HAIKU: "claude-3-haiku-20240307"
};

// Maximum tokens for context and response
const MAX_TOKENS_TO_SAMPLE = 4096;
const MAX_CONTEXT_TOKENS = 200000; // Claude Opus can handle up to 200k tokens

// Helper to create system prompts for different analysis types
const createSystemPrompt = (analysisType: string) => {
  const basePrompt = "You are Claude, an AI assistant integrated into Seventic, a project management application. ";
  
  switch (analysisType) {
    case "analyze-request":
      return basePrompt + "Analyze the text of a request and extract key information: topic, category, relevant skills needed, priority level, estimated complexity (low/medium/high), and 3-5 relevant keywords. Format as JSON.";
    case "generate-summary":
      return basePrompt + "Create a concise summary of recent activities for a team or person. Highlight patterns, achievements, bottlenecks, and provide 2-3 actionable insights. Format as JSON with 'summary', 'patterns', 'achievements', 'bottlenecks', and 'insights' keys.";
    case "suggest-assignments":
      return basePrompt + "Based on team member workloads, skills, and request details, suggest optimal assignments. Consider expertise match, current workload, and past performance. Return JSON with 'topAssignments' array containing 'userId', 'matchScore', and 'reasoning'.";
    case "find-similarities":
      return basePrompt + "Compare the provided request with historical requests to find similarities and potential duplicates. Return JSON with 'similarRequests' array containing 'requestId', 'similarityScore' (0-100), and 'matchReason'.";
    default:
      return basePrompt + "Analyze the provided data and provide insights in JSON format.";
  }
};

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
    // If no path is specified, return error
    if (!path) {
      return new Response(
        JSON.stringify({ error: "No endpoint specified" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    console.log(`[Anthropic API] Request received for endpoint: ${path}`);
    
    // Parse the request body
    const requestBody = await req.json();
    const { text, data } = requestBody;
    
    if (!text && !data) {
      return new Response(
        JSON.stringify({ error: "Request must include 'text' or 'data' field" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    // Get the appropriate system prompt based on the endpoint
    let systemPrompt = "";
    let userPrompt = "";
    
    switch (path) {
      case "analyze-request":
        systemPrompt = createSystemPrompt("analyze-request");
        userPrompt = `Please analyze this request: ${text}`;
        break;
      case "generate-summary":
        systemPrompt = createSystemPrompt("generate-summary");
        userPrompt = `Generate a summary based on this activity data: ${JSON.stringify(data)}`;
        break;
      case "suggest-assignments":
        systemPrompt = createSystemPrompt("suggest-assignments");
        userPrompt = `Suggest assignments based on this request and team data: ${JSON.stringify(data)}`;
        break;
      case "find-similarities":
        systemPrompt = createSystemPrompt("find-similarities");
        userPrompt = `Find similarities between this request: "${text}" and these historical requests: ${JSON.stringify(data)}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid endpoint" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
    }
    
    // Call Anthropic API
    console.log(`[Anthropic API] Calling Claude with system prompt for: ${path}`);
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!anthropicApiKey) {
      console.error("[Anthropic API] API key not found");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    // FIXED: Using the correct API format for Claude with system parameter at the root
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELS.HAIKU, // Using Haiku model for faster responses
        max_tokens: MAX_TOKENS_TO_SAMPLE,
        system: systemPrompt, // System prompt as a separate parameter, not in messages array
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[Anthropic API] Error: ${response.status} ${errorData}`);
      
      // Return a more graceful error that won't show an alert to users
      return new Response(
        JSON.stringify({ 
          result: {
            error: `API call failed with status ${response.status}`,
            fallbackData: {
              topic: "Could not analyze",
              category: "Error",
              relevantSkills: ["N/A"],
              priorityLevel: "Medium",
              complexity: "medium",
              keywords: ["Error"]
            }
          } 
        }),
        {
          status: 200, // Return 200 status to prevent errors in the UI
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    const result = await response.json();
    console.log("[Anthropic API] Successfully received response");
    
    // Extract the content from the Claude response
    const aiResponse = result.content && result.content[0] && result.content[0].text;
    
    if (!aiResponse) {
      // Provide fallback data instead of an error
      return new Response(
        JSON.stringify({ 
          result: {
            fallbackData: {
              topic: "No response",
              category: "Error",
              relevantSkills: ["N/A"],
              priorityLevel: "Medium",
              complexity: "medium",
              keywords: ["No response"]
            }
          } 
        }),
        {
          status: 200, // Return 200 status to prevent errors in the UI
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    // Try to parse the JSON response
    let parsedResponse;
    try {
      // If the response is already JSON, return it directly
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error("[Anthropic API] Failed to parse JSON from AI response:", e);
      // If parsing fails, return the raw text but wrap it in a proper JSON structure
      parsedResponse = { raw: aiResponse };
    }
    
    // Return the AI response
    return new Response(
      JSON.stringify({ 
        result: parsedResponse,
        endpoint: path,
        model: MODELS.HAIKU 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
    
  } catch (error) {
    console.error("[Anthropic API] Unexpected error:", error);
    
    // Return a graceful error that won't show an alert to users
    return new Response(
      JSON.stringify({ 
        result: {
          error: error.message || "Unknown error occurred",
          fallbackData: {
            topic: "Error occurred",
            category: "Error",
            relevantSkills: ["N/A"],
            priorityLevel: "Medium",
            complexity: "medium",
            keywords: ["Error"]
          }
        }
      }),
      {
        status: 200, // Return 200 status to prevent the UI from showing errors
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
