
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[Anthropic API] Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("[Anthropic API] API key not found");
      throw new Error("API key not configured");
    }

    // Parse request body
    const { text } = await req.json();
    if (!text) {
      console.error("[Anthropic API] No text provided in request");
      throw new Error("Request must include 'text' field");
    }

    console.log("[Anthropic API] Sending request to Claude API with text:", text.substring(0, 50) + "...");

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: "You are Claude, an AI assistant integrated into Seventic, a project management application. Analyze the text of a request and extract key information: topic, category, relevant skills needed, priority level, estimated complexity (low/medium/high), and 3-5 relevant keywords. Format as JSON.",
        messages: [
          { role: "user", content: text }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Anthropic API] Error from Claude API: ${response.status} ${errorText}`);
      throw new Error(`Claude API call failed with status ${response.status}`);
    }

    const anthropicResponse = await response.json();
    console.log("[Anthropic API] Received response from Claude");

    // Extract the text from Claude's response
    const aiResponse = anthropicResponse.content?.[0]?.text;
    if (!aiResponse) {
      console.error("[Anthropic API] No text in Claude's response");
      throw new Error("No response text from Claude");
    }

    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return new Response(
        JSON.stringify({
          result: parsedResponse,
          endpoint: "analyze-request",
          model: "claude-3-haiku-20240307"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } catch (e) {
      console.error("[Anthropic API] Failed to parse JSON from Claude response:", e);
      // Return raw response if JSON parsing fails
      return new Response(
        JSON.stringify({
          result: { raw: aiResponse },
          endpoint: "analyze-request",
          model: "claude-3-haiku-20240307"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

  } catch (error) {
    console.error("[Anthropic API] Error:", error);
    // Return a 200 with fallback data instead of error status
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  }
});
