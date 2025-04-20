
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, MODELS, MAX_TOKENS_TO_SAMPLE } from "./config";
import { createSystemPrompt } from "./prompts";
import { AnthropicResponse } from "./types";

const handleRequest = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
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
    
    const anthropicResponse = await callAnthropicAPI(systemPrompt, userPrompt);
    return formatResponse(anthropicResponse, path);
    
  } catch (error) {
    console.error("[Anthropic API] Unexpected error:", error);
    return handleError(error);
  }
};

const callAnthropicAPI = async (systemPrompt: string, userPrompt: string) => {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  
  if (!anthropicApiKey) {
    console.error("[Anthropic API] API key not found");
    throw new Error("API key not configured");
  }
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELS.HAIKU,
      max_tokens: MAX_TOKENS_TO_SAMPLE,
      system: systemPrompt,
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
    throw new Error(`API call failed with status ${response.status}`);
  }

  return await response.json() as AnthropicResponse;
};

const formatResponse = (result: AnthropicResponse, endpoint: string) => {
  const aiResponse = result.content?.[0]?.text;
  
  if (!aiResponse) {
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
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
  
  try {
    const parsedResponse = JSON.parse(aiResponse);
    return new Response(
      JSON.stringify({ 
        result: parsedResponse,
        endpoint,
        model: MODELS.HAIKU 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (e) {
    console.error("[Anthropic API] Failed to parse JSON from AI response:", e);
    return new Response(
      JSON.stringify({ 
        result: { raw: aiResponse },
        endpoint,
        model: MODELS.HAIKU
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

const handleError = (error: Error) => {
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
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
};

export { handleRequest };
